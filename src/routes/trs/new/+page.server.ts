import { fail } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';
import { isNDigits } from '$lib/utils/validators';

export async function load({ url }) {
	const blank_no = url.searchParams.get('blank_no');

	if (!blank_no) {
		return { blank: null };
	}

	const { data, error } = await supabase
		.from('blank_status_view')
		.select('*')
		.eq('blank_no', blank_no)
		.limit(1);

	if (error || !data || data.length === 0) {
		return { blank: null };
	}

	return { blank: data[0] };
}

export const actions = {
	create: async ({ request }) => {
		const f = Object.fromEntries(await request.formData());
		const blank_no = f.blank_no?.toString();

		/* ---------- REQUIRED FIELDS ---------- */
		if (!f.job_date || !f.job_no || !f.model_no || !f.blank_no) {
			return fail(400, { warn: 'Missing required fields' });
		}

		if (!isNDigits(f.blank_no.toString(), 7)) {
			return fail(400, { warn: 'Blank No must be exactly 7 digits' });
		}

		if (f.serial_no && !isNDigits(f.serial_no.toString(), 6)) {
			return fail(400, { warn: 'Serial No must be exactly 6 digits' });
		}

		const { data: blank, error: stockErr } = await supabase
			.from('blank_status_view')
			.select('*')
			.eq('blank_no', blank_no)
			.order('id', { ascending: false })
			.single();

		if (stockErr || !blank) {
			return fail(400, { error: 'Blank not available in stock' });
		}

		/* ---------- DUPLICATE CHECK ---------- */
		const { data: existing } = await supabase
			.from('trs_prod_status_view')
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
		const { error: insertErr } = await supabase.from('trs_prod').insert({
			job_date: f.job_date,
			job_no: f.job_no,
			model_no: f.model_no,
			blank_no: f.blank_no,

			job_card_no: f.job_card_no || null,
			serial_no: f.serial_no || null,
			customer: f.customer || null,
			remarks: f.remarks || null,

			wiring: f.wiring || null,
			tc0: f.tc0 || null,
			cycling: f.cycling || null,
			cabling: f.cabling || null,
			trimming: f.trimming || null,
			black_putty: f.black_putty || null,
			bellow_welding: f.bellow_welding || null,
			pocket_welding: f.pocket_welding || null,
			sealing_side_1: f.sealing_side_1 || null,
			sealing_side_2: f.sealing_side_2 || null,
			linearity: f.linearity || null,
			tc0_qc: f.tc0_qc || null,
			tinning: f.tinning || null,
			ready_date: f.ready_date || null,
			dispatch_date: f.dispatch_date || null
		});

		if (insertErr) {
			return fail(500, { error: insertErr.message });
		}

		return { success: true };
	}
};
