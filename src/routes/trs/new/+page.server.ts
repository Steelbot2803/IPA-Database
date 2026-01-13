import { fail } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

const isNDigits = (val: string, n: number) => new RegExp(`^\\d{${n}}$`).test(val);

export const actions = {
	create: async ({ request }) => {
		const f = Object.fromEntries(await request.formData());

		/* ---------- REQUIRED FIELDS ---------- */
		if (!f.job_date || !f.job_no || !f.model_no || !f.blank_no) {
			return fail(400, { error: 'Missing required fields' });
		}

		if (!isNDigits(f.blank_no.toString(), 7)) {
			return fail(400, { error: 'Blank No must be exactly 7 digits' });
		}

		if (f.serial_no && !isNDigits(f.serial_no.toString(), 6)) {
			return fail(400, { error: 'Serial No must be exactly 6 digits' });
		}

		/* ---------- DUPLICATE CHECK ---------- */
		const { data: existing } = await supabase
			.from('trs_prod_status_view')
			.select('blank_no')
			.eq('blank_no', f.blank_no)
			.order('job_date', { ascending: false });

		const allowDuplicate = f.allow_duplicate_blank === 'on';

		if (existing && !allowDuplicate) {
			return fail(400, {
				error: 'Blank No already exists. Enable override to proceed.'
			});
		}

		/* ---------- INSERT ---------- */
		const { error } = await supabase.from('trs_prod').insert({
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

		if (error) {
			return fail(500, { error: error.message });
		}

		return { success: true };
	}
};
