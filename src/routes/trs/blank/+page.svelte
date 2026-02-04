<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from '$lib/stores/toast.js';
	export let form;

	let isBatchMode = false;
	let saving = false;

	$: if (form?.error || form?.success) {
		if (form.error) {
			toast.show(form.error, 'error', 5000);
		} else if (form.success) {
			toast.show('Blank entry created successfully', 'success', 5000);
		}
	}
</script>

<div class="min-w-full space-y-6">
	<h1 class="mb-6 text-center text-5xl font-medium text-neutral-400">Blank Incoming Entry</h1>

	<!-- MODE TOGGLE -->
	<div class="mb-4 flex justify-center gap-2">
		<button
			type="button"
			class="font-5xl cursor-pointer rounded-md border-2 bg-neutral-800 px-6 py-2 text-xl hover:bg-neutral-600"
			class:bg-neutral-800={isBatchMode === false}
			class:text-neutral-100={isBatchMode === false}
			class:shadow-inner={isBatchMode === false}
			class:border-blue-600={isBatchMode === false}
			onclick={() => (isBatchMode = false)}
			aria-pressed={isBatchMode === false}
		>
			Single Entry
		</button>
		<button
			type="button"
			class="font-5xl cursor-pointer rounded-md border-2 bg-neutral-800 px-6 py-2 text-xl hover:bg-neutral-600"
			class:bg-neutral-800={isBatchMode === true}
			class:text-neutral-100={isBatchMode === true}
			class:shadow-inner={isBatchMode === true}
			class:border-blue-600={isBatchMode === true}
			onclick={() => (isBatchMode = true)}
			aria-pressed={isBatchMode === true}
		>
			Batch Entry
		</button>
	</div>

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
		<!-- Hidden field to indicate batch mode -->
		<input type="hidden" name="is_batch" value={isBatchMode ? 'true' : 'false'} />

		<!-- CORE DETAILS -->
		<section>
			<h2 class="mb-4 text-2xl text-neutral-400">Core Details</h2>
			<div class="mb-4 grid grid-cols-8 gap-4">
				<div class="col-span-2">
					<label for="received_date" class="px-2 text-xl text-neutral-400">Received Date *</label>
					<input
						type="date"
						name="received_date"
						required
						class="input w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
					/>
				</div>

				<div class="col-span-2">
					<label for="job_no" class="px-2 text-xl text-neutral-400">Job No *</label>
					<input
						type="text"
						name="job_no"
						placeholder="Job No *"
						required
						class="input w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
					/>
				</div>

				<div class="col-span-2">
					<label for="model_no" class="px-2 text-xl text-neutral-400">Model No *</label>
					<input
						type="text"
						name="model_no"
						placeholder="Model No *"
						required
						class="input w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
					/>
				</div>

				<!-- SINGLE ENTRY MODE -->
				{#if !isBatchMode}
					<div class="col-span-2">
						<label for="blank_no" class="px-2 text-xl text-neutral-400">Blank No *</label>
						<input
							name="blank_no"
							type="number"
							placeholder="Blank No (7 digits) *"
							inputmode="numeric"
							pattern="\d{7}"
							required
							class="input w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
						/>
						<div class="col-span-6 mb-2 flex items-center gap-2 px-2">
							<input
								type="checkbox"
								id="allow_duplicate_blank"
								name="allow_duplicate_blank"
								class="accent-blue-600"
							/>
							<label for="allow_duplicate_blank" class="px-2 text-base text-neutral-400">
								Allow duplicate Blank No
							</label>
						</div>
					</div>
				{/if}

				<!-- BATCH ENTRY MODE -->
				{#if isBatchMode}
					<div class="col-span-2">
						<div class="px-2 text-xl text-neutral-400">Blank No Range *</div>
						<div class="grid grid-cols-2 gap-2">
							<input
								name="blank_no_start"
								type="number"
								placeholder="Start"
								inputmode="numeric"
								pattern="\d{7}"
								required
								class="input w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
							/>
							<input
								name="blank_no_end"
								type="number"
								placeholder="End"
								inputmode="numeric"
								pattern="\d{7}"
								required
								class="input w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
							/>
						</div>
						<div class="col-span-6 mb-2 flex items-center gap-2 px-2">
							<input
								type="checkbox"
								id="allow_duplicate_blank_batch"
								name="allow_duplicate_blank"
								class="accent-blue-600"
							/>
							<label for="allow_duplicate_blank_batch" class="px-2 text-base text-neutral-400">
								Allow duplicate Blank No
							</label>
						</div>
					</div>
				{/if}
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
						placeholder="Job Card No"
						class="input w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
					/>
				</div>
				<div class="col-span-2 grid grid-cols-2">
					<label for="remarks" class="px-2 text-xl text-neutral-400">Remarks</label>
					<textarea
						name="remarks"
						class="input col-span-12 rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
					></textarea>
				</div>
			</div>
		</section>

		<!-- FEEDBACK -->
		<!-- <div class="max-w-base fixed top-8 right-12 z-50 flex flex-col gap-2">
			{#if form?.error || form?.success}
				{#if form?.error}
					<p class="text-danger rounded-md bg-red-800 px-4 py-3 shadow-lg">
						{form.error}
					</p>
				{/if}

				{#if form?.success}
					<p class="text-success rounded-md bg-green-800 px-4 py-3 shadow-lg">
						{#if form.count && form.count > 1}
							{form.count} blank entries created successfully
						{:else}
							Blank entry created successfully
						{/if}
					</p>
				{/if}
			{/if}
		</div> -->

		<!-- ACTIONS -->
		<div class="flex justify-end gap-2">
			<a
				href="/"
				class="font-5xl cursor-pointer rounded-md bg-neutral-800 px-4 py-2 hover:bg-neutral-600"
				>Cancel</a
			>
			<button
				type="submit"
				formaction="?/create"
				class="font-5xl diabled:opacity-50 cursor-pointer rounded-md bg-neutral-800 px-4 py-2 hover:bg-neutral-600 disabled:cursor-not-allowed"
				disabled={saving}
			>
				{saving ? 'Saving...' : isBatchMode ? 'Create Batch Entries' : 'Create Entry'}
			</button>
		</div>
	</form>
</div>
