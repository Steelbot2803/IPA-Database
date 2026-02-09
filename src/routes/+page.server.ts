import { supabase } from '$lib/supabaseClient';
import { error } from 'console';
import { read } from 'fs';

export async function load() {
	const errors: string[] = [];

	/* ---------- STATUS COUNTS ---------- */

	const [dispatchRes, readyRes, inProcessRes] = await Promise.all([
		supabase
			.from('trs_prod_status_view')
			.select('*', { count: 'exact', head: true })
			.eq('derived_status', 'DISPATCHED'),
		supabase
			.from('trs_prod_status_view')
			.select('*', { count: 'exact', head: true })
			.eq('derived_status', 'READY'),
		supabase
			.from('trs_prod_status_view')
			.select('*', { count: 'exact', head: true })
			.eq('derived_status', 'IN-PROCESS')
	]);

	if (dispatchRes.error) errors.push(`Dispatched Count: ${dispatchRes.error.message}`);
	if (readyRes.error) errors.push(`Ready Count: ${readyRes.error.message}`);
	if (inProcessRes.error) errors.push(`In-Process Count: ${inProcessRes.error.message}`);

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
		dispatched: dispatchRes.count ?? 0,
		ready: readyRes.count ?? 0,
		inProcess: inProcessRes.count ?? 0,
		recentJobs: recetJobsRes.data ?? [],
		blankDuplicates: blankDuplicatesRes.data ?? [],
		serialDuplicates: serialDuplicatesRes.data ?? [],
		blankStock: blankStockRes.data ?? [],
		loadcellStock: loadcellStockRes.data ?? [],
		errors
	};
}
