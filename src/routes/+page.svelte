<script lang="ts">
	import { styles as uiStyles } from '$lib/utils/styles';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { toast } from '$lib/utils/toast.js';
	import { onMount } from 'svelte';
	import { Calendar, TriangleAlert } from 'lucide-svelte';

	export let data;
	const { kpi } = data;
	let show = false;

	onMount(() => {
		if (data.errors?.length && !show) {
			data.errors.forEach((err) => {
				toast.show(err, 'error', 5000);
			});
			show = true;
		}

		document.addEventListener('click', handleDocumentClick);
		window.addEventListener('keydown', handleEscapeKey);

		return () => {
			document.removeEventListener('click', handleDocumentClick);
			window.removeEventListener('keydown', handleEscapeKey);
		};
	});

	let selectedYear: number | null = null;
	let isYearPickerOpen = false;
	let yearPickerContainer: HTMLDivElement | null = null;

	function closeYearPicker() {
		isYearPickerOpen = false;
	}

	function handleDocumentClick(event: MouseEvent) {
		if (!isYearPickerOpen || !yearPickerContainer) return;

		const target = event.target as Node | null;
		if (target && !yearPickerContainer.contains(target)) {
			closeYearPicker();
		}
	}

	function handleEscapeKey(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeYearPicker();
		}
	}

	$: normalizedMonthlyKPIs = (data.monthlyKPIs ?? [])
		.map((row) => ({ ...row, year: Number(row.year), month: Number(row.month) }))
		.filter((row) => Number.isFinite(row.year) && Number.isFinite(row.month));

	$: yearsFromKpiView = (data.KPIsYears ?? [])
		.map((year) => Number(year))
		.filter((year) => Number.isFinite(year));

	$: yearsFromMonthlyKpis = Array.from(new Set(normalizedMonthlyKPIs.map((row) => row.year)));

	$: availableYears = [...new Set([...yearsFromKpiView, ...yearsFromMonthlyKpis])].sort(
		(a, b) => b - a
	);

	$: if (
		availableYears.length > 0 &&
		(selectedYear === null || !availableYears.includes(selectedYear))
	) {
		selectedYear = availableYears[0];
	}

	$: currentYearLabel = selectedYear ?? 'Year';
	$: monthlyKPIsByYear = normalizedMonthlyKPIs
		.filter((row) => row.year === selectedYear)
		.sort((a, b) => a.month - b.month);

	function toggleYearPicker() {
		isYearPickerOpen = !isYearPickerOpen;
	}

	function chooseYear(year: number) {
		selectedYear = Number(year);
		isYearPickerOpen = false;
	}

	const monthLabels = [
		'',
		'January',
		'February',
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
					{#if data.blankStock.length === 0}
						<thead>
							<tr>
								<th>No Blank Stock</th>
							</tr>
						</thead>
					{:else}
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
					{/if}
				</table>
				<h2 class={uiStyles.c0030}>Loadcell Stock</h2>
				<table class={uiStyles.c0031}>
					{#if data.loadcellStock.length === 0}
						<thead>
							<tr>
								<th>No Loadcell Stock</th>
							</tr>
						</thead>
					{:else}
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
					{/if}
				</table>
			</div>
			<div class={uiStyles.c0033}>
				<div>
					<h2 class={uiStyles.c0158}>
						Monthly KPIs <div class="relative" bind:this={yearPickerContainer}>
							<span>{currentYearLabel}</span>
							<button
								type="button"
								class={uiStyles.c0160}
								aria-haspopup="listbox"
								aria-expanded={isYearPickerOpen}
								onclick={toggleYearPicker}
							>
								<Calendar size={20} /></button
							>
							{#if isYearPickerOpen}
								<ul class={uiStyles.c0161} role="listbox">
									{#each availableYears as year}
										<li>
											<button
												type="button"
												class="w-full px-3 py-2 text-center hover:bg-orange-500 {year ===
												currentYearLabel
													? 'bg-orange-800 text-neutral-200'
													: ''}"
												onclick={() => chooseYear(year)}
												role="option"
												aria-selected={year === currentYearLabel}
											>
												{year}
											</button>
										</li>
									{/each}
								</ul>
							{/if}
						</div>
					</h2>
					<table class={uiStyles.c0159}>
						{#if monthlyKPIsByYear.length === 0}
							<thead>
								<tr>
									<th>No KPI data for the selected year</th>
								</tr>
							</thead>
						{:else}
							<thead>
								<tr>
									<th>Month</th>
									<th>Planned vs<br /> Dispatched (%)</th>
									<th>Planned vs<br /> Produced (%)</th>
									<th>Produced vs<br /> Dispatched (%)</th>
								</tr>
							</thead>
							<tbody>
								{#each monthlyKPIsByYear as kpimy}
									<tr>
										<td>{monthLabels[kpimy.month]}</td>
										<td>{kpimy.plnvdsp ?? 0}</td>
										<td>{kpimy.plnvpro ?? 0}</td>
										<td>{kpimy.provdsp ?? 0}</td>
									</tr>
								{/each}
							</tbody>
						{/if}
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
						<h2 class={uiStyles.c0038}>
							<TriangleAlert size={24} color="#cca000" />
							<span class="mr-2 ml-2">Duplicate Blank Numbers</span>
							<TriangleAlert size={24} color="#cca000" />
						</h2>
						<div class={uiStyles.c0039}>
							<table class={uiStyles.c0040}>
								{#if data.blankDuplicates.length === 0}
									<thead>
										<tr>
											<th>No duplicate Blank numbers found</th>
										</tr>
									</thead>
								{:else}
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
								{/if}
							</table>
						</div>
					</div>

					<!-- Duplicate Serial Numbers -->
					<div class={uiStyles.c0037}>
						<h2 class={uiStyles.c0038}>
							<TriangleAlert size={24} color="#cca000" />
							<span class="mr-2 ml-2">Duplicate Serial Numbers</span>
							<TriangleAlert size={24} color="#cca000" />
						</h2>
						<div class={uiStyles.c0039}>
							<table class={uiStyles.c0041}>
								{#if data.serialDuplicates.length === 0}
									<thead>
										<tr>
											<th>No duplicate Serial numbers found</th>
										</tr>
									</thead>
								{:else}
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
								{/if}
							</table>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
</form>
