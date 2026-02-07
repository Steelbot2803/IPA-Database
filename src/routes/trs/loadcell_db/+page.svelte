<script lang="ts">
	import { styles as uiStyles } from '$lib/utils/styles';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import {
		ChevronUp,
		ChevronDown,
		ChevronsUpDown,
		ChevronFirst,
		ChevronLast,
		ChevronLeft,
		ChevronRight,
		Funnel
	} from 'lucide-svelte';

	export let data;

	type Job = (typeof data.rows)[number] | null;
	let selectedJob: Job = null;

	$: totalPages = Math.ceil(data.total / data.pageSize);

	function gotoPage(page: number) {
		if (!browser) return;
		if (page < 1 || page > totalPages) return;
		const params = new URLSearchParams(window.location.search);
		params.set('page', page.toString());
		goto(`?${params.toString()}`);
	}

	let sortColumn: string | null = null;
	let sortAscending = true;

	function toggleSort(column: string) {
		if (!browser) return;

		const isSameColumn = sortColumn === column;
		const nextAscending = isSameColumn ? !sortAscending : true;

		sortColumn = column;
		sortAscending = nextAscending;

		const params = new URLSearchParams(window.location.search);
		params.set('sort', column);
		params.set('order', nextAscending ? 'asc' : 'desc');
		params.set('page', '1');

		goto(`?${params.toString()}`);
	}

	$: {
		const params = page.url.searchParams;

		if (params.has('sort')) {
			sortColumn = params.get('sort');
			sortAscending = params.get('order') !== 'desc';
		} else {
			sortColumn = null;
			sortAscending = true;
		}
	}

	type ColumnType = 'text' | 'number' | 'date' | 'enum';

	type ColumnMeta = {
		type: ColumnType;
		label: string;
		values?: readonly string[];
	};

	type Filter = {
		op: string;
		value: any;
	};

	let filters: Record<string, Filter> = data.filters ?? {};
	let columnMeta: Record<string, ColumnMeta> = data.columnMeta;
	let activeFilter: string | null = null;
	let popoverEl: HTMLDivElement | null = null;

	const OPERATORS: Record<ColumnType, { value: string; label: string }[]> = {
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

	function applyFilters() {
		const params = new URLSearchParams(window.location.search);
		params.set('filters', JSON.stringify(filters));
		params.set('page', '1');

		goto(`?${params.toString()}`);
	}

	function clearFilter(column: string) {
		delete filters[column];

		const params = new URLSearchParams(window.location.search);
		params.set('filters', JSON.stringify(filters));
		params.set('page', '1');

		goto(`?${params.toString()}`);
		closePopover();
	}

	function resetAll() {
		filters = {};
		sortColumn = null;
		sortAscending = true;

		applyFilters();
		closePopover();

		goto('?', { replaceState: true, noScroll: true });
	}

	$: isDefaultState = Object.keys(filters).length === 0 && !sortColumn;

	function defaultOperator(column: string) {
		const type = columnMeta[column].type;
		if (type === 'text') return 'contains';
		if (type === 'number') return 'eq';
		if (type === 'date') return 'eq';
		if (type === 'enum') return 'eq';
		return 'eq';
	}

	function defaultValue(column: string) {
		const type = columnMeta[column].type;
		if (type === 'date') return '';
		if (type === 'number') return '';
		if (type === 'enum') return columnMeta[column].values?.[0] ?? '';
		return '';
	}

	function ensureFilter(column: string) {
		if (!filters[column]) {
			filters[column] = {
				op: defaultOperator(column),
				value: defaultValue(column)
			};
		}
	}

	function closePopover() {
		activeFilter = null;
	}

	function onKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closePopover();
		}
	}

	function onClickOutside(event: MouseEvent) {
		if (popoverEl && !popoverEl.contains(event.target as Node)) {
			closePopover();
		}
	}

	onMount(() => {
		window.addEventListener('keydown', onKeyDown);
		return () => {
			window.removeEventListener('keydown', onKeyDown);
		};
	});

	onMount(() => {
		window.addEventListener('mousedown', onClickOutside, true);
		return () => {
			window.removeEventListener('mousedown', onClickOutside, true);
		};
	});

	const fields: [keyof Job, string][] = [
		['id', 'ID'],
		['job_date', 'Job Date'],
		['job_no', 'Job No'],
		['job_card_no', 'Job Card No'],
		['model_no', 'Model No'],
		['blank_no', 'Blank No'],
		['serial_no', 'Serial No'],
		['customer', 'Customer'],
		['remarks', 'Remarks'],
		['curing', 'Curing'],
		['post_curing', 'Post Curing'],
		['wiring', 'Wiring'],
		['tc0', 'TC0'],
		['cycling', 'Cycling'],
		['cabling', 'Cabling'],
		['trimming', 'Trimming'],
		['black_putty', 'Black Putty'],
		['bellow_welding', 'Bellow Welding'],
		['pocket_welding', 'Pocket Welding'],
		['sealing_side_1', 'Sealing - Side 1'],
		['sealing_side_2', 'Sealing - Side 2'],
		['linearity', 'Linearity'],
		['tc0_qc', 'TC0 QC'],
		['tinning', 'Tinning'],
		['ready_date', 'Ready Date'],
		['dispatch_date', 'Dispatch Date'],
		['derived_status', 'Status']
	];
</script>

<div class={uiStyles.c0113}>
	<h1 class={uiStyles.c0021}>Loadcell Database</h1>
	<div class={uiStyles.c0114}>
		<button disabled={isDefaultState} class={uiStyles.c0115} onclick={() => resetAll()}
			>Filter Reset</button
		>
	</div>
	<!-- ================= TABLE ================= -->
	<div class={uiStyles.c0116}>
		<table class={uiStyles.c0117}>
			<thead>
				<tr>
					{#each Object.keys(columnMeta) as column}
						<th
							class={uiStyles.c0118}
							class:bg-teal-950={sortColumn === column && !filters[column]}
							class:bg-lime-950={filters[column] && sortColumn !== column}
							class:bg-orange-950={sortColumn === column && filters[column]}
						>
							<span class={uiStyles.c0119}>{columnMeta[column].label}</span>
							<button aria-label="Sort" class={uiStyles.c0120} onclick={() => toggleSort(column)}>
								{#if sortColumn !== column}
									<ChevronsUpDown size="16" />
								{:else if sortAscending}
									<ChevronUp size="16" />
								{:else}
									<ChevronDown size="16" />
								{/if}
							</button>
							<button
								class={uiStyles.c0120}
								aria-label="Filter"
								onclick={() => {
									ensureFilter(column);
									activeFilter = column;
								}}
							>
								<Funnel size="16" />
							</button>
							{#if activeFilter === column}
								<div bind:this={popoverEl} class={uiStyles.c0121}>
									<select
										class={uiStyles.c0150}
										bind:value={filters[column].op}
										onchange={() => {
											if (!filters[column]) {
												filters[column] = { op: 'eq', value: '' };
											}
										}}
									>
										{#each OPERATORS[columnMeta[column].type] as op}
											<option value={op.value}>{op.label}</option>
										{/each}
									</select>

									{#if columnMeta[column].type === 'enum'}
										<select class={uiStyles.c0151} bind:value={filters[column].value}>
											{#each columnMeta[column].values as v}
												<option value={v}>{v}</option>
											{/each}
										</select>
									{:else if columnMeta[column].type === 'date' && filters[column]?.op === 'between'}
										<input
											class={uiStyles.c0152}
											type="date"
											bind:value={filters[column].value[0]}
										/>
										<input
											class={uiStyles.c0152}
											type="date"
											bind:value={filters[column].value[1]}
										/>
									{:else if columnMeta[column].type === 'date'}
										<input class={uiStyles.c0152} type="date" bind:value={filters[column].value} />
									{:else}
										<input
											class={uiStyles.c0152}
											type={columnMeta[column].type === 'number' ? 'number' : 'text'}
											bind:value={filters[column].value}
											onkeydown={(e) => e.key === 'Enter' && applyFilters()}
										/>
									{/if}
									<div class={uiStyles.c0124}>
										<button class={uiStyles.c0100} onclick={applyFilters}>Apply</button>
										<button class={uiStyles.c0100} onclick={() => clearFilter(column)}>Clear</button
										>
									</div>
								</div>
							{/if}
						</th>
					{/each}
					<th class={uiStyles.c0118}></th>
				</tr>
			</thead>

			<tbody>
				{#each data.rows as row}
					<tr class={uiStyles.c0125}>
						{#each Object.keys(columnMeta) as column}
							<td class={uiStyles.c0126}>{row[column] ?? '—'}</td>
						{/each}
						<td>
							<button class={uiStyles.c0089} onclick={() => (selectedJob = row)}> Open </button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	<!-- ================= PAGINATION ================= -->
	<div class={uiStyles.c0127}>
		<button
			class={uiStyles.c0128}
			aria-label="First page"
			disabled={data.page === 1}
			onclick={() => gotoPage(1)}
		>
			<ChevronFirst size="24" />
		</button>
		<button
			class={uiStyles.c0128}
			aria-label="Previous page"
			disabled={data.page === 1}
			onclick={() => gotoPage(data.page - 1)}
		>
			<ChevronLeft size="24" />
		</button>

		<span class={uiStyles.c0129}> {data.page} / {totalPages} </span>

		<button
			class={uiStyles.c0128}
			aria-label="Next page"
			disabled={data.page === totalPages}
			onclick={() => gotoPage(data.page + 1)}
		>
			<ChevronRight size="24" />
		</button>
		<button
			class={uiStyles.c0128}
			aria-label="Last page"
			disabled={data.page === totalPages}
			onclick={() => gotoPage(totalPages)}
		>
			<ChevronLast size="24" />
		</button>
	</div>
</div>

{#if selectedJob}
	<div class={uiStyles.c0130}>
		<div class={uiStyles.c0131}>
			<div class={uiStyles.c0132}>
				<h2 class={uiStyles.c0133}>Loadcell Details</h2>
				<button onclick={() => (selectedJob = null)} class={uiStyles.c0134}> Close </button>
			</div>

			<div class={uiStyles.c0135}>
				{#each fields as [key, label]}
					<div class={uiStyles.c0136}>
						<p class={uiStyles.c0137}>{label}</p>
						<p class={uiStyles.c0138}>{selectedJob[key] ?? '—'}</p>
					</div>
				{/each}
			</div>
		</div>
	</div>
{/if}
