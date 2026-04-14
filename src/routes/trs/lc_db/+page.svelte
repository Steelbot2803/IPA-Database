<!-- PATH: src/routes/trs/lc_db/+page.svelte -->
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

	// Svelte 5: $props() replaces "export let data"
	let { data } = $props();

	type Job = (typeof data.rows)[number] | null;

	// Svelte 5: $state() for all mutable variables
	let selectedJob = $state<Job>(null);
	let sortColumn = $state<string | null>(null);
	let sortAscending = $state(true);
	let filters = $derived<Record<string, Filter>>(data.filters ?? {});
	let activeFilter = $state<string | null>(null);
	let popoverEl = $state<HTMLDivElement | null>(null);

	// Svelte 5: $derived() replaces $: reactive declarations
	let columnMeta = $derived<Record<string, ColumnMeta>>(data.columnMeta);
	let totalPages = $derived(Math.ceil(data.total / data.pageSize));

	function gotoPage(page: number) {
		if (!browser) return;
		if (page < 1 || page > totalPages) return;
		goto(buildPageQuery(window.location.search, page));
	}

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

	// Svelte 5: $derived() replaces $: isDefaultState = ...
	let isDefaultState = $derived(Object.keys(filters).length === 0 && !sortColumn);

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
		if (event.key === 'Escape') closePopover();
	}

	function onClickOutside(event: MouseEvent) {
		if (popoverEl && !popoverEl.contains(event.target as Node)) closePopover();
	}

	onMount(() => {
		syncSortStateFromUrl();
		afterNavigate(() => syncSortStateFromUrl());
		window.addEventListener('keydown', onKeyDown);
		window.addEventListener('mousedown', onClickOutside, true);
		return () => {
			window.removeEventListener('keydown', onKeyDown);
			window.removeEventListener('mousedown', onClickOutside, true);
		};
	});

	const fields: [keyof NonNullable<Job>, string][] = [
		['derived_status', 'Status'],
		['recieved_date', 'Received Date'],
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
		['id', 'ID']
	];
</script>

<div class={uiStyles.c0113}>
	<h1 class={uiStyles.c0021}>Loadcell Database</h1>
	<div class={uiStyles.c0114}>
		<button disabled={isDefaultState} class={uiStyles.c0115} onclick={() => resetAll()}
			>Filter Reset</button
		>
	</div>

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
								{#if sortColumn !== column}<ChevronsUpDown size="16" />
								{:else if sortAscending}<ChevronUp size="16" />
								{:else}<ChevronDown size="16" />
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
										class={uiStyles.c0150}
										bind:value={filters[column].op}
										onchange={() => normalizeFilterValue(column)}
									>
										{#each OPERATORS[columnMeta[column].type] as op}
											<option value={op.value}>{op.label}</option>
										{/each}
									</select>
									{#if columnMeta[column].type === 'enum'}
										<select
											id={`filter-value-${column}`}
											name={`filter-value-${column}`}
											class={uiStyles.c0151}
											bind:value={filters[column].value}
										>
											{#each columnMeta[column].values as v}
												<option value={v}>{v}</option>
											{/each}
										</select>
									{:else if columnMeta[column].type === 'date' && filters[column]?.op === 'between'}
										<input
											id={`filter-start-${column}`}
											name={`filter-start-${column}`}
											class={uiStyles.c0152}
											type="date"
											bind:value={filters[column].value[0]}
										/>
										<input
											id={`filter-end-${column}`}
											name={`filter-end-${column}`}
											class={uiStyles.c0152}
											type="date"
											bind:value={filters[column].value[1]}
										/>
									{:else if columnMeta[column].type === 'date'}
										<input
											id={`filter-value-${column}`}
											name={`filter-value-${column}`}
											class={uiStyles.c0152}
											type="date"
											bind:value={filters[column].value}
										/>
									{:else}
										<input
											id={`filter-value-${column}`}
											name={`filter-value-${column}`}
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
							<button class={uiStyles.c0089} onclick={() => (selectedJob = row)}>Open</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<div class={uiStyles.c0127}>
		<button
			class={uiStyles.c0128}
			aria-label="First page"
			disabled={data.page === 1}
			onclick={() => gotoPage(1)}><ChevronFirst size="24" /></button
		>
		<button
			class={uiStyles.c0128}
			aria-label="Previous page"
			disabled={data.page === 1}
			onclick={() => gotoPage(data.page - 1)}><ChevronLeft size="24" /></button
		>
		<span class={uiStyles.c0129}>{data.page} / {totalPages}</span>
		<button
			class={uiStyles.c0128}
			aria-label="Next page"
			disabled={data.page === totalPages}
			onclick={() => gotoPage(data.page + 1)}><ChevronRight size="24" /></button
		>
		<button
			class={uiStyles.c0128}
			aria-label="Last page"
			disabled={data.page === totalPages}
			onclick={() => gotoPage(totalPages)}><ChevronLast size="24" /></button
		>
	</div>
</div>

{#if selectedJob}
	<div class={uiStyles.c0130}>
		<div class={uiStyles.c0131}>
			<div class={uiStyles.c0132}>
				<h2 class={uiStyles.c0133}>Loadcell Details</h2>
				<button onclick={() => (selectedJob = null)} class={uiStyles.c0134}>Close</button>
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
