import { supabase } from '$lib/supabaseClient';

const PAGE_SIZE = 25;


const SEARCHABLE_COLUMNS = {
	received_date: { type: "date" },
	job_no: { type: "text" },
	job_card_no: { type: "number" },
	model_no: { type: "text" },
	blank_no: { type: "number" },
} as const;

type SearchColumn = keyof typeof SEARCHABLE_COLUMNS;

export async function load({ url }) {
	const page = Number(url.searchParams.get('page') ?? 1);
	const column = url.searchParams.get("column") as SearchColumn | null;
	const value = url.searchParams.get("value");

	let query = supabase
		.from('blank_stock')
		.select('*', { count: 'exact' })
		.order('received_date', { ascending: false })
/* 		.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1); */

	/* ---------- SINGLE-COLUMN SEARCH ---------- */
	if (column && value && column in SEARCHABLE_COLUMNS) {
		const columnType = SEARCHABLE_COLUMNS[column].type;

		if (columnType === "number") {
			// numeric equality or partial via text cast
			query = query.eq(column, Number(value));
		} else {
			query = query.ilike(column, `%${value}%`);
		}
	}

	const { data, count, error } = await query;

	if (error) {
		console.error(error);
	}

	return {
		rows: data ?? [],
		total: count ?? 0,
		// page,
		search: {
			column,
			value
		},
		searchableColumns: Object.keys(SEARCHABLE_COLUMNS)
	};
}
