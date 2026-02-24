import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSupabase } from '$lib/supabaseServer';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const mode = url.searchParams.get('mode') === 'serial' ? 'serial' : 'blank';
	const rawQuery = (url.searchParams.get('q') ?? '').trim();
	const numericQuery = /^\d+$/.test(rawQuery) ? String(Number(rawQuery)) : rawQuery;
	const limit = Math.min(Number(url.searchParams.get('limit') ?? 10) || 10, 20);

	const supabase = getSupabase(cookies);
	const column = mode === 'serial' ? 'serial_no' : 'blank_no';

	const query = supabase
		.from('trs_prod')
		.select(column)
		.not(column, 'is', null)
		.order(column, { ascending: false })
		.limit(limit * 10);

	const { data, error } = await query;

	if (error) {
		return json({ suggestions: [] }, { status: 200 });
	}

	const suggestions = Array.from(
		new Set(
			(data ?? [])
				.map((row) => (row as Record<string, number | string | null>)[column])
				.filter((value) => value !== null && value !== undefined)
				.map((value) => String(value))
				.filter((value) => (numericQuery ? value.includes(numericQuery) : true))
		)
	).slice(0, limit);

	return json({ suggestions });
};
