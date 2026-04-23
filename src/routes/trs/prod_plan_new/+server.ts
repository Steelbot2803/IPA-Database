// PATH: src/routes/trs/prod_plan_new/+server.ts
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { toUserError } from '$lib/utils/userError';
import { requireUser, requireRole } from '$lib/utils/auth';
import { requireSameOrigin } from '$lib/utils/csrf';

function parseRequiredPositiveNumber(
	value: unknown,
	rowNumber: number,
	fieldLabel: string
): number {
	const parsed = Number(value);
	if (!Number.isFinite(parsed) || parsed <= 0) {
		throw error(422, `Row ${rowNumber}: ${fieldLabel} missing/invalid`);
	}
	return parsed;
}

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

export const POST: RequestHandler = async ({ request, locals, url }) => {
	requireSameOrigin(request, url);
	const supabase = locals.supabase;

	requireUser(locals.user);
	requireRole(locals.role, 'USER');

	const rows = await request.json();

	if (!Array.isArray(rows) || rows.length === 0) {
		throw error(422, 'No rows submitted');
	}

	const cleaned = rows.map((r, i) => {
		const rowNumber = i + 1;
		if (!r.scheduled_month) throw error(422, `Row ${rowNumber}: Scheduled Month missing`);
		if (!r.job_no) throw error(422, `Row ${rowNumber}: Job No missing`);
		if (!r.model_no) throw error(422, `Row ${rowNumber}: Model No missing`);
		const quantity = parseRequiredPositiveNumber(r.quantity, rowNumber, 'Total Quantity');
		if (!r.planned_dispatch) throw error(422, `Row ${rowNumber}: Planned Dispatch date missing`);

		const jobCardNo = r.job_card_no ? String(r.job_card_no).trim() : '';
		const dispatchedQtyValue = parseOptionalNonNegativeNumber(
			r.dispatched_qty,
			rowNumber,
			'Dispatched Qty'
		);

		return {
			job_no: r.job_no.trim(),
			job_card_no: jobCardNo || null,
			model_no: r.model_no.trim(),
			quantity,
			planned_dispatch: r.planned_dispatch,
			scheduled_month: r.scheduled_month,
			actual_dispatch: r.actual_dispatch || null,
			customer: r.customer || null,
			remarks: r.remarks || null,
			dispatched_qty: dispatchedQtyValue
		};
	});

	const { error: dbError } = await supabase.from('trs_prod_plan').insert(cleaned);
	// ↑ Removed the invalid .order() call on insert

	if (dbError) throw error(500, toUserError('Could not save production plan', dbError.message));

	return json({
		success: true,
		inserted: cleaned.length
	});
};
