<script lang="ts">
	import { styles as uiStyles } from '$lib/utils/styles';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { toast } from '$lib/utils/toast.js';
	import { onMount } from 'svelte';
	import { Calendar } from 'lucide-svelte';

	export let data;
	const { kpi } = data;
	let show = false;

	const LABELS = {
		dispatch_qty: 'Dispatched',
		ready_qty: 'Ready',
		in_process_qty: 'In-Process'
	};

	onMount(() => {
		if (data.errors?.length && !show) {
			data.errors.forEach((err) => {
				toast.show(err, 'error', 5000);
			});
			show = true;
		}
	});

	const monthLabels = [
		'',
		'January',
		'Ferbuary',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	];
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
			{#each kpi as kpi}
				<div class={kpi.class}>
					<h3 class={uiStyles.c0025}>{kpi.label}</h3>
					<p class="text-center">{kpi.value}</p>
				</div>
			{/each}
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
				<div>
					<h2 class={uiStyles.c0158}>
						Monthly KPIs <div>
							<label for="year" class="p-2">Year</label><button
								type="button"
								class="cursor-pointer rounded-md border-2 border-orange-500 p-2 hover:bg-orange-500"
								><Calendar size={20} /></button
							>
						</div>
					</h2>
					<table class={uiStyles.c0159}>
						<thead>
							<tr>
								<th>Month</th>
								<th>Planned vs Dispatched (%)</th>
								<th>Planned vs Produced (%)</th>
								<th>Produced vs Dispatched (%)</th>
							</tr>
						</thead>
						<tbody>
							{#each data.monthlyKPIs as kpim}
								<tr>
									<td>{monthLabels[kpim.month]}</td>
									<td>{kpim.plnvdsp}</td>
									<td>{kpim.plnvpro}</td>
									<td>{kpim.provdsp}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

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
