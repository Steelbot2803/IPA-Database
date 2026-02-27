import { loadTablePage } from '$lib/utils/dbTableServer';

const COLUMN_META = {
	job_no: { type: 'text', label: 'Job No' },
	model_no: { type: 'text', label: 'Model No' },
	quantity: { type: 'number', label: 'Quantity' },
	pending_qty: { type: 'number', label: 'Pending Qty' },
	planned_dispatch: { type: 'date', label: 'Planned Dispatch' },
	actual_dispatch: { type: 'date', label: 'Actual Dispatch' }
} as const;

export async function load({ url, locals }) {
	const scheduledMonth =
		url.searchParams.get('scheduled_month') ??
		`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
	const electromech = url.searchParams.get('electromech') === '1';
	const table = electromech ? 'trs_prod_plan_emech' : 'trs_prod_plan_main';

	const result = await loadTablePage({
		url,
		table,
		columnMeta: COLUMN_META,
		baseQuery: (query) => query.eq('scheduled_month', scheduledMonth),
		supabase: locals.supabase
	});

	return {
		...result,
		scheduledMonth,
		electromech
	};
}
