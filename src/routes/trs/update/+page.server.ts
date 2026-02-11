import { fail } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';
import { toUserError } from '$lib/utils/userError';
import { redirect } from '@sveltejs/kit';

/* ---------- LOAD JOB BY BLANK NO ---------- */
export async function load({ url }) {
	const blank_no = url.searchParams.get('blank_no');
	const serial_no = url.searchParams.get('serial_no');
	const id = url.searchParams.get('id');
	const success = url.searchParams.get('success');
	const isDigits = (value: string | null) => (value ? /^\d+$/.test(value) : false);

	if (id) {
		const { data: job, error } = await supabase.from('trs_prod').select('*').eq('id', id).single();

		if (error || !job) {
			return {
				jobs: [],
				job: undefined,
				notFound: true
			};
		}

		return {
			jobs: [],
			job,
			success: success === 'true'
		};
	}

	const hasBlankNo = isDigits(blank_no);
	const hasSerialNo = isDigits(serial_no);

	if (!hasBlankNo && !hasSerialNo) {
		return {
			jobs: [],
			job: undefined,
			success: success === 'true'
		};
	}

	let jobs;
	let error;

	if (hasBlankNo && blank_no) {
		({ data: jobs, error } = await supabase
			.from('trs_prod')
			.select('*')
			.eq('blank_no', blank_no)
			.order('id', { ascending: false }));
	}

	if (hasSerialNo && serial_no && (jobs == null || jobs.length === 0)) {
		({ data: jobs, error } = await supabase
			.from('trs_prod')
			.select('*')
			.eq('serial_no', serial_no)
			.order('id', { ascending: false }));
	}

	if (error || !jobs || jobs.length === 0) {
		return {
			jobs: [],
			job: undefined,
			notFound: true
		};
	}

	if (jobs.length === 1) {
		return {
			jobs: [],
			job: jobs[0],
			success: success === 'true'
		};
	}

	return {
		blank_no,
		jobs,
		job: undefined,
		success: success === 'true'
	};
}

/* ---------- UPDATE JOB ---------- */
export const actions = {
	default: async ({ request }) => {
		const f = Object.fromEntries(await request.formData());

		/* ---- HARD REQUIREMENT ---- */
		if (!f.id) {
			return fail(400, { error: 'Row ID missing. Cannot update.' });
		}

		const updatePayload = {
			job_no: f.job_no,
			job_card_no: f.job_card_no || null,
			model_no: f.model_no,
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
		};

		const { error } = await supabase.from('trs_prod').update(updatePayload).eq('id', f.id);

		if (error) {
			return fail(500, {
				error: toUserError(
					'Could not update this TRS production entry in the trs_prod table',
					error.message
				)
			});
		}

		throw redirect(303, `/trs/update?success=true`);
	}
};
