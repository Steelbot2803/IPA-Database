import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSupabase } from '$lib/supabaseServer';
import { toUserError } from '$lib/utils/userError';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const supabase = getSupabase(cookies);
	const rows = await request.json();

	if (!Array.isArray(rows) || rows.length === 0) {
		throw error(400, 'No rows submitted');
	}

	const cleaned = rows.map((r, i) => {
		if (!r.job_no) throw error(400, `Row ${i + 1}: job_no missing`);
		if (!r.model_no) throw error(400, `Row ${i + 1}: model_no missing`);
		if (!r.quantity || r.quantity <= 0) throw error(400, `Row ${i + 1}: qty invalid`);
		if (!r.planned_dispatch) throw error(400, `Row ${i + 1}: committed date missing`);
		if (!r.scheduled_month) throw error(400, `Row ${i + 1}: scheduled month missing`);

		const jobCardNo = r.job_card_no ? String(r.job_card_no).trim() : '';
		const dispatchedQtyValue =
			r.dispatched_qty === '' || r.dispatched_qty === null || r.dispatched_qty === undefined
				? null
				: Number(r.dispatched_qty);

		return {
			job_no: r.job_no.trim(),
			job_card_no: jobCardNo || null,
			model_no: r.model_no.trim(),
			quantity: Number(r.quantity),
			planned_dispatch: r.planned_dispatch,
			scheduled_month: r.scheduled_month,
			actual_dispatch: r.actual_dispatch || null,
			customer: r.customer || null,
			remarks: r.remarks || null,
			dispatched_qty: dispatchedQtyValue
		};
	});

	const { error: dbError } = await supabase
		.from('trs_prod_plan')
		.insert(cleaned)
		.order('id', { ascending: false });

	if (dbError)
		throw error(
			500,
			toUserError('Could not save production plan', dbError.message)
		);

	return json({
		success: true,
		inserted: cleaned.length
	});
};
