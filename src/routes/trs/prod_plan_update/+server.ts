// PATH: src/routes/trs/prod_plan_update/+server.ts
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { toUserError } from '$lib/utils/userError';
import { requireUser, requireRole } from '$lib/utils/auth';
import { requireSameOrigin } from '$lib/utils/csrf';

function parseOptionalNonNegativeNumber(
	value: unknown,
	rowNumber: number,
	fieldLabel: string
): number | null {
	if (value === '' || value === null || value === undefined) return null;
	const parsed = Number(value);
	if (!Number.isFinite(parsed) || parsed < 0) {
		throw error(422, `Row ${rowNumber}: ${fieldLabel} invalid`);
	}
	return parsed;
}

export const GET: RequestHandler = async ({ request, locals, url }) => {
	requireSameOrigin(request, url);
	const supabase = locals.supabase;

	requireUser(locals.user);

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

export const PATCH: RequestHandler = async ({ request, locals, url }) => {
	requireSameOrigin(request, url);
	const supabase = locals.supabase;

	// 🔒 GUESTs cannot update production plans
	requireUser(locals.user);
	requireRole(locals.role, 'USER');

	const rows = await request.json();

	if (!Array.isArray(rows) || rows.length === 0) {
		throw error(422, 'No rows submitted');
	}

	const cleaned = rows.map((r, i) => {
		const rowNumber = i + 1;
		if (!r.id) throw error(422, `Row ${rowNumber}: id missing`);

		const jobCardNo = r.job_card_no ? String(r.job_card_no).trim() : '';
		const quantity = parseOptionalNonNegativeNumber(r.quantity, rowNumber, 'Quantity');
		const dispatchedQtyValue = parseOptionalNonNegativeNumber(
			r.dispatched_qty,
			rowNumber,
			'Dispatched Qty'
		);

		return {
			id: r.id,
			job_card_no: jobCardNo || null,
			model_no: r.model_no?.trim() || null,
			quantity,
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
