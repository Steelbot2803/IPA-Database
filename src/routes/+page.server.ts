import { supabase } from '$lib/supabaseClient';

export async function load() {
	/* ---------- STATUS COUNTS ---------- */

	const [{ count: dispatched }, { count: ready }, { count: inProcess }] = await Promise.all([
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

	/* ---------- RECENT 10 ENTRIES ---------- */

	const { data: recentJobs } = await supabase
		.from('trs_prod_status_view')
		.select('job_no, model_no, blank_no, serial_no, derived_status, updated_at')
		.order('updated_at', { ascending: false })
		.limit(10);

	/* ---------- DUPLICATE BLANK NO ---------- */
	/*
    We find blank_no values where count > 1
  */

	const { data: blankDuplicates } = await supabase.from('duplicate_blank_no').select('*');

	const { data: serialDuplicates } = await supabase.from('duplicate_serial_no').select('*');

	return {
		dispatched: dispatched ?? 0,
		ready: ready ?? 0,
		inProcess: inProcess ?? 0,
		recentJobs: recentJobs ?? [],
		blankDuplicates: blankDuplicates ?? [],
		serialDuplicates: serialDuplicates ?? []
	};
}
