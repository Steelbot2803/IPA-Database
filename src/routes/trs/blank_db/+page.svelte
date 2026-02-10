<script lang="ts">
	import { styles as uiStyles } from '$lib/utils/styles';
	import { goto, afterNavigate } from '$app/navigation';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import {
		OPERATORS,
		buildApplyFiltersQuery,
		buildPageQuery,
		buildSortQuery,
		defaultOperator,
		defaultValue,
		getSortState,
		type ColumnMeta,
		type Filter
	} from '$lib/utils/dbTableClient.js';
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
		goto(buildPageQuery(window.location.search, page));
	}

	let sortColumn: string | null = null;
	let sortAscending = true;

	function toggleSort(column: string) {
		if (!browser) return;

		const { query, nextAscending } = buildSortQuery(
			window.location.search,
			column,
			sortColumn,
			sortAscending
		);

		sortColumn = column;
		sortAscending = nextAscending;

		goto(query);
	}

	function syncSortStateFromUrl() {
		if (!browser) return;
		({ sortColumn, sortAscending } = getSortState(new URLSearchParams(window.location.search)));
	}

	let filters: Record<string, Filter> = data.filters ?? {};
	let columnMeta: Record<string, ColumnMeta> = data.columnMeta;
	let activeFilter: string | null = null;
	let popoverEl: HTMLDivElement | null = null;

	function applyFilters() {
		goto(buildApplyFiltersQuery(window.location.search, filters));
	}

	function clearFilter(column: string) {
		delete filters[column];

		goto(buildApplyFiltersQuery(window.location.search, filters));
		closePopover();
	}

	function resetAll() {
		filters = {};
		sortColumn = null;
		sortAscending = true;

		const params = new URLSearchParams(window.location.search);
		params.delete('filters');
		params.delete('sort');
		params.delete('order');
		params.set('page', '1');

		goto(`?${params.toString()}`, { replaceState: true, noScroll: true });
		closePopover();
	}

	$: isDefaultState = Object.keys(filters).length === 0 && !sortColumn;

	function ensureFilter(column: string) {
		if (!filters[column]) {
			filters[column] = {
				op: defaultOperator(columnMeta[column].type),
				value: defaultValue(columnMeta[column])
			};
		}
	}

	function normalizeFilterValue(column: string) {
		if (!filters[column]) return;

		if (columnMeta[column].type === 'date' && filters[column].op === 'between') {
			const existing = filters[column].value;
			filters[column].value = [existing?.[0] ?? '', existing?.[1] ?? ''];
			return;
		}

		if (Array.isArray(filters[column].value)) {
			filters[column].value = filters[column].value[0] ?? '';
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
		syncSortStateFromUrl();
		afterNavigate(() => {
			syncSortStateFromUrl();
		});
		window.addEventListener('keydown', onKeyDown);
		window.addEventListener('mousedown', onClickOutside, true);
		return () => {
			window.removeEventListener('keydown', onKeyDown);
			window.removeEventListener('mousedown', onClickOutside, true);
		};
	});

	const fields: [keyof Job, string][] = [
		['id', 'ID'],
		['received_date', 'Received Date'],
		['job_no', 'Job No'],
		['job_card_no', 'Job Card No'],
		['model_no', 'Model No'],
		['blank_no', 'Blank No']
	];
</script>

<div class={uiStyles.c0113}>
	<h1 class={uiStyles.c0021}>Blank Stock Database</h1>
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
										id={`filter-op-${column}`}
										name={`filter-op-${column}`}
										class={uiStyles.c0122}
										bind:value={filters[column].op}
										onchange={() => normalizeFilterValue(column)}
									>
										{#each OPERATORS[columnMeta[column].type] as op}
											<option value={op.value}>{op.label}</option>
										{/each}
									</select>

									{#if columnMeta[column].type === 'date' && filters[column]?.op === 'between'}
										<input
											id={`filter-start-${column}`}
											name={`filter-start-${column}`}
											class={uiStyles.c0123}
											type="date"
											bind:value={filters[column].value[0]}
										/>
										<input
											id={`filter-end-${column}`}
											name={`filter-end-${column}`}
											class={uiStyles.c0123}
											type="date"
											bind:value={filters[column].value[1]}
										/>
									{:else if columnMeta[column].type === 'date'}
										<input
											id={`filter-value-${column}`}
											name={`filter-value-${column}`}
											class={uiStyles.c0123}
											type="date"
											bind:value={filters[column].value}
										/>
									{:else}
										<input
											id={`filter-value-${column}`}
											name={`filter-value-${column}`}
											class={uiStyles.c0123}
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
						<td
							><button class={uiStyles.c0089} onclick={() => (selectedJob = row)}> Open </button>
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
				<h2 class={uiStyles.c0133}>Blank Details</h2>
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
