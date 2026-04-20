<!-- PATH: src/routes/+page.svelte -->
<script lang="ts">
	import { styles as uiStyles } from '$lib/utils/styles';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { toast } from '$lib/utils/toast.js';
	import { onMount } from 'svelte';
	import { Calendar, TriangleAlert } from 'lucide-svelte';

	// Svelte 5: $props() replaces "export let data"
	let { data } = $props();

	let kpi = $derived(data.kpi ?? []);

	// Svelte 5: $state() for all mutable variables
	let show = $state(false);
	let selectedYear = $state<number | null>(null);
	let isYearPickerOpen = $state(false);
	let yearPickerContainer = $state<HTMLDivElement | null>(null);

	const kpiClasses: Record<string, string> = {
		dispatched: uiStyles.c0024,
		ready: uiStyles.c0026,
		in_process: uiStyles.c0027,
		blank_stock: uiStyles.c0157
	};

	onMount(() => {
		if (data.errors?.length && !show) {
			data.errors.forEach((err: string) => {
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

	function closeYearPicker() {
		isYearPickerOpen = false;
	}

	function handleDocumentClick(event: MouseEvent) {
		if (!isYearPickerOpen || !yearPickerContainer) return;
		const target = event.target as Node | null;
		if (target && !yearPickerContainer.contains(target)) closeYearPicker();
	}

	function handleEscapeKey(event: KeyboardEvent) {
		if (event.key === 'Escape') closeYearPicker();
	}

	// Svelte 5: $derived() replaces $: reactive declarations
	let normalizedMonthlyKPIs = $derived(
		(data.monthlyKPIs ?? [])
			.map((row: Record<string, unknown>) => ({
				...row,
				year: Number(row.year),
				month: Number(row.month),
				plnvdsp: Number(row.plnvdsp),
				plnvpro: Number(row.plnvpro),
				provdsp: Number(row.provdsp)
			}))
			.filter(
				(row: { year: number; month: number }) =>
					Number.isFinite(row.year) && Number.isFinite(row.month)
			)
	);

	let yearsFromKpiView = $derived(
		(data.KPIsYears ?? [])
			.map((year: unknown) => Number(year))
			.filter((year: number) => Number.isFinite(year))
	);

	let yearsFromMonthlyKpis = $derived(
		Array.from(new Set(normalizedMonthlyKPIs.map((row: { year: number }) => row.year)))
	);

	let availableYears = $derived(
		[...new Set([...yearsFromKpiView, ...yearsFromMonthlyKpis])].sort(
			(a: number, b: number) => b - a
		)
	);

	// $effect replaces the $: side-effect that auto-selected the first year
	$effect(() => {
		if (
			availableYears.length > 0 &&
			(selectedYear === null || !availableYears.includes(selectedYear))
		) {
			selectedYear = availableYears[0];
		}
	});

	let currentYearLabel = $derived(selectedYear ?? 'Year');

	let monthlyKPIsByYear = $derived(
		normalizedMonthlyKPIs
			.filter((row: { year: number }) => row.year === selectedYear)
			.sort((a: { month: number }, b: { month: number }) => a.month - b.month)
	);

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

	<section class={uiStyles.c0022}>
		<div class={uiStyles.c0023}>
			{#each kpi as kpiItem}
				<div class={kpiClasses[kpiItem.type]}>
					<h3 class={uiStyles.c0025}>{kpiItem.label}</h3>
					<p class="text-center">{kpiItem.value}</p>
				</div>
			{/each}
		</div>
	</section>

	<section>
		<div class={uiStyles.c0028}>
			<div class={uiStyles.c0029}>
				<h2 class={uiStyles.c0030}>Blank Stock</h2>
				<table class={uiStyles.c0031}>
					{#if data.blankStock.length === 0}
						<thead><tr><th>No Blank Stock</th></tr></thead>
					{:else}
						<thead><tr><th>Model No</th><th>Quantity</th></tr></thead>
						<tbody>
							{#each data.blankStock as bstk}
								<tr><td>{bstk.model_no}</td><td>{bstk.quantity}</td></tr>
							{/each}
						</tbody>
					{/if}
				</table>
				<h2 class={uiStyles.c0030}>Loadcell Stock</h2>
				<table class={uiStyles.c0031}>
					{#if data.loadcellStock.length === 0}
						<thead><tr><th>No Loadcell Stock</th></tr></thead>
					{:else}
						<thead><tr><th>Model No</th><th>Quantity</th></tr></thead>
						<tbody>
							{#each data.loadcellStock as lcstk}
								<tr><td>{lcstk.model_no}</td><td>{lcstk.quantity}</td></tr>
							{/each}
						</tbody>
					{/if}
				</table>
			</div>

			<div class={uiStyles.c0033}>
				<div>
					<h2 class={uiStyles.c0158}>
						Monthly KPIs
						<div class="relative" bind:this={yearPickerContainer}>
							<span>{currentYearLabel}</span>
							<button
								type="button"
								class={uiStyles.c0160}
								aria-haspopup="listbox"
								aria-expanded={isYearPickerOpen}
								onclick={toggleYearPicker}
							>
								<Calendar size={20} />
							</button>
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
							<thead><tr><th>No KPI data for the selected year</th></tr></thead>
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

				<div>
					<h2 class={uiStyles.c0034}>Recent Entries</h2>
					<table class={uiStyles.c0035}>
						<thead>
							<tr
								><th>Job No</th><th>Model No</th><th>Blank No</th><th>Serial No</th><th>Status</th
								><th>Last Updated</th></tr
							>
						</thead>
						<tbody>
							{#each data.recentJobs as job}
								<tr>
									<td>{job.job_no}</td><td>{job.model_no}</td><td>{job.blank_no}</td>
									<td>{job.serial_no}</td><td>{job.derived_status}</td><td>{job.updated_at}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<div class={uiStyles.c0036}>
					<div class={uiStyles.c0037}>
						<h2 class={uiStyles.c0038}>
							<TriangleAlert size={24} color="#cca000" />
							<span class="mr-2 ml-2">Duplicate Blank Numbers</span>
							<TriangleAlert size={24} color="#cca000" />
						</h2>
						<div class={uiStyles.c0039}>
							<table class={uiStyles.c0040}>
								{#if data.blankDuplicates.length === 0}
									<thead><tr><th>No duplicate Blank numbers found</th></tr></thead>
								{:else}
									<thead><tr><th>Blank No</th><th>Occurrences</th></tr></thead>
									<tbody>
										{#each data.blankDuplicates as dup}
											<tr><td>{dup.blank_no}</td><td>{dup.count}</td></tr>
										{/each}
									</tbody>
								{/if}
							</table>
						</div>
					</div>

					<div class={uiStyles.c0037}>
						<h2 class={uiStyles.c0038}>
							<TriangleAlert size={24} color="#cca000" />
							<span class="mr-2 ml-2">Duplicate Serial Numbers</span>
							<TriangleAlert size={24} color="#cca000" />
						</h2>
						<div class={uiStyles.c0039}>
							<table class={uiStyles.c0041}>
								{#if data.serialDuplicates.length === 0}
									<thead><tr><th>No duplicate Serial numbers found</th></tr></thead>
								{:else}
									<thead><tr><th>Serial No</th><th>Occurrences</th></tr></thead>
									<tbody>
										{#each data.serialDuplicates as dup}
											<tr><td>{dup.serial_no}</td><td>{dup.count}</td></tr>
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
