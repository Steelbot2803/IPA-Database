import { supabase } from '$lib/supabaseClient';

const PAGE_SIZE = 25;

const SEARCHABLE_COLUMNS = {
	job_date: { type: 'date' },
	job_no: { type: 'text' },
	job_card_no: { type: 'number' },
	model_no: { type: 'text' },
	blank_no: { type: 'number' },
	serial_no: { type: 'number' },
	derived_status: { type: 'text' }
} as const;

const COLUMN_ALIASES = {
	job_date: 'Job Date',
	job_no: 'Job No',
	job_card_no: 'Job Card No',
	model_no: 'Model No',
	blank_no: 'Blank No',
	serial_no: 'Serial No',
	derived_status: 'Status'
} as const;

type SearchColumn = keyof typeof SEARCHABLE_COLUMNS;

export async function load({ url }) {
	const page = Number(url.searchParams.get('page') ?? 1);
	const from = (page - 1) * PAGE_SIZE;
	const to = from + PAGE_SIZE - 1;
	const column = url.searchParams.get('column') as SearchColumn | null;
	const value = url.searchParams.get('value');
	const sort = url.searchParams.get('sort');
	const order = url.searchParams.get('order') !== 'desc';

	let query = supabase.from('trs_prod_status_view').select('*', { count: 'exact' }).range(from, to);

	/* ---------- SINGLE-COLUMN SEARCH ---------- */
	if (column && value && column in SEARCHABLE_COLUMNS) {
		const columnType = SEARCHABLE_COLUMNS[column].type;

		if (columnType === 'number') {
			// numeric equality or partial via text cast
			query = query.eq(column, Number(value));
		} else if (columnType === 'date') {
			query = query.eq(column, value);
		} else {
			query = query.ilike(column, `%${value}%`);
		}
	}

	if (sort) {
		query = query.order(sort, { ascending: order }).order('id', { ascending: true });
	} else {
		query = query.order('id', { ascending: false });
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
		search: {
			column,
			value
		},
		searchableColumns: Object.keys(SEARCHABLE_COLUMNS),
		columnAliases: COLUMN_ALIASES
	};
}
