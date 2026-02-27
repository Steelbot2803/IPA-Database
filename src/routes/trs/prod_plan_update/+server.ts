import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { toUserError } from '$lib/utils/userError';

export const GET: RequestHandler = async ({ url, locals }) => {
	const supabase = locals.supabase;
	const user = locals.user;

	if (!user) throw error(401, 'Authentication required');
	const scheduledMonth = url.searchParams.get('scheduled_month');

	if (!scheduledMonth) {
		throw error(422, 'scheduled_month parameter required!');
	}

	const { data, error: dbError } = await supabase
		.from('trs_prod_plan')
		.select('*')
		.eq('scheduled_month', scheduledMonth)
		.order('planned_dispatch', { ascending: true });

	if (dbError) throw error(500, toUserError('Could not load production plan', dbError.message));

	return json({ rows: data ?? [] });
};

export const PATCH: RequestHandler = async ({ request, locals }) => {
	const supabase = locals.supabase;
	const user = locals.user;

	if (!user) throw error(401, 'Authentication required');
	const rows = await request.json();

	if (!Array.isArray(rows) || rows.length === 0) {
		throw error(422, 'No rows submitted');
	}

	const cleaned = rows.map((r, i) => {
		if (!r.id) throw error(422, `Row ${i + 1}: id missing`);

		const jobCardNo = r.job_card_no ? String(r.job_card_no).trim() : '';
		const dispatchedQtyValue =
			r.dispatched_qty === '' || r.dispatched_qty === null || r.dispatched_qty === undefined
				? null
				: Number(r.dispatched_qty);

		return {
			id: r.id,
			job_card_no: jobCardNo || null,
			model_no: r.model_no?.trim() || null,
			quantity: r.quantity ? Number(r.quantity) : null,
			actual_dispatch: r.actual_dispatch || null,
			customer: r.customer || null,
			remarks: r.remarks || null,
			dispatched_qty: dispatchedQtyValue
		};
	});

	const { error: dbError } = await supabase
		.from('trs_prod_plan')
		.upsert(cleaned, { onConflict: 'id' });

	if (dbError) throw error(500, toUserError('Could not update production plan', dbError.message));

	return json({
		success: true,
		updated: cleaned.length
	});
};
