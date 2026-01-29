import { supabase } from '$lib/supabaseClient';

const PAGE_SIZE = 25;

const COLUMN_META = {
	received_date: { type: 'date', label: 'Received Date' },
	job_no: { type: 'text', label: 'Job No' },
	job_card_no: { type: 'number', label: 'Job Card No' },
	model_no: { type: 'text', label: 'Model No' },
	blank_no: { type: 'number', label: 'Blank No' },
} as const;

type ColumnKey = keyof typeof COLUMN_META;

type filterop =
	| 'contains'
	| 'not_contains'
	| 'eq'
	| 'gte'
	| 'lte'
	| 'gt'
	| 'lt'
	| 'neq'
	| 'between';

type Filter = {
	op: filterop;
	value: string | number | [number, number] | [string, string];
};

type Filters = Partial<Record<ColumnKey, Filter>>;

export async function load({ url }) {
	const page = Number(url.searchParams.get('page') ?? 1);
	const from = (page - 1) * PAGE_SIZE;
	const to = from + PAGE_SIZE - 1;
	const rawFilters = url.searchParams.get('filters');
	const sort = url.searchParams.get('sort');
	const order = url.searchParams.get('order') !== 'desc';

	let query = supabase.from('blank_stock').select('*', { count: 'exact' }).range(from, to);
	let filters: Filters = {};

	if (sort) {
		query = query.order(sort, { ascending: order }).order('id', { ascending: true });
	} else {
		query = query.order('id', { ascending: false });
	}

	if (rawFilters) {
		try {
			filters = JSON.parse(rawFilters) as Filters;
		} catch {
			filters = {};
		}
	}

	for (const [column, filter] of Object.entries(filters) as [ColumnKey, Filter][]) {
		const meta = COLUMN_META[column];
		if (!meta || !filter) continue;

		const { op, value } = filter;

		switch (meta.type) {
			case 'text':
				if (op === 'contains') {
					query = query.ilike(column, `%${value}%`);
				}
				if (op === 'not_contains') {
					query = query.or(`${column}.not.ilike.%${value}%,${column}.is.null`);
				}
				if (op === 'eq') {
					query = query.eq(column, value);
				}
				break;
			case 'number':
				if (op === 'eq') query = query.eq(column, Number(value));
				if (op === 'neq') query = query.neq(column, Number(value));
				if (op === 'gt') query = query.gt(column, Number(value));
				if (op === 'lt') query = query.lt(column, Number(value));
				if (op === 'gte') query = query.gte(column, Number(value));
				if (op === 'lte') query = query.lte(column, Number(value));
				break;

			case 'date':
				if (op === 'eq') query = query.eq(column, value);
				if (op === 'neq') query = query.neq(column, value);
				if (op === 'gt') query = query.gt(column, value);
				if (op === 'lt') query = query.lt(column, value);
				if (op === 'gte') query = query.gte(column, value);
				if (op === 'lte') query = query.lte(column, value);
				if (op === 'between') {
					const [from, to] = value as [string, string];
					query = query.gte(column, from).lte(column, to);
				}
				break;
		}
	}

	const { data, count, error } = await query.range(from, to);

	if (error) {
		console.error(error);
	}

	return {
		rows: data ?? [],
		page,
		pageSize: PAGE_SIZE,
		total: count ?? 0,
		filters,
		columnMeta: COLUMN_META
	};
}
