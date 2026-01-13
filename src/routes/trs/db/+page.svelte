<script lang="ts">
	export let data;

	type Job = typeof data.rows[number] | null;

	let selectedJob: Job = null;

	const PAGE_SIZE = 25;
	const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
</script>

<div class="bg-neutral text-neutral-400 w-full space-y-6">
	<h1 class="mb-6 text-5xl font-medium text-neutral-400">Database</h1>
	<!-- ================= SEARCH BAR ================= -->
	<form method="GET" class="gap-3 items-center bg-surface p-4 rounded-md">

		<select
			name="column"
			class="rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2 text-neutral-400 w-1/7"
		>
			<option value="">Select column</option>
			{#each data.searchableColumns as col}
				<option value={col} selected={data.search.column === col}>
					{col.replaceAll("_", " ").toUpperCase()}
				</option>
			{/each}
		</select>

		<input
			name="value"
			value={data.search.value ?? ""}
			placeholder="Search value"
			class="flex-1 rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-400 w-5/7"
		/>
			<button class="font-5xl cursor-pointer rounded-md bg-neutral-800 px-16 py-2 hover:bg-neutral-600"> Apply Filters </button>
	</form>

	<!-- ================= TABLE ================= -->
	<div class="w-full text-center text-xl text-neutral-400">
		<table class="mb-12 w-full border-separate border-spacing-y-2">
			<thead>
				<tr>
					<th>Job Date</th>
					<th>Job No</th>
					<th>Job Card No</th>
					<th>Model No</th>
					<th>Blank No</th>
					<th>Serial No</th>
					<th></th>
				</tr>
			</thead>

			<tbody>
				{#each data.rows as row}
					<tr class="hover:bg-neutral-600/50">
						<td class="py-3">{row.job_date}</td>
						<td>{row.job_no}</td>
						<td>{row.job_card_no ?? '—'}</td>
						<td>{row.model_no}</td>
						<td>{row.blank_no}</td>
						<td>{row.serial_no ?? '—'}</td>
						<td>
							<button
								class="font-5xl rounded-md bg-neutral-800 px-4 py-2 hover:bg-neutral-600"
								on:click={() => (selectedJob = row)}
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
	<div class="flex items-center justify-between">
		<p class="text-sm text-neutral-400">
			Page {data.page} of {totalPages}
		</p>

		<div class="flex gap-2">
			{#if data.page > 1}
				<a
					href={`?q=page=${data.page - 1}`}
					class="font-5xl rounded-md bg-neutral-800 px-4 py-2 hover:bg-neutral-600"
				>
					Prev
				</a>
			{/if}

			{#if data.page < totalPages}
				<a
					href={`?q=page=${data.page + 1}`}
					class="font-5xl rounded-md bg-neutral-800 px-4 py-2 hover:bg-neutral-600"
				>
					Next
				</a>
			{/if}
		</div>
	</div>
</div>

{#if selectedJob}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-neutral-800/95 p-4 text-neutral-400">
		<div class="shadow-card w-9/10 max-h-full max-w-full space-y-4 overflow-y-auto rounded-md bg-black p-12">
			<div class="flex items-center justify-between">
				<h2 class="text-5xl font-medium">Job Details</h2>
				<button on:click={() => (selectedJob = null)} class="rounded-md bg-neutral-800 px-4 py-2 hover:bg-neutral-600 text-2xl text-neutral-400"> Close </button>
			</div>

			<div class="grid grid-cols-12 gap-8 text-xl">
				{#each Object.entries(selectedJob) as [key, value]}
					<div class="col-span-4">
						<p class="text-xl text-neutral-400">{key}</p>
						<p>{value ?? '—'}</p>
					</div>
				{/each}
			</div>
		</div>
	</div>
{/if}
