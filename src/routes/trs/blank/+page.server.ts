import { fail } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

const isNDigits = (val: string, n: number) => new RegExp(`^\\d{${n}}$`).test(val);

export const actions = {
	create: async ({ request }) => {
		const f = Object.fromEntries(await request.formData());

		/* ---------- REQUIRED FIELDS ---------- */
		if (!f.received_date || !f.job_no || !f.model_no || !f.blank_no) {
			return fail(400, { error: 'Missing required fields' });
		}

		if (!isNDigits(f.blank_no.toString(), 7)) {
			return fail(400, { error: 'Blank No must be exactly 7 digits' });
		}

		/* ---------- DUPLICATE CHECK ---------- */
		const { data: existing } = await supabase
			.from('blank_stock')
			.select('blank_no')
			.eq('blank_no', f.blank_no)
			.order('id', { ascending: false });

		const allowDuplicate = f.allow_duplicate_blank === 'on';

		if (existing?.length && !allowDuplicate) {
			return fail(400, {
				error: 'Blank No already exists. Enable override to proceed.'
			});
		}

		/* ---------- INSERT ---------- */
		const { error:insertErr } = await supabase.from('blank_stock').insert({
			received_date: f.received_date,
			job_no: f.job_no,
			model_no: f.model_no,
			blank_no: f.blank_no,
			
			job_card_no: f.job_card_no || null,
			remarks: f.remarks || null,
		});

		if (insertErr) {
			return fail(500, { error: insertErr.message });
		}

		return { success: true };
	}
};
