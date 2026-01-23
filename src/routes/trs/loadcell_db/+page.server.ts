import { supabase } from '$lib/supabaseClient';

const PAGE_SIZE = 25;


const SEARCHABLE_COLUMNS = {
	job_date: { type: "date" },
	job_no: { type: "text" },
	job_card_no: { type: "number" },
	model_no: { type: "text" },
	blank_no: { type: "number" },
	serial_no: { type: "number" },
} as const;

type SearchColumn = keyof typeof SEARCHABLE_COLUMNS;

export async function load({ url }) {
	const page = Number(url.searchParams.get('page') ?? 1);
	const column = url.searchParams.get("column") as SearchColumn | null;
	const value = url.searchParams.get("value");

	let query = supabase
		.from('trs_prod')
		.select('*')
		.order('created_at', { ascending: false })
		.order('updated_at', { ascending: false })

	/* ---------- SINGLE-COLUMN SEARCH ---------- */
	if (column && value && column in SEARCHABLE_COLUMNS) {
		const columnType = SEARCHABLE_COLUMNS[column].type;

		if (columnType === "number") {
			// numeric equality or partial via text cast
			query = query.eq(column, Number(value));
		} else if (columnType === "date") {
			query = query.eq(column, value);
		} else {
			query = query.ilike(column, `%${value}%`);
		}
	}

	const { data, error } = await query;

	if (error) {
		console.error(error);
	}

	return {
		rows: data ?? [],
		search: {
			column,
			value
		},
		searchableColumns: Object.keys(SEARCHABLE_COLUMNS)
	};
}
