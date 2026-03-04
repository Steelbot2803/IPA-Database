import { styles as uiStyles } from '$lib/utils/styles';
import { toUserError } from '$lib/utils/userError';

export async function load({ locals }) {
	const supabase = locals.supabase;
	const errors: string[] = [];

	/* ---------- STATUS COUNTS ---------- */

	const kpiRes = await supabase.from('trs_prod_status_count_view').select('*').single();
	const kpiData = kpiRes.data ?? {
		dispatched_qty: 0,
		ready_qty: 0,
		in_process_qty: 0,
		blank_stock_qty: 0
	};
	const kpi = [
		{
			key: 'dispatched_qty',
			label: 'Dispatched',
			value: kpiData.dispatched_qty,
			class: uiStyles.c0024
		},
		{
			key: 'ready_qty',
			label: 'Ready',
			value: kpiData.ready_qty,
			class: uiStyles.c0026
		},
		{
			key: 'in_process_qty',
			label: 'In-Process',
			value: kpiData.in_process_qty,
			class: uiStyles.c0027
		},
		{
			key: 'blank_stock_qty',
			label: 'Blank-Stock',
			value: kpiData.blank_stock_qty,
			class: uiStyles.c0157
		}
	];

	if (kpiRes.error) {
		errors.push(toUserError('Could not load dashboard KPI summary', kpiRes.error.message));
	}

	/* ---------- RECENT 10 ENTRIES ---------- */

	const recentJobsRes = await supabase
		.from('trs_prod_status_view')
		.select('job_no, model_no, blank_no, serial_no, derived_status, updated_at')
		.order('updated_at', { ascending: false })
		.limit(10);

	if (recentJobsRes.error) {
		errors.push(toUserError('Could not load recent jobs', recentJobsRes.error.message));
	}

	const monthlyKPIsRes = await supabase
		.from('yearly_monthly_kpis_view')
		.select('*')
		.order('year', { ascending: false })
		.order('month', { ascending: true });

	const distinctYearsKPIsRes = await supabase
		.from('unique_years_kpis_view')
		.select('*')
		.order('distinct_year', { ascending: false });

	if (monthlyKPIsRes.error || distinctYearsKPIsRes.error) {
		errors.push(
			toUserError(
				'Could not load Monthly KPIs table completely',
				monthlyKPIsRes.error?.message || distinctYearsKPIsRes.error?.message
			)
		);
	}

	const monthlyKPIs = (monthlyKPIsRes.data ?? []).map((row) => ({
		...row,
		month: Number(row.month),
		year: Number(row.year)
	}));

	const KPIsYears = (distinctYearsKPIsRes.data ?? [])
		.map((row) => row.distinct_year)
		.filter((year) => Number.isFinite(year));

	/* ---------- DUPLICATE BLANK NO ---------- */

	const blankDuplicatesRes = await supabase
		.from('lc_duplicate_blank_no')
		.select('*')
		.order('blank_no', { ascending: true });

	if (blankDuplicatesRes.error) {
		errors.push(
			toUserError('Could not load duplicate blank numbers', blankDuplicatesRes.error.message)
		);
	}

	const serialDuplicatesRes = await supabase
		.from('duplicate_serial_no')
		.select('*')
		.order('serial_no', { ascending: true });

	if (serialDuplicatesRes.error) {
		errors.push(
			toUserError('Could not load duplicate serial numbers', serialDuplicatesRes.error.message)
		);
	}

	/* ---------- BLANK STOCK BY MODEL NO ---------- */

	const blankStockRes = await supabase
		.from('blank_stock_by_model_no_view')
		.select('*')
		.order('model_no', { ascending: true });

	if (blankStockRes.error) {
		errors.push(toUserError('Could not load blank stock summary', blankStockRes.error.message));
	}

	/* ---------- LOADCELL STOCK BY MODEL NO ---------- */

	const loadcellStockRes = await supabase
		.from('loadcell_stock_by_model_no_view')
		.select('*')
		.order('model_no', { ascending: true });

	if (loadcellStockRes.error) {
		errors.push(
			toUserError('Could not load loadcell stock summary', loadcellStockRes.error.message)
		);
	}

	return {
		kpi: kpi,
		monthlyKPIs,
		KPIsYears,
		recentJobs: recentJobsRes.data ?? [],
		blankDuplicates: blankDuplicatesRes.data ?? [],
		serialDuplicates: serialDuplicatesRes.data ?? [],
		blankStock: blankStockRes.data ?? [],
		loadcellStock: loadcellStockRes.data ?? [],
		errors
	};
}
