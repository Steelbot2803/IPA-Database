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
	<h1 class="mb-6 text-5xl font-medium text-neutral-400 text-center">TRS Dashboard</h1>

	<!-- KPI SECTION -->
	<section class="kpi-grid">
		<div class="kpi total-jobs min-w-full mb-4 grid grid-cols-3 gap-4 text-2xl font-medium text-neutral-400">
			<div class="kpi dispatched rounded-lg p-4 bg-green-900/20 border border-green-600/40">
				<h3 class="mb-2">Dispatched</h3>
				<p>{data.dispatched}</p>
			</div>

			<div class="kpi ready rounded-lg p-4 bg-yellow-900/20 border border-yellow-600/40">
				<h3 class="mb-2">Ready</h3>
				<p>{data.ready}</p>
			</div>

			<div class="kpi inprocess rounded-lg p-4 bg-red-900/20 border border-red-600/40">
				<h3 class="mb-2">In-Process</h3>
				<p>{data.inProcess}</p>
			</div>
		</div>
	</section>

	<!-- RECENT JOBS -->
	<section>
		<h2 class="min-w-full mt-12 mb-4 text-2xl font-medium text-neutral-400 rounded-lg p-4 bg-blue-900/20 border border-blue-600/40">Recent Entries</h2>
		<div class="min-w-full text-xl text-neutral-400 rounded-lg p-4 bg-blue-900/20 border border-blue-600/40">
			<table class="mb-12 w-full border-separate border-spacing-y-2 overflow-x-auto">
				<thead>
					<tr class="text-left">
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
	</section>
	
	<!-- DUPLICATE BLANK NO -->
	<section class="min-w-full danger grid grid-cols-2 xl:grid-cols-2 gap-6 items-stretch">
		<h2 class="w-full mt-12 mb-4 text-2xl font-medium text-neutral-400 text-center rounded-lg p-4 bg-purple-900/20 border border-purple-600/40">⚠ Duplicate Blank Numbers</h2>
		<h2 class="w-full mt-12 mb-4 text-2xl font-medium text-neutral-400 text-center rounded-lg p-4 bg-purple-900/20 border border-purple-600/40">⚠ Duplicate Serial Numbers</h2>
        <div class="w-full text-xl text-neutral-400 text-center rounded-lg p-4 bg-purple-900/20 border border-purple-600/40">
            {#if data.blankDuplicates.length === 0}
                <p>No duplicates found.</p>
            {:else}
                <table class="mb-12 w-full border-separate border-spacing-y-2">
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
        <div class="w-full text-xl text-neutral-400 text-center rounded-lg p-4 bg-purple-900/20 border border-purple-600/40">
            {#if data.serialDuplicates.length === 0}
                <p>No duplicates found.</p>
            {:else}
                <table class="mb-12 w-full border-separate border-spacing-y-2 overflow-x-auto">
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
	</section>
</form>
