<script lang="ts">
	import { styles as uiStyles } from '$lib/utils/styles';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { isElectromech } from '$lib/utils/customerFilters.js';
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

	type ProdPlan = (typeof data.rows)[number] | null;
	let selectedPlan: ProdPlan = null;
	let scheduledMonth = data.scheduledMonth;
	let loading = false;

	$: totalPages = Math.ceil(data.total / data.pageSize);

	function gotoPage(page: number) {
		if (!browser) return;
		if (page < 1 || page > totalPages) return;
		const params = new URLSearchParams(window.location.search);
		params.set('page', page.toString());
		goto(`?${params.toString()}`);
	}

	async function loadMonth() {
		loading = true;
		const params = new URLSearchParams(window.location.search);
		params.set('scheduled_month', scheduledMonth);
		params.set('page', '1');
		try {
			await goto(`?${params.toString()}`);
		} finally {
			loading = false;
		}
	}

	let electromech = data.electromech ?? false;

	function toggleElectromech() {
		const params = new URLSearchParams(window.location.search);
		const next = !electromech;

		if (next) {
			params.set('electromech', '1');
		} else {
			params.delete('electromech');
		}
		params.set('page', '1');
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

	$: electromech = data.electromech ?? false;

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
	type ColumnMeta = { type: ColumnType; label: string };
	type Filter = { op: string; value: any };

	let filters: Record<string, Filter> = data.filters ?? {};
	let columnMeta: Record<string, ColumnMeta> = data.columnMeta;
	let activeFilter: string | null = null;
	let popoverEl: HTMLDivElement | null = null;

	$: visibleRows = electromech
		? data.rows.filter((row) => isElectromech(row.customer))
		: data.rows.filter((row) => !isElectromech(row.customer));

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
		const params = new URLSearchParams(window.location.search);
		params.set('scheduled_month', scheduledMonth);
		goto(`?${params.toString()}`, { replaceState: true, noScroll: true });
		closePopover();
	}

	$: isDefaultState = Object.keys(filters).length === 0 && !sortColumn;

	function defaultOperator(column: string) {
		const type = columnMeta[column].type;
		if (type === 'text') return 'contains';
		if (type === 'number') return 'eq';
		if (type === 'date') return 'eq';
		return 'eq';
	}

	function ensureFilter(column: string) {
		if (!filters[column]) {
			filters[column] = { op: defaultOperator(column), value: '' };
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
		window.addEventListener('keydown', onKeyDown);
		window.addEventListener('mousedown', onClickOutside, true);
		return () => {
			window.removeEventListener('keydown', onKeyDown);
			window.removeEventListener('mousedown', onClickOutside, true);
		};
	});

	const fields: [keyof ProdPlan, string][] = [
		['id', 'ID'],
		['scheduled_month', 'Scheduled Month'],
		['planned_dispatch', 'Planned Dispatch'],
		['actual_dispatch', 'Actual Dispatch'],
		['job_no', 'Job No'],
		['job_card_no', 'Job Card No'],
		['model_no', 'Model No'],
		['dimension', 'Dimension'],
		['quantity', 'Quantity'],
		['pending_qty', 'Pending Quantity'],
		['dispatched_qty', 'Dispatched Quantity'],
		['customer', 'Customer'],
		['remarks', 'Remarks']
	];
</script>

<div class={uiStyles.c0113}>
	<div class={uiStyles.c0148}>
		<h1 class={uiStyles.c0021}>Production Plan Database</h1>
		<button disabled={isDefaultState} class={uiStyles.c0149} onclick={() => resetAll()}
			>Filter Reset</button
		>
	</div>

	<div class={uiStyles.c0063}>
		<div class={uiStyles.c0045}>
			<label for="scheduled_month" class={uiStyles.c0046}>Scheduled Month</label>
			<input id="scheduled_month" class={uiStyles.c0047} type="month" bind:value={scheduledMonth} />
		</div>
		<div class={uiStyles.c0064}>
			<button type="button" onclick={loadMonth} disabled={loading} class={uiStyles.c0065}>
				{loading ? 'Loading...' : 'Load'}
			</button>
		</div>
		<div class={uiStyles.c0066}></div>
		<div class={uiStyles.c0049}>
			<label for="electromech_toggle" class={uiStyles.c0050}>
				<span class={uiStyles.c0051}>Main</span>
				<input
					id="electromech_toggle"
					type="checkbox"
					class={uiStyles.c0052}
					checked={electromech}
					onchange={toggleElectromech}
				/>
				<div class={uiStyles.c0053}></div>
				<span class={uiStyles.c0051}>Electromech</span>
			</label>
		</div>
	</div>

	<div class={uiStyles.c0116}>
		{#if visibleRows.length === 0}
			<p class={uiStyles.c0067}>
				{electromech
					? 'No Electromech production planned for this month'
					: 'No Main production planned for this month.'}
			</p>
		{:else}
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
										<select class={uiStyles.c0122} bind:value={filters[column].op}>
											{#each OPERATORS[columnMeta[column].type] as op}
												<option value={op.value}>{op.label}</option>
											{/each}
										</select>

										{#if columnMeta[column].type === 'date' && filters[column]?.op === 'between'}
											<input
												class={uiStyles.c0123}
												type="date"
												bind:value={filters[column].value[0]}
											/>
											<input
												class={uiStyles.c0123}
												type="date"
												bind:value={filters[column].value[1]}
											/>
										{:else if columnMeta[column].type === 'date'}
											<input
												class={uiStyles.c0123}
												type="date"
												bind:value={filters[column].value}
											/>
										{:else}
											<input
												class={uiStyles.c0123}
												type={columnMeta[column].type === 'number' ? 'number' : 'text'}
												bind:value={filters[column].value}
												onkeydown={(e) => e.key === 'Enter' && applyFilters()}
											/>
										{/if}
										<div class={uiStyles.c0124}>
											<button class={uiStyles.c0100} onclick={applyFilters}>Apply</button>
											<button class={uiStyles.c0100} onclick={() => clearFilter(column)}
												>Clear</button
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
								<button class={uiStyles.c0089} onclick={() => (selectedPlan = row)}> Open </button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>

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
				<span class={uiStyles.c0129}> {data.page} / {totalPages} </span>
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
		{/if}
	</div>
</div>

{#if selectedPlan}
	<div class={uiStyles.c0130}>
		<div class={uiStyles.c0131}>
			<div class={uiStyles.c0132}>
				<h2 class={uiStyles.c0133}>Production Plan Details</h2>
				<button onclick={() => (selectedPlan = null)} class={uiStyles.c0134}>Close</button>
			</div>
			<div class={uiStyles.c0135}>
				{#each fields as [key, label]}
					<div class={uiStyles.c0136}>
						<p class={uiStyles.c0137}>{label}</p>
						<p class={uiStyles.c0138}>{selectedPlan[key] ?? '—'}</p>
					</div>
				{/each}
			</div>
		</div>
	</div>
{/if}
