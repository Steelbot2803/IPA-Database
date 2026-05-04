<script lang="ts">
	import { styles as uiStyles } from '$lib/utils/styles';
	import { goto, afterNavigate, invalidateAll } from '$app/navigation';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { fade, slide } from 'svelte/transition';
	import { cubicInOut } from 'svelte/easing';
	import { onMount } from 'svelte';
	import { isElectromech } from '$lib/utils/customerFilters.js';
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
		Funnel,
		RefreshCw,
		Check,
		FileSpreadsheet,
		FileText,
		LoaderCircle
	} from 'lucide-svelte';

	let { data } = $props();

	type ProdPlan = (typeof data.rows)[number] | null;
	let selectedPlan: ProdPlan = $state(null);
	let scheduledMonth = $derived(data.scheduledMonth);
	let loading = $state(false);
	type DownloadState = 'idle' | 'loading' | 'done';
	let downloadState: Record<'csv' | 'pdf', DownloadState> = $state({
		csv: 'idle',
		pdf: 'idle'
	});

	function getExportUrl(format: 'csv' | 'pdf'): string {
		const params = new URLSearchParams(window.location.search);
		params.set('format', format);
		if (!params.has('scheduled_month')) params.set('scheduled_month', scheduledMonth);
		if (electromech) params.set('electromech', '1');
		return `/trs/prod_plan_db/export?${params.toString()}`;
	}

	function filenameFromDisposition(contentDisposition: string | null, fallback: string): string {
		if (!contentDisposition) return fallback;
		const match = contentDisposition.match(/filename=\"?([^\";]+)\"?/i);
		return match?.[1] ?? fallback;
	}

	async function handleDownload(format: 'csv' | 'pdf') {
		if (downloadState[format] === 'loading') return;

		downloadState = { ...downloadState, [format]: 'loading' };

		try {
			const res = await fetch(getExportUrl(format));
			if (!res.ok) throw new Error(`Failed to download ${format.toUpperCase()}`);

			const blob = await res.blob();
			const fallbackName = `production-plan-${scheduledMonth}.${format}`;
			const filename = filenameFromDisposition(
				res.headers.get('Content-Disposition'),
				fallbackName
			);
			const objectUrl = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = objectUrl;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			a.remove();
			URL.revokeObjectURL(objectUrl);

			downloadState = { ...downloadState, [format]: 'done' };
		} catch {
			downloadState = { ...downloadState, [format]: 'idle' };
		} finally {
			setTimeout(() => {
				downloadState = { ...downloadState, [format]: 'idle' };
			}, 1200);
		}
	}

	let totalPages = $derived(Math.ceil(data.total / data.pageSize));

	function gotoPage(page: number) {
		if (!browser) return;
		if (page < 1 || page > totalPages) return;
		goto(buildPageQuery(window.location.search, page));
	}

	async function loadMonth() {
		loading = true;
		const params = new URLSearchParams(window.location.search);
		params.set('scheduled_month', scheduledMonth);
		params.set('page', '1');
		const nextQuery = params.toString();
		try {
			if (nextQuery === page.url.searchParams.toString()) {
				await invalidateAll();
				return;
			}

			await goto(`?${nextQuery}`);
		} finally {
			loading = false;
		}
	}

	let electromech = $derived(data.electromech ?? false);

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

	let sortColumn: string | null = $state(null);
	let sortAscending = $state(true);

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

	let filters: Record<string, Filter> = $derived(data.filters ?? {});
	let columnMeta: Record<string, ColumnMeta> = $derived(data.columnMeta);
	let activeFilter: string | null = $state(null);
	let popoverEl: HTMLDivElement | null = $state(null);

	let visibleRows = $derived(
		electromech
			? data.rows.filter((row: ProdPlan) => isElectromech(row?.customer))
			: data.rows.filter((row: ProdPlan) => !isElectromech(row?.customer))
	);

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
		params.set('scheduled_month', scheduledMonth);
		params.delete('filters');
		params.delete('sort');
		params.delete('order');
		params.set('page', '1');
		goto(`?${params.toString()}`, { replaceState: true, noScroll: true });
		closePopover();
	}

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

	const fields: [keyof ProdPlan, string][] = [
		['derived_status', 'Status'],
		['scheduled_month', 'Scheduled Month'],
		['planned_dispatch', 'Planned Dispatch'],
		['actual_dispatch', 'Actual Dispatch'],
		['job_no', 'Job No'],
		['job_card_no', 'Job Card No'],
		['model_no', 'Model No'],
		['quantity', 'Quantity'],
		['pending_qty', 'Pending Quantity'],
		['dispatched_qty', 'Dispatched Quantity'],
		['customer', 'Customer'],
		['remarks', 'Remarks'],
		['id', 'ID']
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
			<input
				id="scheduled_month"
				name="scheduled_month"
				class={uiStyles.c0047}
				type="month"
				bind:value={scheduledMonth}
			/>
		</div>
		<div class={uiStyles.c0064}>
			<button type="button" onclick={loadMonth} disabled={loading} class={uiStyles.c0065}>
				{#if loading}
					<RefreshCw class="animate-spin" size="24" />
				{:else}
					<RefreshCw size="24" />
				{/if}
			</button>
			<div class="ml-12 flex items-center gap-2">
				<div class="group relative">
					<button
						class={uiStyles.c0156}
						type="button"
						onclick={() => handleDownload('csv')}
						disabled={downloadState.csv === 'loading'}
						aria-label="Download CSV Format"
					>
						{#if downloadState.csv === 'done'}
							<Check size={24} class="mr-1 inline text-green-500" />
						{:else if downloadState.csv === 'loading'}
							<LoaderCircle size={24} class="animate-spin text-amber-500" />
						{:else}
							<FileSpreadsheet size={24} class="text-cyan-500" />
						{/if}
					</button>
					<span
						class="text-s pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 rounded-md border-2 border-neutral-700 px-2 py-1 whitespace-nowrap text-neutral-200 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
					>
						Download CSV
					</span>
				</div>
				<div class="group relative">
					<button
						class={uiStyles.c0156}
						type="button"
						onclick={() => handleDownload('pdf')}
						disabled={downloadState.pdf === 'loading'}
						aria-label="Download PDF Format"
					>
						{#if downloadState.pdf === 'done'}
							<Check size={24} class="mr-1 inline text-green-500" />
						{:else if downloadState.pdf === 'loading'}
							<LoaderCircle size={24} class="animate-spin text-amber-500" />
						{:else}
							<FileText size={24} class="text-cyan-500" aria-label="Download PDF Format" />
						{/if}
					</button>
					<span
						class="text-s pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 rounded-md border-2 border-neutral-700 px-2 py-1 whitespace-nowrap text-neutral-200 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
					>
						Download PDF
					</span>
				</div>
			</div>
		</div>
		<div class={uiStyles.c0066}></div>
		<div class={uiStyles.c0049}>
			<label for="electromech_toggle" class={uiStyles.c0050}>
				<span class={uiStyles.c0051}>Main</span>
				<input
					id="electromech_toggle"
					name="electromech_toggle"
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
		{#key electromech}
			<div in:slide={{ duration: 180, easing: cubicInOut }} out:slide={{ duration: 120 }}>
				<div in:fade={{ duration: 180, easing: cubicInOut }} out:fade={{ duration: 120 }}>
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
											<button
												aria-label="Sort"
												class={uiStyles.c0120}
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
											<button class={uiStyles.c0089} onclick={() => (selectedPlan = row)}>
												Open
											</button>
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
		{/key}
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
