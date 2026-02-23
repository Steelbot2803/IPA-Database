import { fail } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';
import { toUserError } from '$lib/utils/userError';
import { error, info, warn } from 'console';

function parseDispatchIdentifiers(raw: string) {
	const tokens = raw
		.split(',')
		.map((token) => token.trim())
		.filter(Boolean);

	const values = new Set<number>();

	for (const token of tokens) {
		if (/^\d+$/.test(token)) {
			values.add(Number(token));
			continue;
		}

		const rangeMatch = token.match(/^(\d+)\s*-\s*(\d+)$/);
		if (!rangeMatch) {
			return {
				error: `Invalid entry: "${token}". Enter CSV or ranges such as 2600001,2600005-2600010.`
			};
		}

		const start = Number(rangeMatch[1]);
		const end = Number(rangeMatch[2]);

		if (end < start) {
			return {
				error: `Invalid range: "${token}". End value must be greater than or equal to Start value.`
			};
		}

		if (end - start > 1000) {
			return {
				error: `Range too large: "${token}". Choose a range of less than 5000 values or split the range into smaller sub-ranges.`
			};
		}

		for (let value = start; value <= end; value += 1) {
			values.add(value);
		}
	}

	if (values.size === 0) {
		return { error: 'Provide atleast one value.' };
	}

	if (values.size > 2500) {
		return { error: 'Too many values. Only 2500 values allowed per request' };
	}

	return { values: Array.from(values) };
}

/* ---------- LOAD JOB ---------- */
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
	main: async ({ request }) => {
		const f = Object.fromEntries(await request.formData());

		/* ---- HARD REQUIREMENT ---- */
		if (!f.id) {
			return fail(422, { error: 'Row ID missing. Cannot update.' });
		}

		const { data: currentJob, error: currentJobErr } = await supabase
			.from('trs_prod')
			.select('*')
			.eq('id', f.id)
			.single();

		if (currentJobErr || !currentJob) {
			return fail(500, {
				error: toUserError('Could not load existing entry for comparison', currentJobErr?.message)
			});
		}

		const updatePayload = {
			job_date: f.job_date,
			job_no: f.job_no || null,
			job_card_no: f.job_card_no ? Number(f.job_card_no) : null,
			model_no: f.model_no,
			serial_no: f.serial_no ? Number(f.serial_no) : null,
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

		const normalize = (value: unknown) => {
			if (value === null || value === '') return null;
			if (typeof value === 'string' && value.includes('T')) return value.slice(0, 10);
			return value;
		};

		const hasChanges = Object.entries(updatePayload).some(([key, value]) => {
			return normalize(currentJob[key as keyof typeof currentJob]) !== normalize(value);
		});

		if (!hasChanges) {
			return {
				info: 'Nothing changed or added'
			};
		}

		const { error } = await supabase.from('trs_prod').update(updatePayload).eq('id', f.id);

		if (error) {
			return fail(500, {
				error: toUserError('Could not update entry', error.message)
			});
		}

		return { success: true };
	},
	dispatchOnly: async ({ request }) => {
		const form = await request.formData();
		const dispatchMode = form.get('dispatch_mode') === 'serial' ? 'serial' : 'blank';
		const rawValues = String(form.get('dispatch_values') ?? '').trim();
		const dispatchDate = String(form.get('dispatch_date') ?? '').trim();

		if (!dispatchDate) {
			return fail(422, { info: "Todays's date has been used as the Dispatch Date." });
		}

		const parsed = parseDispatchIdentifiers(rawValues);

		if ('error' in parsed) {
			return fail(422, { error: parsed.error });
		}

		const column = dispatchMode === 'serial' ? 'serial_no' : 'blank_no';

		const { data: matchingRows, error: fetchError } = await supabase
			.from('trs_prod')
			.select('id')
			.in(column, parsed.values);

		if (fetchError) {
			return fail(500, {
				error: toUserError('Could not load dispatch targets.', fetchError.message)
			});
		}

		if (!matchingRows || matchingRows.length === 0) {
			return fail(404, {
				error: `No rows found for the provided ${dispatchMode === 'serial' ? 'Serial' : 'Blank'} Nos.`
			});
		}

		const ids = matchingRows.map((row) => row.id);

		const { error: updateErr } = await supabase
			.from('trs_prod')
			.update({ dispatch_date: dispatchDate })
			.in('id', ids);

		if (updateErr) {
			return fail(500, {
				error: toUserError('Could not update dispatch dates', updateErr.message)
			});
		}

		return {
			success: true,
			updatedCount: ids.length,
			message: `Dispatch date updated for ${ids.length} entr${ids.length === 1 ? 'y' : 'ies'}.`
		};
	}
};
