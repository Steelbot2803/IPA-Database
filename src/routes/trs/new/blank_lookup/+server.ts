import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSupabase } from '$lib/supabaseServer';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const blankNo = (url.searchParams.get('blank_no') ?? '').trim();

	if (!/^\d{7}$/.test(blankNo)) {
		return json({ matches: [] });
	}

	const supabase = getSupabase(cookies);
	const { data, error } = await supabase
		.from('blank_stock')
		.select('id, blank_no, job_no, model_no, job_card_no')
		.eq('blank_no', blankNo)
		.order('id', { ascending: false })
		.limit(20);

	if (error || !data) {
		return json({ matches: [] });
	}

	return json({ matches: data });
};