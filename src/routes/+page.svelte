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
	<h1 class="mb-6 text-5xl font-medium text-neutral-400">TRS Dashboard</h1>

	<!-- KPI SECTION -->
	<section class="kpi-grid">
		<div class="kpi total-jobs w-3/4 mb-4 grid grid-cols-3 gap-4 text-2xl font-medium text-neutral-400">
			<div class="kpi dispatched">
				<h3 class="mb-2">Dispatched</h3>
				<p>{data.dispatched}</p>
			</div>

			<div class="kpi ready">
				<h3 class="mb-2">Ready</h3>
				<p>{data.ready}</p>
			</div>

			<div class="kpi inprocess">
				<h3 class="mb-2">In Process</h3>
				<p>{data.inProcess}</p>
			</div>
		</div>
	</section>

	<!-- RECENT JOBS -->
	<section>
		<h2 class="mt-12 mb-4 text-2xl font-medium text-neutral-400">Recent Entries</h2>
		<div class=" w-3/4 text-xl text-neutral-400">
			<table class="mb-12 w-full border-separate border-spacing-y-2 overflow-x-auto">
				<thead>
					<tr class="text-left">
                        <th>Job No</th>
                        <th>Model No</th>
						<th>Blank No</th>
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
							<td>{job.derived_status}</td>
							<td>{job.updated_at}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>
	<!-- DUPLICATE BLANK NO -->
	<section class="danger">
		<h2 class="mt-12 mb-4 text-2xl font-medium text-neutral-400">⚠ Duplicate Blank Numbers</h2>
        <div class=" w-1/5 text-xl text-neutral-400 text-center">
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
	</section>

	<section class="danger">
		<h2 class="mt-12 mb-4 text-2xl font-medium text-neutral-400">⚠ Duplicate Serial Numbers</h2>
        <div class=" w-1/5 text-xl text-neutral-400 text-center">
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
