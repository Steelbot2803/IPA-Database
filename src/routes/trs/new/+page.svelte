<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from '$lib/utils/toast.js';

	export let form;
	export let data;
	let saving = false;

	const blank = data.blank;

	$: if (form?.error || form?.success || form?.warn) {
		if (form.error) {
			toast.show(form.error, 'error', 5000);
		} else if (form.success) {
			toast.show('Loadcell entry created successfully', 'success', 5000);
		} else if (form.warn) {
			toast.show(form.warn, 'warning', 5000);
		}
	}

	const dateFields = [
		['wiring', 'Wiring'],
		['tc0', 'TC0'],
		['cycling', 'Cycling'],
		['cabling', 'Cabling'],
		['trimming', 'Trimming'],
		['black_putty', 'Black Putty'],
		['bellow_welding', 'Bellow Welding'],
		['pocket_welding', 'Pocket Welding'],
		['sealing_side_1', 'Sealing Side 1'],
		['sealing_side_2', 'Sealing Side 2'],
		['linearity', 'Linearity'],
		['tc0_qc', 'TC0 QC'],
		['tinning', 'Tinning'],
		['ready_date', 'Ready Date'],
		['dispatch_date', 'Dispatch Date']
	];
</script>

<div class="min-w-full space-y-6">
	<h1 class="mb-6 text-center text-5xl font-medium text-neutral-200">Loadcell Entry</h1>

	<form
		method="POST"
		use:enhance={() => {
			saving = true;
			return async ({ update }) => {
				saving = false;
				await update();
			};
		}}
		class="bg-surface shadow-card space-y-8 rounded-md p-6"
	>
		<!-- CORE DETAILS -->
		<section>
			<h2 class="mb-4 text-2xl text-neutral-200">Core Details</h2>
			<div class="mb-4 grid grid-cols-8 gap-4">
				<div class="col-span-2">
					<label for="job_date" class="px-2 text-xl text-neutral-200">Job Date *</label>
					<input
						type="date"
						name="job_date"
						class="mt-2 input w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
					/>
				</div>

				<div class="col-span-2">
					<label for="job_no" class="px-2 text-xl text-neutral-200">Job No *</label>
					<input
						type="text"
						name="job_no"
						placeholder="Job No *"
						value={blank?.job_no ?? ''}
						class="mt-2 input w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
					/>
				</div>

				<div class="col-span-2">
					<label for="model_no" class="px-2 text-xl text-neutral-200">Model No *</label>
					<input
						type="text"
						name="model_no"
						placeholder="Model No *"
						value={blank?.model_no ?? ''}
						class="mt-2 input w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
					/>
				</div>

				<div class="col-span-2">
					<label for="blank_no" class="px-2 text-xl text-neutral-200">Blank No *</label>
					<input
						name="blank_no"
						type="number"
						placeholder="Blank No (7 digits) *"
						value={blank?.blank_no ?? ''}
						inputmode="numeric"
						pattern="\d{7}"
						class="mt-2 input w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
					/>
					<div class="col-span-6 mb-2 flex items-center gap-2 px-2">
						<input
							type="checkbox"
							id="allow_duplicate_blank"
							name="allow_duplicate_blank"
							class="mt-2 accent-neutral-800"
						/>
						<label for="allow_duplicate_blank" class="px-1 text-base text-neutral-200">
							Allow duplicate Blank No
						</label>
					</div>
				</div>
			</div>
		</section>
		<!-- ADDITIONAL DETAILS -->
		<section>
			<h2 class="mb-4 text-2xl text-neutral-200">Additional Details</h2>
			<div class="mb-4 grid grid-cols-8 gap-4">
				<div class="col-span-2">
					<label for="job_card_no" class="px-2 text-xl text-neutral-200">Job Card No</label>
					<input
						name="job_card_no"
						type="number"
						placeholder="Job Card No"
						value={blank?.job_card_no ?? ''}
						class="mt-2 input w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
					/>
				</div>

				<div class="col-span-2">
					<label for="serial_no" class="px-2 text-xl text-neutral-200">Serial No</label>
					<input
						name="serial_no"
						type="number"
						placeholder="Serial No (6 digits)"
						inputmode="numeric"
						pattern="\d{6}"
						class="mt-2 input w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
					/>
				</div>

				<div class="col-span-2">
					<label for="customer" class="px-2 text-xl text-neutral-200">Customer</label>
					<textarea
						name="customer"
						rows="1"
						placeholder="Customer"
						class="mt-2 input col-span-3 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
					></textarea>
				</div>
			</div>
		</section>

		<!-- PROCESS DATES -->
		<section>
			<h2 class="mb-4 text-2xl text-neutral-200">Process Dates</h2>
			<div class="grid grid-cols-8 gap-4">
				{#each dateFields as [field, label]}
					<label for={field} class="col-span-1 text-xl text-neutral-200">{label}</label>
					<input
						type="date"
						id={field}
						name={field}
						class="mt-2 input col-span-1 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
					/>
				{/each}
			</div>
		</section>

		<!-- REMARKS -->
		<section>
			<h2 class="mb-4 px-2 text-2xl text-neutral-200">Remarks</h2>
			<div class="grid grid-cols-2">
				<textarea
					name="remarks"
					class="mt-2 input col-span-2 rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
				></textarea>
			</div>
		</section>

		<!-- FEEDBACK -->
		<!-- {#if form?.error || form?.success}
			<div class="fixed top-8 right-12 z-50 flex max-w-base flex-col gap-2">
				{#if form?.error}
					<p class="rounded-md bg-red-800 px-4 py-3 shadow-lg text-danger">
						{form.error}
					</p>
				{/if}

				{#if form?.success}
					<p class="rounded-md bg-green-800 px-4 py-3 shadow-lg text-success">
						Loadcell entry created successfully
					</p>
				{/if}
			</div>
		{/if} -->

		<!-- ACTIONS -->
		<div class="flex justify-end gap-2">
			<a
				href="/trs/new"
				class="font-5xl cursor-pointer rounded-md bg-neutral-800 px-4 py-2 hover:bg-neutral-600"
				>Cancel</a
			>
			<button
				type="submit"
				formaction="?/create"
				class="font-5xl cursor-pointer rounded-md bg-neutral-800 px-4 py-2 hover:bg-neutral-600 disabled:cursor-not-allowed disabled:opacity-50"
				disabled={saving}
			>
				{saving ? 'Saving...' : 'Create Entry'}
			</button>
		</div>
	</form>
</div>
