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
		Funnel,
		Check,
		FileSpreadsheet,
		FileText,
		LoaderCircle,
		Columns3
	} from 'lucide-svelte';
	import { _ALL_EXPORT_COLUMNS } from './exportColumns.js';

	// ─── Props ────────────────────────────────────────────────────────────────
	let { data } = $props();

	type Job = (typeof data.rows)[number] | null;
	type DownloadState = 'idle' | 'loading' | 'done';

	// ─── State ────────────────────────────────────────────────────────────────
	let selectedJob = $state<Job>(null);
	let sortColumn = $state<string | null>(null);
	let sortAscending = $state(true);
	let filters = $derived<Record<string, Filter>>(data.filters ?? {});
	let activeFilter = $state<string | null>(null);
	let popoverEl = $state<HTMLDivElement | null>(null);
	let columnMeta = $derived<Record<string, ColumnMeta>>(data.columnMeta);
	let totalPages = $derived(Math.ceil(data.total / data.pageSize));

	let downloadState: Record<'csv' | 'pdf', DownloadState> = $state({ csv: 'idle', pdf: 'idle' });

	// ─── Column picker state ──────────────────────────────────────────────────
	// selectedExportCols is a Set of column keys the user has ticked.
	// It starts with all columns selected.
	let colPickerOpen = $state(false);
	let colPickerEl = $state<HTMLDivElement | null>(null);
	let selectedExportCols = $state<Set<string>>(new Set(_ALL_EXPORT_COLUMNS.map(([key]) => key)));

	// ─── Derived ──────────────────────────────────────────────────────────────
	let isDefaultState = $derived(Object.keys(filters).length === 0 && !sortColumn);

	// ─── Pagination ───────────────────────────────────────────────────────────
	function gotoPage(page: number) {
		if (!browser) return;
		if (page < 1 || page > totalPages) return;
		goto(buildPageQuery(window.location.search, page));
	}

	// ─── Sorting ──────────────────────────────────────────────────────────────
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

	// ─── Filtering ────────────────────────────────────────────────────────────
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

	// ─── Column picker ────────────────────────────────────────────────────────
	function toggleExportCol(key: string) {
		const next = new Set(selectedExportCols);
		if (next.has(key)) {
			// Don't allow deselecting the last column
			if (next.size > 1) next.delete(key);
		} else {
			next.add(key);
		}
		selectedExportCols = next;
	}

	function selectAllCols() {
		selectedExportCols = new Set(_ALL_EXPORT_COLUMNS.map(([key]) => key));
	}

	function clearAllCols() {
		// Keep at least the first column so we always export something
		selectedExportCols = new Set([_ALL_EXPORT_COLUMNS[0][0]]);
	}

	// ─── Export / download ────────────────────────────────────────────────────
	function getExportUrl(format: 'csv' | 'pdf'): string {
		const params = new URLSearchParams(window.location.search);
		params.set('format', format);
		// Pass the selected column keys as a comma-separated string
		params.set('columns', Array.from(selectedExportCols).join(','));
		return `/trs/lc_db/export?${params.toString()}`;
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
			if (!res.ok) throw new Error(`Download failed`);

			const blob = await res.blob();
			const filename = filenameFromDisposition(
				res.headers.get('Content-Disposition'),
				`loadcell-export.${format}`
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

	// ─── Global event handlers ────────────────────────────────────────────────
	function onKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closePopover();
			colPickerOpen = false;
		}
	}

	function onClickOutside(event: MouseEvent) {
		const target = event.target as Node;
		if (popoverEl && !popoverEl.contains(target)) closePopover();
		if (colPickerEl && !colPickerEl.contains(target)) colPickerOpen = false;
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

	// ─── Modal detail fields ──────────────────────────────────────────────────
	const fields: [keyof NonNullable<Job>, string][] = [
		['derived_status', 'Status'],
		['received_date', 'Received Date'],
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
	<div class={uiStyles.c0148}>
		<h1 class={uiStyles.c0021}>Loadcell Database</h1>
	</div>

	<!-- ── Toolbar: filter reset + export controls ── -->
	<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
		<div>
			<button disabled={isDefaultState} class={uiStyles.c0115} onclick={() => resetAll()}>
				Filter Reset
			</button>
		</div>
		<div class="flex flex-wrap items-center gap-3">
			<!-- Column picker trigger -->
			<div class="group relative" bind:this={colPickerEl}>
				<button
					type="button"
					class={uiStyles.c0156}
					onclick={() => (colPickerOpen = !colPickerOpen)}
					aria-label="Choose export columns"
					title="Choose export columns"
				>
					<Columns3 size={24} class="text-cyan-400" />
				</button>
				<span
					class="text-s pointer-events-none absolute -top-10 -left-[65%] -translate-x-1/2 rounded-md border-2 border-neutral-700 px-2 py-1 whitespace-nowrap text-neutral-200 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
				>
					Choose columns
				</span>

				{#if colPickerOpen}
					<!--
					Column picker panel.
					We render ALL_EXPORT_COLUMNS as checkboxes.
					Ticking/unticking adds/removes a key from selectedExportCols.
				-->
					<div
						class="absolute top-13 left-0 z-50 w-64 -translate-x-1/2 rounded-md border border-neutral-700 bg-neutral-900 p-3 shadow-xl"
					>
						<p class="mb-2 text-sm font-medium text-neutral-300">Export columns</p>
						<div class="mb-2 flex gap-2 text-xs">
							<button
								type="button"
								class="cursor-pointer rounded-sm px-1 py-0.5 text-cyan-500 hover:bg-cyan-950"
								onclick={selectAllCols}>All</button
							>
							<span class="text-neutral-600">|</span>
							<button
								type="button"
								class="cursor-pointer rounded-sm px-1 py-0.5 text-cyan-500 hover:bg-cyan-950"
								onclick={clearAllCols}>None</button
							>
							<span class="ml-auto text-neutral-500">{selectedExportCols.size} selected</span>
						</div>
						<div class="max-h-72 overflow-y-auto">
							{#each _ALL_EXPORT_COLUMNS as [key, label]}
								<label
									class="flex cursor-pointer items-center gap-2 rounded p-1 text-sm text-neutral-200 hover:bg-neutral-800"
								>
									<input
										type="checkbox"
										checked={selectedExportCols.has(key)}
										onchange={() => toggleExportCol(key)}
										class="cursor-pointer rounded bg-neutral-800 accent-cyan-500"
									/>
									{label}
								</label>
							{/each}
						</div>
					</div>
				{/if}
			</div>

			<!-- CSV download -->
			<div class="group relative">
				<button
					class={uiStyles.c0156}
					type="button"
					onclick={() => handleDownload('csv')}
					disabled={downloadState.csv === 'loading'}
					aria-label="Download CSV"
				>
					{#if downloadState.csv === 'done'}
						<Check size={24} class="text-green-500" />
					{:else if downloadState.csv === 'loading'}
						<LoaderCircle size={24} class="animate-spin text-amber-500" />
					{:else}
						<FileSpreadsheet size={24} class="text-cyan-500" />
					{/if}
				</button>
				<span
					class="text-s pointer-events-none absolute -top-10 -left-[50%] -translate-x-1/2 rounded-md border-2 border-neutral-700 px-2 py-1 whitespace-nowrap text-neutral-200 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
				>
					Download CSV
				</span>
			</div>

			<!-- PDF download -->
			<div class="group relative">
				<button
					class={uiStyles.c0156}
					type="button"
					onclick={() => handleDownload('pdf')}
					disabled={downloadState.pdf === 'loading'}
					aria-label="Download PDF"
				>
					{#if downloadState.pdf === 'done'}
						<Check size={24} class="text-green-500" />
					{:else if downloadState.pdf === 'loading'}
						<LoaderCircle size={24} class="animate-spin text-amber-500" />
					{:else}
						<FileText size={24} class="text-cyan-500" />
					{/if}
				</button>
				<span
					class="text-s pointer-events-none absolute -top-10 -left-[50%] -translate-x-1/2 rounded-md border-2 border-neutral-700 px-2 py-1 whitespace-nowrap text-neutral-200 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
				>
					Download PDF
				</span>
			</div>
		</div>
	</div>

	<!-- ── Data table ── -->
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
					<th class={uiStyles.c0118}>Details</th>
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

	<!-- ── Pagination ── -->
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

<!-- ── Detail modal ── -->
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
