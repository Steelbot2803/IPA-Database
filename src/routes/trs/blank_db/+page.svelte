<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { page } from '$app/state';

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

		// After sorting, go back to page 1
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

	const fields: [keyof Job, string][] = [
		['id', 'ID'],
		['received_date', 'Received Date'],
		['job_no', 'Job No'],
		['job_card_no', 'Job Card No'],
		['model_no', 'Model No'],
		['blank_no', 'Blank No']
	];
</script>

<div class="bg-neutral min-w-full space-y-6 text-neutral-400">
	<h1 class="mb-6 text-center text-5xl font-medium text-neutral-400">Blank Stock Database</h1>
	<!-- ================= SEARCH BAR ================= -->
	<form method="GET" class="bg-surface items-center gap-3 rounded-md p-4">
		<select
			name="column"
			class="w-2/9 rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-400"
		>
			<option value="">Select column</option>
			{#each data.searchableColumns as col}
				<option value={col} selected={data.search.column === col}>
					{data.columnAliases[col as keyof typeof data.columnAliases] ??
						col.replaceAll('_', ' ').toUpperCase()}
				</option>
			{/each}
		</select>

		<input
			name="value"
			value={data.search.value ?? ''}
			placeholder="Search value"
			class="w-4/9 flex-1 rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-400"
		/>
		<button
			class="font-5xl cursor-pointer rounded-md bg-neutral-800 px-4 py-3 hover:bg-neutral-600"
		>
			Apply Filter
		</button>
		<a
			href="/trs/blank_db"
			class="font-5xl cursor-pointer rounded-md bg-neutral-800 px-3 py-3 hover:bg-neutral-600"
		>
			Clear Filter
		</a>
	</form>

	<!-- ================= TABLE ================= -->
	<div class="w-full text-center text-xl text-neutral-400">
		<table class="mb-12 w-full border-separate border-spacing-y-2">
			<thead>
				<tr>
					<th class="{sortColumn === 'received_date' ? 'bg-green-950/70' : ''} rounded-md py-2">
						<span>Received Date</span>
						<button
							class="ml-2 cursor-pointer rounded-md bg-neutral-800 px-2 py-1 hover:bg-neutral-600"
							on:click={() => toggleSort('received_date')}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="lucide lucide-chevrons-up-down-icon lucide-chevrons-up-down"
							>
								{#if sortColumn !== 'received_date'}
									<path d="m7 15 5 5 5-5" />
									<path d="m7 9 5-5 5 5" />
								{:else if sortAscending}
									<path d="m7 9 5-5 5 5" />
								{:else}
									<path d="m7 15 5 5 5-5" />
								{/if}
							</svg>
						</button>
					</th>
					<th class="{sortColumn === 'job_no' ? 'bg-green-950/70' : ''} rounded-md py-2">
						<span>Job No</span>
						<button
							class="ml-2 cursor-pointer rounded-md bg-neutral-800 px-2 py-1 hover:bg-neutral-600"
							on:click={() => toggleSort('job_no')}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="lucide lucide-chevrons-up-down-icon lucide-chevrons-up-down"
							>
								{#if sortColumn !== 'job_no'}
									<path d="m7 15 5 5 5-5" />
									<path d="m7 9 5-5 5 5" />
								{:else if sortAscending}
									<path d="m7 9 5-5 5 5" />
								{:else}
									<path d="m7 15 5 5 5-5" />
								{/if}
							</svg>
						</button>
					</th>
					<th class="{sortColumn === 'job_card_no' ? 'bg-green-950/70' : ''} rounded-md py-2">
						<span>Job Card No</span>
						<button
							class="ml-2 cursor-pointer rounded-md bg-neutral-800 px-2 py-1 hover:bg-neutral-600"
							on:click={() => toggleSort('job_card_no')}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="lucide lucide-chevrons-up-down-icon lucide-chevrons-up-down"
							>
								{#if sortColumn !== 'job_card_no'}
									<path d="m7 15 5 5 5-5" />
									<path d="m7 9 5-5 5 5" />
								{:else if sortAscending}
									<path d="m7 9 5-5 5 5" />
								{:else}
									<path d="m7 15 5 5 5-5" />
								{/if}
							</svg>
						</button>
					</th>
					<th class="{sortColumn === 'model_no' ? 'bg-green-950/70' : ''} rounded-md py-2">
						<span>Model No</span>
						<button
							class="ml-2 cursor-pointer rounded-md bg-neutral-800 px-2 py-1 hover:bg-neutral-600"
							on:click={() => toggleSort('model_no')}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="lucide lucide-chevrons-up-down-icon lucide-chevrons-up-down"
							>
								{#if sortColumn !== 'model_no'}
									<path d="m7 15 5 5 5-5" />
									<path d="m7 9 5-5 5 5" />
								{:else if sortAscending}
									<path d="m7 9 5-5 5 5" />
								{:else}
									<path d="m7 15 5 5 5-5" />
								{/if}
							</svg>
						</button>
					</th>
					<th class="{sortColumn === 'blank_no' ? 'bg-green-950/70' : ''} rounded-md py-2">
						<span>Blank No</span>
						<button
							class="ml-2 cursor-pointer rounded-md bg-neutral-800 px-2 py-1 hover:bg-neutral-600"
							on:click={() => toggleSort('blank_no')}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="lucide lucide-chevrons-up-down-icon lucide-chevrons-up-down"
							>
								{#if sortColumn !== 'blank_no'}
									<path d="m7 15 5 5 5-5" />
									<path d="m7 9 5-5 5 5" />
								{:else if sortAscending}
									<path d="m7 9 5-5 5 5" />
								{:else}
									<path d="m7 15 5 5 5-5" />
								{/if}
							</svg>
						</button>
					</th>
					<th></th>
				</tr>
			</thead>

			<tbody>
				{#each data.rows as row}
					<tr class="hover:bg-neutral-600/50">
						<td>{row.received_date ?? '—'}</td>
						<td>{row.job_no ?? 'STOCK'}</td>
						<td>{row.job_card_no ?? '—'}</td>
						<td>{row.model_no}</td>
						<td>{row.blank_no}</td>
						<td
							><button
								class="font-5xl rounded-md bg-neutral-800 px-4 py-2 hover:bg-neutral-600"
								on:click={() => (selectedJob = row)}
							>
								Open
							</button></td
						>
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
			on:click={() => gotoPage(1)}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="lucide lucide-chevron-first-icon lucide-chevron-first"
				><path d="m17 18-6-6 6-6" /><path d="M7 6v12" /></svg
			>
		</button>
		<button
			class="flex cursor-pointer rounded-md bg-neutral-800 px-4 py-2 hover:bg-neutral-600 disabled:pointer-events-none disabled:opacity-0"
			aria-label="Previous page"
			disabled={data.page === 1}
			on:click={() => gotoPage(data.page - 1)}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="lucide lucide-chevron-left-icon lucide-chevron-left"><path d="m15 18-6-6 6-6" /></svg
			>
		</button>

		<span class="px-4 text-xl"> {data.page} / {totalPages} </span>

		<button
			class="flex cursor-pointer rounded-md bg-neutral-800 px-4 py-2 hover:bg-neutral-600 disabled:pointer-events-none disabled:opacity-0"
			aria-label="Next page"
			disabled={data.page === totalPages}
			on:click={() => gotoPage(data.page + 1)}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="lucide lucide-chevron-right-icon lucide-chevron-right"
				><path d="m9 18 6-6-6-6" /></svg
			>
		</button>
		<button
			class="flex cursor-pointer rounded-md bg-neutral-800 px-4 py-2 hover:bg-neutral-600 disabled:pointer-events-none disabled:opacity-0"
			aria-label="Last page"
			disabled={data.page === totalPages}
			on:click={() => gotoPage(totalPages)}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="lucide lucide-chevron-last-icon lucide-chevron-last"
				><path d="m7 18 6-6-6-6" /><path d="M17 6v12" /></svg
			>
		</button>
	</div>
</div>

{#if selectedJob}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-neutral-800/95 p-4 text-neutral-400"
	>
		<div
			class="shadow-card max-h-full w-9/10 max-w-full space-y-4 overflow-y-auto rounded-md bg-black p-12"
		>
			<div class="flex items-center justify-between">
				<h2 class="text-5xl font-medium">Blank Details</h2>
				<button
					on:click={() => (selectedJob = null)}
					class="rounded-md bg-neutral-800 px-4 py-2 text-2xl text-neutral-400 hover:bg-neutral-600"
				>
					Close
				</button>
			</div>

			<div class="grid grid-cols-12 gap-8 text-center text-xl">
				{#each fields as [key, label]}
					<div class="col-span-4 rounded-md bg-neutral-900/80 p-4">
						<p class="rounded-md bg-neutral-700/80 p-4 text-xl text-neutral-400">{label}</p>
						<p class="p-2">{selectedJob[key] ?? '—'}</p>
					</div>
				{/each}
			</div>
		</div>
	</div>
{/if}
