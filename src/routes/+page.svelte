<script lang="ts">
	import { styles as uiStyles } from '$lib/utils/styles';
	export let data;
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { toast } from '$lib/utils/toast.js';
	import { onMount } from 'svelte';

	let show = false;

	onMount(() => {
		if (data.errors?.length && !show) {
			data.errors.forEach((err) => {
				toast.show(err, 'error', 5000);
			});
			show = true;
		}
	});
</script>

<form
	method="POST"
	use:enhance={() => {
		return async () => {
			await invalidateAll();
		};
	}}
>
	<h1 class={uiStyles.c0021}>TRS Dashboard</h1>

	<!-- KPI SECTION -->
	<section class={uiStyles.c0022}>
		<div class={uiStyles.c0023}>
			<div class={uiStyles.c0024}>
				<h3 class={uiStyles.c0025}>Dispatched</h3>
				<p>{data.dispatched}</p>
			</div>

			<div class={uiStyles.c0026}>
				<h3 class={uiStyles.c0025}>Ready</h3>
				<p>{data.ready}</p>
			</div>

			<div class={uiStyles.c0027}>
				<h3 class={uiStyles.c0025}>In-Process</h3>
				<p>{data.inProcess}</p>
			</div>
		</div>
	</section>

	<!-- DATA TABLES SECTION -->

	<section>
		<div class={uiStyles.c0028}>
			<div class={uiStyles.c0029}>
				<h2 class={uiStyles.c0030}>Blank Stock</h2>
				<table class={uiStyles.c0031}>
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
				<h2 class={uiStyles.c0030}>Loadcell Stock</h2>
				<table class={uiStyles.c0032}>
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
			<div class={uiStyles.c0033}>
				<!-- Recent Entries Section -->
				<div>
					<h2 class={uiStyles.c0034}>Recent Entries</h2>
					<table class={uiStyles.c0035}>
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
				<div class={uiStyles.c0036}>
					<!-- Duplicate Blank Numbers -->
					<div class={uiStyles.c0037}>
						<h2 class={uiStyles.c0038}>⚠ Duplicate Blank Numbers</h2>
						<div class={uiStyles.c0039}>
							{#if data.blankDuplicates.length === 0}
								<p>No duplicates found.</p>
							{:else}
								<table class={uiStyles.c0040}>
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
					<div class={uiStyles.c0037}>
						<h2 class={uiStyles.c0038}>⚠ Duplicate Serial Numbers</h2>
						<div class={uiStyles.c0039}>
							{#if data.serialDuplicates.length === 0}
								<p>No duplicates found.</p>
							{:else}
								<table class={uiStyles.c0041}>
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
