import { fail } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

const isNDigits = (val: string, n: number) => new RegExp(`^\\d{${n}}$`).test(val);

export const actions = {
	create: async ({ request }) => {
		const f = Object.fromEntries(await request.formData());

		if (!f.received_date || !f.job_no || !f.model_no || (!f.blank_no && f.is_batch !== 'true')) {
			return fail(400, { error: 'Missing required fields' });
		}

		const isBatch = f.is_batch === 'true';
		const allowDuplicate = f.allow_duplicate_blank === 'on';

		if (isBatch) {
			if (!f.blank_no_start || !f.blank_no_end) {
				return fail(400, { error: 'Missing start or end Blank Number' });
			}

			if (!isNDigits(f.blank_no_start.toString(), 7) || !isNDigits(f.blank_no_end.toString(), 7)) {
				return fail(400, { error: 'Starting and Ending Blank Numbers must be exactly 7 digits' });
			}

			const startNum = parseInt(f.blank_no_start.toString());
			const endNum = parseInt(f.blank_no_end.toString());
			if (endNum < startNum) {
				return fail(400, {
					error: 'Ending Blank Number must be greater than or equal to Starting Blank Number'
				});
			}

			const batchSize = endNum - startNum + 1;
			if (batchSize > 1000) {
				return fail(400, { error: 'Batch size cannot exceed 1000 Blank Numbers' });
			}

			if (!allowDuplicate) {
				const { data: existing } = await supabase
					.from('blank_stock')
					.select('blank_no')
					.gte('blank_no', startNum)
					.lte('blank_no', endNum)
					.order('id', { ascending: false });
				if (existing?.length) {
					const duplicates = existing.map((e) => e.blank_no).join(', ');
					return fail(400, {
						error: `The following Blank Numbers already exist: ${duplicates}. Enable override to proceed.`
					});
				}
			}

			const entries = [];
			for (
				let blank_no = startNum;
				blank_no <= endNum;
				blank_no++
			) {
				entries.push({
					received_date: f.received_date,
					job_no: f.job_no,
					model_no: f.model_no,
					blank_no: blank_no.toString().padStart(7, '0'),
					job_card_no: f.job_card_no || null,
					remarks: f.remarks || null
				});
			}

			const { error: batchInsertErr } = await supabase.from('blank_stock').insert(entries);
			if (batchInsertErr) {
				return fail(500, { error: batchInsertErr.message });
			}

			return { success: true, count: entries.length };
		}

		if (!f.blank_no) {
			return fail(400, { error: 'Missing blank number' });
		}

		if (!isNDigits(f.blank_no.toString(), 7)) {
			return fail(400, { error: 'Blank No must be exactly 7 digits' });
		}

		const { data: existing } = await supabase
			.from('blank_stock')
			.select('blank_no')
			.eq('blank_no', f.blank_no)
			.order('id', { ascending: false });

		if (existing?.length && !allowDuplicate) {
			return fail(400, {
				error: 'Blank No already exists. Enable override to proceed.'
			});
		}

		const { error: insertErr } = await supabase.from('blank_stock').insert({
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
