<script lang="ts">
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

	type ColumnType = 'text' | 'number' | 'date';
	type ColumnMeta = { type: ColumnType; label: string };
	type Filter = { op: string; value: any };

	let filters: Record<string, Filter> = data.filters ?? {};
	let columnMeta: Record<string, ColumnMeta> = data.columnMeta;
	let activeFilter: string | null = null;
	let popoverEl: HTMLDivElement | null = null;
	let electromech = false;

	function isElectromech(customer: string | null | undefined) {
		return customer?.trim().toLowerCase() === 'electromech';
	}

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

<div class="bg-neutral min-w-full space-y-6 text-neutral-200">
	<div class="relative">
		<h1 class="mb-6 text-center text-5xl font-medium text-neutral-200">Production Plan Database</h1>
		<button
			disabled={isDefaultState}
			class="absolute right-0 bottom-0 font-5xl text-xl text-red-100 cursor-pointer rounded-md bg-red-800 px-4 py-2 hover:bg-red-600 disabled:pointer-events-none disabled:opacity-0"
			onclick={() => resetAll()}>Filter Reset</button
		>
	</div>

	<div class="grid grid-cols-8 items-end gap-4">
		<div class="col-span-2">
			<label for="scheduled_month" class="px-2 text-xl text-neutral-200">Scheduled Month</label>
			<input
				id="scheduled_month"
				class="input mt-2 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
				type="month"
				bind:value={scheduledMonth}
			/>
		</div>
		<div class="col-span-1">
			<button
				type="button"
				onclick={loadMonth}
				disabled={loading}
				class="rounded-md border border-neutral-700 bg-neutral-800 px-4 py-2 text-neutral-200 transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{loading ? 'Loading...' : 'Load'}
			</button>
		</div>
		<div class="col-span-3"></div>
		<div class="relative col-span-2">
			<label
				for="electromech_toggle"
				class="absolute right-0 bottom-0 flex cursor-pointer items-center rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5"
			>
				<span class="text-xl text-neutral-200">Main</span>
				<input
					id="electromech_toggle"
					type="checkbox"
					class="peer sr-only"
					bind:checked={electromech}
				/>
				<div
					class="peer peer-checked:after:border-buffer peer-checked:bg-brand relative mx-3 h-5 w-9 rounded-full bg-blue-600 peer-checked:bg-red-600 after:absolute after:start-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform after:duration-250 after:ease-in-out after:will-change-transform after:content-[''] peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full"
				></div>
				<span class="text-xl text-neutral-200">Electromech</span>
			</label>
		</div>
	</div>

	<div class="w-full text-xl text-neutral-200">
		{#if visibleRows.length === 0}
			<p class="text-red-100 text-2xl text-center font-5xl bg-red-800 py-2 rounded-md border-2 border-red-600">
				{electromech
					? 'No Electromech production planned for this month'
					: 'No Main production planned for this month.'}
			</p>
		{/if}
		<table class="whitespace-nonwrap mb-12 w-full border-separate border-spacing-y-2 select-none">
			<thead>
				<tr>
					{#each Object.keys(columnMeta) as column}
						<th
							class="rounded-md border-b-2 border-neutral-700 py-2 text-center transition-colors"
							class:bg-teal-950={sortColumn === column && !filters[column]}
							class:bg-lime-950={filters[column] && sortColumn !== column}
							class:bg-orange-950={sortColumn === column && filters[column]}
						>
							<span class="text-center">{columnMeta[column].label}</span>
							<button
								aria-label="Sort"
								class="ml-2 cursor-pointer rounded-md bg-neutral-800 px-2 py-1 hover:bg-neutral-600"
								onclick={() => toggleSort(column)}
							>
								{#if sortColumn !== column}
									<ChevronsUpDown size="16" />
								{:else if sortAscending}
									<ChevronUp size="16" />
								{:else}
									<ChevronDown size="16" />
								{/if}
							</button>
							<button
								class="ml-2 cursor-pointer rounded-md bg-neutral-800 px-2 py-1 hover:bg-neutral-600"
								aria-label="Filter"
								onclick={() => {
									ensureFilter(column);
									activeFilter = column;
								}}
							>
								<Funnel size="16" />
							</button>
							{#if activeFilter === column}
								<div
									bind:this={popoverEl}
									class="absolute z-50 mt-2 flex w-56 flex-col gap-2 rounded-md border border-neutral-700 bg-neutral-800 p-3 shadow-lg"
								>
									<select
										class="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-xl text-neutral-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
										bind:value={filters[column].op}
									>
										{#each OPERATORS[columnMeta[column].type] as op}
											<option value={op.value}>{op.label}</option>
										{/each}
									</select>

									{#if columnMeta[column].type === 'date' && filters[column]?.op === 'between'}
										<input
											class="input mt-2 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
											type="date"
											bind:value={filters[column].value[0]}
										/>
										<input
											class="input mt-2 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
											type="date"
											bind:value={filters[column].value[1]}
										/>
									{:else if columnMeta[column].type === 'date'}
										<input
											class="input mt-2 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
											type="date"
											bind:value={filters[column].value}
										/>
									{:else}
										<input
											class="input mt-2 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
											type={columnMeta[column].type === 'number' ? 'number' : 'text'}
											bind:value={filters[column].value}
											onkeydown={(e) => e.key === 'Enter' && applyFilters()}
										/>
									{/if}
									<div class="actions">
										<button
											class="font-5xl cursor-pointer rounded-md bg-neutral-800 px-4 py-2 hover:bg-neutral-600"
											onclick={applyFilters}>Apply</button
										>
										<button
											class="font-5xl cursor-pointer rounded-md bg-neutral-800 px-4 py-2 hover:bg-neutral-600"
											onclick={() => clearFilter(column)}>Clear</button
										>
									</div>
								</div>
							{/if}
						</th>
					{/each}
					<th class="rounded-md border-b-2 border-neutral-700 py-2 text-center transition-colors"
					></th>
				</tr>
			</thead>
			<tbody>
				{#each visibleRows as row}
					<tr class="hover:bg-neutral-600/50">
						{#each Object.keys(columnMeta) as column}
							<td class="px-6">{row[column] ?? '—'}</td>
						{/each}
						<td>
							<button
								class="font-5xl rounded-md bg-neutral-800 px-4 py-2 hover:bg-neutral-600"
								onclick={() => (selectedPlan = row)}
							>
								Open
							</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	<div class="flex-nonwrap flex justify-center space-x-4 text-center">
		<button
			class="flex cursor-pointer rounded-md bg-neutral-800 px-4 py-2 hover:bg-neutral-600 disabled:pointer-events-none disabled:opacity-0"
			aria-label="First page"
			disabled={data.page === 1}
			onclick={() => gotoPage(1)}><ChevronFirst size="24" /></button
		>
		<button
			class="flex cursor-pointer rounded-md bg-neutral-800 px-4 py-2 hover:bg-neutral-600 disabled:pointer-events-none disabled:opacity-0"
			aria-label="Previous page"
			disabled={data.page === 1}
			onclick={() => gotoPage(data.page - 1)}><ChevronLeft size="24" /></button
		>
		<span class="px-4 text-xl"> {data.page} / {totalPages} </span>
		<button
			class="flex cursor-pointer rounded-md bg-neutral-800 px-4 py-2 hover:bg-neutral-600 disabled:pointer-events-none disabled:opacity-0"
			aria-label="Next page"
			disabled={data.page === totalPages}
			onclick={() => gotoPage(data.page + 1)}><ChevronRight size="24" /></button
		>
		<button
			class="flex cursor-pointer rounded-md bg-neutral-800 px-4 py-2 hover:bg-neutral-600 disabled:pointer-events-none disabled:opacity-0"
			aria-label="Last page"
			disabled={data.page === totalPages}
			onclick={() => gotoPage(totalPages)}><ChevronLast size="24" /></button
		>
	</div>
</div>

{#if selectedPlan}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-neutral-800/95 p-4 text-neutral-200"
	>
		<div
			class="shadow-card max-h-full w-9/10 max-w-full space-y-4 overflow-y-auto rounded-md bg-black p-12"
		>
			<div class="flex items-center justify-between">
				<h2 class="text-5xl font-medium">Production Plan Details</h2>
				<button
					onclick={() => (selectedPlan = null)}
					class="rounded-md bg-neutral-800 px-4 py-2 text-2xl text-neutral-200 hover:bg-neutral-600"
					>Close</button
				>
			</div>
			<div class="grid grid-cols-12 gap-8 text-center text-xl">
				{#each fields as [key, label]}
					<div class="col-span-4 rounded-md bg-neutral-800/80 p-4">
						<p class="rounded-md bg-neutral-700/80 p-4 text-xl text-neutral-200">{label}</p>
						<p class="p-2">{selectedPlan[key] ?? '—'}</p>
					</div>
				{/each}
			</div>
		</div>
	</div>
{/if}
