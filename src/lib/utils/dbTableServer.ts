/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient } from '@supabase/supabase-js';

export type ColumnType = 'text' | 'number' | 'date' | 'enum';

type FilterOp =
	| 'contains'
	| 'not_contains'
	| 'eq'
	| 'gte'
	| 'lte'
	| 'gt'
	| 'lt'
	| 'neq'
	| 'between';

export type Filter = {
	op: FilterOp;
	value: string | number | [number, number] | [string, string];
};

type Filters<ColumnKey extends string> = Partial<Record<ColumnKey, Filter>>;

type ColumnMetaRecord<ColumnKey extends string> = Record<
	ColumnKey,
	{ type: ColumnType; label: string; values?: readonly string[] }
>;

const PAGE_SIZE = 25;
const FILTER_OPS = new Set<FilterOp>([
	'contains',
	'not_contains',
	'eq',
	'gte',
	'lte',
	'gt',
	'lt',
	'neq',
	'between'
]);

function isFilter(value: unknown): value is Filter {
	if (!value || typeof value !== 'object') return false;
	const candidate = value as { op?: unknown; value?: unknown };
	if (typeof candidate.op !== 'string' || !FILTER_OPS.has(candidate.op as FilterOp)) return false;
	return 'value' in candidate;
}

export function parseFilters<ColumnKey extends string>(rawFilters: string | null): Filters<ColumnKey> {
	if (!rawFilters) return {};
	try {
		const parsed = JSON.parse(rawFilters) as unknown;
		if (!parsed || typeof parsed !== 'object') return {};

		const sanitized: Filters<ColumnKey> = {};
		for (const [column, filter] of Object.entries(parsed)) {
			if (isFilter(filter)) {
				sanitized[column as ColumnKey] = filter;
			}
		}

		return sanitized;
	} catch {
		return {};
	}
}

export function applyFilter(query: any, column: string, type: ColumnType, filter: Filter) {
	const { op, value } = filter;

	switch (type) {
		case 'text':
			if (op === 'contains') return query.ilike(column, `%${value}%`);
			if (op === 'not_contains') return query.not(column, 'ilike', `%${value}%`);
			if (op === 'eq') return query.eq(column, value);
			return query;
		case 'number':
			if (op === 'eq') return query.eq(column, Number(value));
			if (op === 'neq') return query.neq(column, Number(value));
			if (op === 'gt') return query.gt(column, Number(value));
			if (op === 'lt') return query.lt(column, Number(value));
			if (op === 'gte') return query.gte(column, Number(value));
			if (op === 'lte') return query.lte(column, Number(value));
			return query;
		case 'date':
			if (op === 'eq') return query.eq(column, value);
			if (op === 'neq') return query.neq(column, value);
			if (op === 'gt') return query.gt(column, value);
			if (op === 'lt') return query.lt(column, value);
			if (op === 'gte') return query.gte(column, value);
			if (op === 'lte') return query.lte(column, value);
			if (op === 'between') {
				const [from, to] = value as [string, string];
				return query.gte(column, from).lte(column, to);
			}
			return query;
		case 'enum':
			if (op === 'eq') return query.eq(column, value);
			if (op === 'neq') return query.neq(column, value);
			return query;
		default:
			return query;
	}
}

export async function loadTablePage<ColumnKey extends string>({
	url,
	table,
	columnMeta,
	baseQuery,
	supabase
}: {
	url: URL;
	table: string;
	columnMeta: ColumnMetaRecord<ColumnKey>;
	baseQuery?: (query: any) => any;
	supabase: SupabaseClient;
}) {
	const rawPage = Number(url.searchParams.get('page') ?? 1);
	const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
	const from = (page - 1) * PAGE_SIZE;
	const to = from + PAGE_SIZE - 1;
	const sort = url.searchParams.get('sort');
	const order = url.searchParams.get('order') !== 'desc';
	const filters = parseFilters<ColumnKey>(url.searchParams.get('filters'));
	const sortableColumns = new Set<ColumnKey | 'id'>([
		...(Object.keys(columnMeta) as ColumnKey[]),
		'id'
	]);

	let query = supabase.from(table).select('*', { count: 'exact' });

	if (baseQuery) {
		query = baseQuery(query);
	}

	if (sort && sortableColumns.has(sort as ColumnKey | 'id')) {
		query = query.order(sort, { ascending: order }).order('id', { ascending: true });
	} else {
		query = query.order('id', { ascending: false });
	}

	for (const [column, filter] of Object.entries(filters) as [ColumnKey, Filter][]) {
		const meta = columnMeta[column];
		if (!meta || !filter) continue;
		query = applyFilter(query, column, meta.type, filter);
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
		columnMeta
	};
}
