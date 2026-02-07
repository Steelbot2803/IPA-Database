export type ColumnType = 'text' | 'number' | 'date' | 'enum';

export type ColumnMeta = {
	type: ColumnType;
	label: string;
	values?: readonly string[];
};

export type Filter = {
	op: string;
	value: any;
};

export const OPERATORS: Record<ColumnType, { value: string; label: string }[]> = {
	text: [
		{ value: 'contains', label: 'Contains' },
		{ value: 'not_contains', label: 'Does Not Contain' },
		{ value: 'eq', label: 'Equals' }
	],
	number: [
		{ value: 'eq', label: '=' },
		{ value: 'neq', label: '≠' },
		{ value: 'gt', label: '>' },
		{ value: 'lt', label: '<' },
		{ value: 'gte', label: '>=' },
		{ value: 'lte', label: '<=' }
	],
	date: [
		{ value: 'eq', label: 'On' },
		{ value: 'between', label: 'Between' }
	],
	enum: [
		{ value: 'eq', label: 'Equals' },
		{ value: 'neq', label: 'Not Equals' }
	]
};

export function getSortState(params: URLSearchParams) {
	if (!params.has('sort')) {
		return { sortColumn: null, sortAscending: true };
	}

	return {
		sortColumn: params.get('sort'),
		sortAscending: params.get('order') !== 'desc'
	};
}

export function buildPageQuery(search: string, page: number) {
	const params = new URLSearchParams(search);
	params.set('page', page.toString());
	return `?${params.toString()}`;
}

export function buildSortQuery(
	search: string,
	column: string,
	sortColumn: string | null,
	sortAscending: boolean
) {
	const isSameColumn = sortColumn === column;
	const nextAscending = isSameColumn ? !sortAscending : true;
	const params = new URLSearchParams(search);

	params.set('sort', column);
	params.set('order', nextAscending ? 'asc' : 'desc');
	params.set('page', '1');

	return {
		query: `?${params.toString()}`,
		nextAscending
	};
}

export function buildApplyFiltersQuery(search: string, filters: Record<string, Filter>) {
	const params = new URLSearchParams(search);
	params.set('filters', JSON.stringify(filters));
	params.set('page', '1');
	return `?${params.toString()}`;
}

export function defaultOperator(type: ColumnType) {
	if (type === 'text') return 'contains';
	return 'eq';
}

export function defaultValue(meta: ColumnMeta) {
	if (meta.type === 'enum') return meta.values?.[0] ?? '';
	return '';
}
