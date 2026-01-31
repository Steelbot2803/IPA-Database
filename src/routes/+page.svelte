<script lang="ts">
	export let data;
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
</script>

<form
	method="POST"
	use:enhance={() => {
		return async () => {
			await invalidateAll();
		};
	}}
>
	<h1 class="mb-6 text-center text-5xl font-medium text-neutral-400">TRS Dashboard</h1>

	<!-- KPI SECTION -->
	<section class="kpi-grid">
		<div
			class="kpi total-jobs mb-4 grid min-w-full grid-cols-3 gap-4 text-2xl font-medium text-neutral-400"
		>
			<div class="kpi dispatched rounded-md border-2 border-green-600/40 bg-green-900/20 p-4">
				<h3 class="mb-2">Dispatched</h3>
				<p>{data.dispatched}</p>
			</div>

			<div class="kpi ready rounded-md border-2 border-yellow-600/40 bg-yellow-900/20 p-4">
				<h3 class="mb-2">Ready</h3>
				<p>{data.ready}</p>
			</div>

			<div class="kpi inprocess rounded-md border-2 border-red-600/40 bg-red-900/20 p-4">
				<h3 class="mb-2">In-Process</h3>
				<p>{data.inProcess}</p>
			</div>
		</div>
	</section>

	<!-- DATA TABLES SECTION -->
	 
	<section>
		<div class="mt-4 grid min-w-full grid-cols-3 gap-6 rounded-md p-4 text-xl text-neutral-400">
			<div class="col-span-1 rounded-md border-2 border-teal-600/40 p-4 text-center">
				<h2 class="mb-4 w-full rounded-md bg-teal-900/20 p-4 text-2xl font-medium text-neutral-400">
					Blank Stock
				</h2>
				<table
					class="mb-4 w-full border-separate border-spacing-y-2 overflow-x-auto rounded-md bg-teal-900/20 p-4"
				>
					<thead>
						<tr>
							<th>Model No</th>
							<th>Quantity</th>
						</tr>
					</thead>
					<tbody>
						{#each data.blankStock as bstk}
							<tr>
								<td>{bstk.model_no}</td>
								<td>{bstk.quantity}</td>
							</tr>
						{/each}
					</tbody>
				</table>
				<h2 class="mb-4 w-full rounded-md bg-teal-900/20 p-4 text-2xl font-medium text-neutral-400">
					Loadcell Stock
				</h2>
				<table
					class="w-full border-separate border-spacing-y-2 overflow-x-auto rounded-md bg-teal-900/20 p-4"
				>
					<thead>
						<tr>
							<th>Model No</th>
							<th>Quantity</th>
						</tr>
					</thead>
					<tbody>
						{#each data.loadcellStock as lcstk}
							<tr>
								<td>{lcstk.model_no}</td>
								<td>{lcstk.quantity}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<div class="col-span-2 flex flex-col gap-4 rounded-md border-2 border-blue-600/40 p-4 text-center">
				<!-- Recent Entries Section -->
				<div>
					<h2 class="mb-4 w-full rounded-md bg-blue-900/20 p-4 text-2xl font-medium text-neutral-400">
						Recent Entries
					</h2>
					<table class="w-full border-separate border-spacing-y-2 overflow-x-auto rounded-md bg-blue-900/20 p-4">
						<thead>
							<tr>
								<th>Job No</th>
								<th>Model No</th>
								<th>Blank No</th>
								<th>Serial No</th>
								<th>Status</th>
								<th>Last Updated</th>
							</tr>
						</thead>
						<tbody>
							{#each data.recentJobs as job}
								<tr>
									<td>{job.job_no}</td>
									<td>{job.model_no}</td>
									<td>{job.blank_no}</td>
									<td>{job.serial_no}</td>
									<td>{job.derived_status}</td>
									<td>{job.updated_at}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<!-- Duplicate Sections -->
				<div class="grid grid-cols-2 gap-4">
					<!-- Duplicate Blank Numbers -->
					<div class="flex flex-col gap-4">
						<h2 class="w-full rounded-md bg-purple-900/20 p-4 text-center text-2xl font-medium text-neutral-400">
							⚠ Duplicate Blank Numbers
						</h2>
						<div class="w-full rounded-md bg-purple-900/20 p-4 text-center text-xl text-neutral-400">
							{#if data.blankDuplicates.length === 0}
								<p>No duplicates found.</p>
							{:else}
								<table class="w-full border-separate border-spacing-y-2">
									<thead>
										<tr>
											<th>Blank No</th>
											<th>Occurrences</th>
										</tr>
									</thead>
									<tbody>
										{#each data.blankDuplicates as dup}
											<tr>
												<td>{dup.blank_no}</td>
												<td>{dup.count}</td>
											</tr>
										{/each}
									</tbody>
								</table>
							{/if}
						</div>
					</div>

					<!-- Duplicate Serial Numbers -->
					<div class="flex flex-col gap-4">
						<h2 class="w-full rounded-md bg-purple-900/20 p-4 text-center text-2xl font-medium text-neutral-400">
							⚠ Duplicate Serial Numbers
						</h2>
						<div class="w-full rounded-md bg-purple-900/20 p-4 text-center text-xl text-neutral-400">
							{#if data.serialDuplicates.length === 0}
								<p>No duplicates found.</p>
							{:else}
								<table class="w-full border-separate border-spacing-y-2 overflow-x-auto">
									<thead>
										<tr>
											<th>Serial No</th>
											<th>Occurrences</th>
										</tr>
									</thead>
									<tbody>
										{#each data.serialDuplicates as dup}
											<tr>
												<td>{dup.serial_no}</td>
												<td>{dup.count}</td>
											</tr>
										{/each}
									</tbody>
								</table>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
</form>