import { supabase } from '$lib/supabaseClient';
import { styles as uiStyles } from '$lib/utils/styles';

export async function load() {
	const errors: string[] = [];

	/* ---------- STATUS COUNTS ---------- */

	const kpiRes = await supabase.from('trs_prod_status_count_view').select('*').single();
	const kpi = [
		{
			key: 'dispatched_qty',
			label: 'Dispatched',
			value: kpiRes.data.dispatched_qty,
			class: uiStyles.c0024
		},
		{
			key: 'ready_qty',
			label: 'Ready',
			value: kpiRes.data.ready_qty,
			class: uiStyles.c0026
		},
		{
			key: 'in_process_qty',
			label: 'In-Process',
			value: kpiRes.data.in_process_qty,
			class: uiStyles.c0027
		}
	];

	if (kpiRes.error) errors.push(`KPIs: ${kpiRes.error.message}`);

	/* ---------- RECENT 10 ENTRIES ---------- */

	const recetJobsRes = await supabase
		.from('trs_prod_status_view')
		.select('job_no, model_no, blank_no, serial_no, derived_status, updated_at')
		.order('updated_at', { ascending: false })
		.limit(10);

	if (recetJobsRes.error) errors.push(`Recent Jobs: ${recetJobsRes.error.message}`);

	/* ---------- DUPLICATE BLANK NO ---------- */

	const blankDuplicatesRes = await supabase
		.from('lc_duplicate_blank_no')
		.select('*')
		.order('blank_no', { ascending: true });

	if (blankDuplicatesRes.error)
		errors.push(`Blank Duplicates: ${blankDuplicatesRes.error.message}`);

	const serialDuplicatesRes = await supabase
		.from('duplicate_serial_no')
		.select('*')
		.order('serial_no', { ascending: true });

	if (serialDuplicatesRes.error)
		errors.push(`Serial Duplicates: ${serialDuplicatesRes.error.message}`);

	/* ---------- BLANK STOCK BY MODEL NO ---------- */

	const blankStockRes = await supabase
		.from('blank_stock_by_model_no_view')
		.select('*')
		.order('model_no', { ascending: true });

	if (blankStockRes.error) errors.push(`Blank Stock: ${blankStockRes.error.message}`);

	/* ---------- LOADCELL STOCK BY MODEL NO ---------- */

	const loadcellStockRes = await supabase
		.from('loadcell_stock_by_model_no_view')
		.select('*')
		.order('model_no', { ascending: true });

	if (loadcellStockRes.error) errors.push(`Loadcell Stock: ${loadcellStockRes.error.message}`);

	return {
		kpi: kpi,
		recentJobs: recetJobsRes.data ?? [],
		blankDuplicates: blankDuplicatesRes.data ?? [],
		serialDuplicates: serialDuplicatesRes.data ?? [],
		blankStock: blankStockRes.data ?? [],
		loadcellStock: loadcellStockRes.data ?? [],
		errors
	};
}
