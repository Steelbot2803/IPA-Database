<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { toast } from '$lib/stores/toast';

	let searchMode: 'blank' | 'serial' = 'blank';
	let searchValue = '';

	function handleSearchSubmit(e: SubmitEvent) {
		e.preventDefault();

		if (!searchValue) return;

		const param = searchMode === 'blank' ? `blank_no=${searchValue}` : `serial_no=${searchValue}`;

		goto(`${page.url.pathname}?${param}`);
	}

	type Job = {
		id: string;
		job_date: Date;
		job_no: string;
		job_card_no: number | null;
		model_no: string;
		blank_no: number;
		serial_no: number | null;
		customer: string | null;
		remarks: string | null;

		wiring: Date | null;
		tc0: Date | null;
		cycling: Date | null;
		cabling: Date | null;
		trimming: Date | null;
		black_putty: Date | null;
		bellow_welding: Date | null;
		pocket_welding: Date | null;
		sealing_side_1: Date | null;
		sealing_side_2: Date | null;
		linearity: Date | null;
		tc0_qc: Date | null;
		tinning: Date | null;
		ready_date: Date | null;
		dispatch_date: Date | null;
	};

	export let data;

	$: if(data.notFound){
		toast.show('Loadcell entry not found', 'error', 5000);
	} else if (data.success){
		toast.show('Loadcell entry updated successfully', 'success', 5000);
	}

	const dateFields: [keyof Job, string][] = [
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
		['dispatch_date', 'Dispatch Date']
	];
</script>

<div class="min-w-full space-y-6">
	<h1 class="mb-6 text-center text-5xl font-medium text-neutral-400">Loadcell Update</h1>

	<!-- SEARCH -->
	<form
		method="GET"
		class="bg-surface shadow-card flex gap-3 rounded-md px-6"
		onsubmit={handleSearchSubmit}
	>
		<div>
			<button
				type="button"
				class="font-5xl cursor-pointer rounded-md border-2 bg-neutral-800 px-6 py-2 text-xl hover:bg-neutral-600"
				class:bg-neutral-900={searchMode === 'blank'}
				class:text-neutral-100={searchMode === 'blank'}
				class:shadow-inner={searchMode === 'blank'}
				class:border-blue-600={searchMode === 'blank'}
				onclick={() => (searchMode = 'blank')}
				aria-pressed={searchMode === 'blank'}
			>
				Blank No
			</button>

			<button
				type="button"
				class="font-5xl ml-2 cursor-pointer rounded-md border-2 bg-neutral-800 px-6 py-2 text-xl hover:bg-neutral-600"
				class:bg-neutral-900={searchMode === 'serial'}
				class:text-neutral-100={searchMode === 'serial'}
				class:shadow-inner={searchMode === 'serial'}
				class:border-blue-600={searchMode === 'serial'}
				onclick={() => (searchMode = 'serial')}
				aria-pressed={searchMode === 'serial'}
			>
				Serial No
			</button>
		</div>
		<input
			type="number"
			class="w-1/3 rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-xl text-neutral-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
			bind:value={searchValue}
			placeholder={searchMode === 'blank' ? 'Enter Blank No' : 'Enter Serial No'}
		/>
		<button
			class="font-5xl cursor-pointer rounded-md bg-neutral-800 px-6 py-2 text-xl hover:bg-neutral-600"
		>
			Search
		</button>
	</form>

	<!-- 	{#if data.success}
		<div class="max-w-base fixed top-8 right-4 z-50 flex flex-col gap-3 text-xl">
			<p class="rounded-md bg-green-800 px-4 py-3 text-green-100 shadow-md">
				Loadcell entry updated successfully
			</p>
		</div>
	{/if}

	{#if data.notFound}
		<div class="max-w-base fixed top-8 right-12 z-50 flex flex-col gap-2">
			<p class="rounded-md bg-red-800 px-4 py-3 text-red-100 shadow-lg">
				No job found for {searchMode === 'blank' ? 'Blank No' : 'Serial No'}
				{searchValue}
			</p>
		</div>
	{/if} -->

	<!-- IF DUPLICATE BLANK NO -->
	{#if data.jobs && data.jobs.length >= 1}
		<div class="bg-surface shadow-card rounded-md p-4">
			<h2 class="mb-3 text-2xl text-neutral-400">Multiple jobs found — select one</h2>
			<div class="w-full overflow-x-auto text-center text-xl text-neutral-400">
				<table class="mb-12 w-full border-separate border-spacing-y-2">
					<thead class="text-neutral-400">
						<tr>
							<th>Job Date</th>
							<th>Job No</th>
							<th>Model No</th>
							<th>Blank No</th>
							<th>Serial No</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each data.jobs as job}
							<tr class="border-b border-neutral-800 hover:bg-neutral-900">
								<td class="py-3">{job.job_date}</td>
								<td>{job.job_no}</td>
								<td>{job.model_no}</td>
								<td>{job.blank_no}</td>
								<td>{job.serial_no ?? '—'}</td>
								<td>
									<a
										href={`/trs/update?id=${job.id}`}
										class="font-5xl rounded-md bg-neutral-800 px-4 py-2 hover:bg-neutral-600"
									>
										Edit
									</a>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}

	<!-- EDIT FORM -->
	{#if data.job}
		{@const job = data.job}

		<form method="POST" use:enhance class="bg-surface shadow-card space-y-8 rounded-md p-6">
			<input type="hidden" name="id" value={job.id} />

			<!-- CORE INFO -->
			<section>
				<h2 class="mb-4 text-2xl text-neutral-400">Core Details</h2>

				<div class="mb-4 grid grid-cols-8 gap-4">
					<div class="col-span-2">
						<label for="job_date" class="px-2 text-xl text-neutral-400">Job Date</label>
						<input
							type="date"
							name="job_date"
							bind:value={job.job_date}
							disabled
							class="input w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
						/>
					</div>

					<div class="col-span-2">
						<label for="job_no" class="px-2 text-xl text-neutral-400">Job No</label>
						<input
							type="text"
							name="job_no"
							bind:value={job.job_no}
							class="input w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
						/>
					</div>

					<div class="col-span-2">
						<label for="model_no" class="px-2 text-xl text-neutral-400">Model No</label>
						<input
							type="text"
							name="model_no"
							bind:value={job.model_no}
							class="input w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
						/>
					</div>

					<div class="col-span-2">
						<label for="blank_no" class="px-2 text-xl text-neutral-400">Blank No</label>
						<input
							name="blank_no"
							type="number"
							bind:value={job.blank_no}
							disabled
							class="input w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
						/>
					</div>
				</div>
			</section>

			<!-- ADDITIONAL DETAILS -->
			<section>
				<h2 class="mb-4 text-2xl text-neutral-400">Additional Details</h2>
				<div class="mb-4 grid grid-cols-8 gap-4">
					<div class="col-span-2">
						<label for="job_card_no" class="px-2 text-xl text-neutral-400">Job Card No</label>
						<input
							name="job_card_no"
							type="number"
							bind:value={job.job_card_no}
							placeholder={job.job_card_no ? '' : 'Job Card No'}
							class="input w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
						/>
					</div>

					<div class="col-span-2">
						<label for="serial_no" class="px-2 text-xl text-neutral-400">Serial No</label>
						<input
							name="serial_no"
							type="number"
							placeholder={job.serial_no ? '' : 'Serial No (6 digits)'}
							bind:value={job.serial_no}
							inputmode="numeric"
							pattern="\d{6}"
							class="input w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
						/>
					</div>

					<div class="col-span-2">
						<label for="customer" class="px-2 text-xl text-neutral-400">Customer</label>
						<textarea
							name="customer"
							rows="1"
							bind:value={job.customer}
							placeholder={job.customer ? '' : 'Customer'}
							class="input col-span-3 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
						></textarea>
					</div>
				</div>
			</section>

			<!-- PROCESS DATES -->
			<section>
				<h2 class="mb-4 text-2xl text-neutral-400">Process Dates</h2>
				<div class="grid grid-cols-8 gap-4">
					{#each dateFields as [field, label]}
						<label for={field} class="col-span-1 text-xl text-neutral-400">{label}</label>
						<input
							type="date"
							id={field}
							name={field}
							bind:value={job[field]}
							placeholder={job[field] ? '' : label}
							class="input col-span-1 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
						/>
					{/each}
				</div>
			</section>

			<!-- REMARKS -->
			<section>
				<h2 class="mb-4 px-2 text-xl text-neutral-400">Remarks</h2>
				<div class="grid grid-cols-2">
					<textarea
						name="remarks"
						class="input col-span-2 rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
						>{job.remarks ?? ''}</textarea
					>
				</div>
			</section>

			<!-- ACTION -->
			<div class="flex justify-end gap-3">
				<button
					class="font-5xl cursor-pointer rounded-md bg-neutral-800 px-4 py-2 hover:bg-neutral-600"
				>
					Update Job
				</button>
				<a
					href="/trs/update"
					class="font-5xl cursor-pointer rounded-md bg-neutral-800 px-4 py-2 hover:bg-neutral-600"
					>Cancel</a
				>
			</div>
		</form>
	{/if}
</div>
