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

<div class="bg-neutral min-w-full space-y-6 text-neutral-200">
	<h1 class="mb-6 text-center text-5xl font-medium text-neutral-200">Loadcell Database</h1>
	<div class="flex justify-end">
		<button
			disabled={isDefaultState}
			class="font-5xl cursor-pointer rounded-md bg-red-800 px-4 py-2 hover:bg-red-600 disabled:pointer-events-none disabled:opacity-0"
			onclick={() => resetAll()}>Filter Reset</button
		>
	</div>
	<!-- ================= TABLE ================= -->
	<div class="w-full text-xl text-neutral-200">
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
										class="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-xl text-neutral-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
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
										<select
											class="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
											bind:value={filters[column].value}
										>
											{#each columnMeta[column].values as v}
												<option value={v}>{v}</option>
											{/each}
										</select>
									{:else if columnMeta[column].type === 'date' && filters[column]?.op === 'between'}
										<input
											class="input mt-2 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
											type="date"
											bind:value={filters[column].value[0]}
										/>
										<input
											class="input mt-2 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
											type="date"
											bind:value={filters[column].value[1]}
										/>
									{:else if columnMeta[column].type === 'date'}
										<input
											class="input mt-2 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
											type="date"
											bind:value={filters[column].value}
										/>
									{:else}
										<input
											class="input mt-2 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
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
				{#each data.rows as row}
					<tr class="hover:bg-neutral-600/50">
						{#each Object.keys(columnMeta) as column}
							<td class="px-6">{row[column] ?? '—'}</td>
						{/each}
						<td>
							<button
								class="font-5xl rounded-md bg-neutral-800 px-4 py-2 hover:bg-neutral-600"
								onclick={() => (selectedJob = row)}
							>
								Open
							</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	<!-- ================= PAGINATION ================= -->
	<div class="flex-nonwrap flex justify-center space-x-4 text-center">
		<button
			class="flex cursor-pointer rounded-md bg-neutral-800 px-4 py-2 hover:bg-neutral-600 disabled:pointer-events-none disabled:opacity-0"
			aria-label="First page"
			disabled={data.page === 1}
			onclick={() => gotoPage(1)}
		>
			<ChevronFirst size="24" />
		</button>
		<button
			class="flex cursor-pointer rounded-md bg-neutral-800 px-4 py-2 hover:bg-neutral-600 disabled:pointer-events-none disabled:opacity-0"
			aria-label="Previous page"
			disabled={data.page === 1}
			onclick={() => gotoPage(data.page - 1)}
		>
			<ChevronLeft size="24" />
		</button>

		<span class="px-4 text-xl"> {data.page} / {totalPages} </span>

		<button
			class="flex cursor-pointer rounded-md bg-neutral-800 px-4 py-2 hover:bg-neutral-600 disabled:pointer-events-none disabled:opacity-0"
			aria-label="Next page"
			disabled={data.page === totalPages}
			onclick={() => gotoPage(data.page + 1)}
		>
			<ChevronRight size="24" />
		</button>
		<button
			class="flex cursor-pointer rounded-md bg-neutral-800 px-4 py-2 hover:bg-neutral-600 disabled:pointer-events-none disabled:opacity-0"
			aria-label="Last page"
			disabled={data.page === totalPages}
			onclick={() => gotoPage(totalPages)}
		>
			<ChevronLast size="24" />
		</button>
	</div>
</div>

{#if selectedJob}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-neutral-800/95 p-4 text-neutral-200"
	>
		<div
			class="shadow-card max-h-full w-9/10 max-w-full space-y-4 overflow-y-auto rounded-md bg-black p-12"
		>
			<div class="flex items-center justify-between">
				<h2 class="text-5xl font-medium">Loadcell Details</h2>
				<button
					onclick={() => (selectedJob = null)}
					class="rounded-md bg-neutral-800 px-4 py-2 text-2xl text-neutral-200 hover:bg-neutral-600"
				>
					Close
				</button>
			</div>

			<div class="grid grid-cols-12 gap-8 text-center text-xl">
				{#each fields as [key, label]}
					<div class="col-span-4 rounded-md bg-neutral-800/80 p-4">
						<p class="rounded-md bg-neutral-700/80 p-4 text-xl text-neutral-200">{label}</p>
						<p class="p-2">{selectedJob[key] ?? '—'}</p>
					</div>
				{/each}
			</div>
		</div>
	</div>
{/if}
