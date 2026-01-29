<script lang="ts">
	import { enhance } from '$app/forms';
	export let form;
</script>

<div class="min-w-full space-y-6">
	<h1 class="mb-6 text-5xl font-medium text-neutral-400 text-center">Blank Incoming Entry</h1>

	<form method="POST" use:enhance class="bg-surface shadow-card space-y-8 rounded-md p-6">
		<!-- CORE DETAILS -->
		<section>
			<h2 class="mb-4 text-2xl text-neutral-400">Core Details</h2>
			<div class="mb-4 grid grid-cols-8 gap-4">
				<div class="col-span-2">
					<label for="received_date" class="text-xl text-neutral-400 px-2">Received Date *</label>
					<input
						type="date"
						name="received_date"
						required
						class="input focus:ring-primary focus:border-primary w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-400 focus:ring-2 focus:outline-none"
					/>
				</div>

				<div class="col-span-2">
					<label for="job_no" class="text-xl text-neutral-400 px-2">Job No *</label>
					<input
						type="text"
						name="job_no"
						placeholder="Job No *"
						required
						class="input focus:ring-primary focus:border-primary w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-400 focus:ring-2 focus:outline-none"
					/>
				</div>

				<div class="col-span-2">
					<label for="model_no" class="text-xl text-neutral-400 px-2">Model No *</label>
					<input
						type="text"
						name="model_no"
						placeholder="Model No *"
						required
						class="input focus:ring-primary focus:border-primary w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-400 focus:ring-2 focus:outline-none"
					/>
				</div>

				<div class="col-span-2">
					<label for="blank_no" class="text-xl text-neutral-400 px-2">Blank No *</label>
					<input
						name="blank_no"
						type="number"
						placeholder="Blank No (7 digits) *"
						inputmode="numeric"
						pattern="\d{7}"
						required
						class="input focus:ring-primary focus:border-primary w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-400 focus:ring-2 focus:outline-none"
					/>
					<div class="col-span-6 mb-2 flex items-center gap-2">
						<input
							type="checkbox"
							id="allow_duplicate_blank"
							name="allow_duplicate_blank"
							class="accent-primary"
						/>
						<label for="allow_duplicate_blank" class="text-base text-neutral-400">
							Allow duplicate Blank No
						</label>
					</div>
				</div>
			</div>
		</section>
		<!-- ADDITIONAL DETAILS -->
		<section>
			<h2 class="mb-4 text-2xl text-neutral-400">Additional Details</h2>
			<div class="mb-4 grid grid-cols-8 gap-4">
				<div class="col-span-2">
					<label for="job_card_no" class="text-xl text-neutral-400 px-2">Job Card No</label>
					<input
						name="job_card_no"
						type="number"
						placeholder="Job Card No"
						class="input focus:ring-primary focus:border-primary w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-400 focus:ring-2 focus:outline-none"
					/>
				</div>
                <div class="grid grid-cols-2 col-span-2">
                <label for="remarks" class="text-xl text-neutral-400 px-2">Remarks</label>
				<textarea
					name="remarks"
					class="input focus:ring-primary focus:border-primary col-span-12 rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-400 focus:ring-2 focus:outline-none"
				></textarea>
			</div>
            </div>
            
		</section>

		<!-- FEEDBACK -->
		{#if form?.error || form?.success}
			<div class="fixed top-8 right-12 z-50 flex max-w-base flex-col gap-2">
				{#if form?.error}
					<p class="rounded-md bg-red-800 px-4 py-3 shadow-lg text-danger">
						{form.error}
					</p>
				{/if}

				{#if form?.success}
					<p class="rounded-md bg-green-800 px-4 py-3 shadow-lg text-success">
						Blank entry created successfully
					</p>
				{/if}
			</div>
		{/if}

		<!-- ACTIONS -->
		<div class="flex justify-end gap-2">
			<a href="/" class="font-5xl rounded-md bg-neutral-800 px-4 py-2 hover:bg-neutral-600 cursor-pointer"
				>Cancel</a
			>
			<button
				type="submit"
				formaction="?/create"
				class="font-5xl rounded-md bg-neutral-800 px-4 py-2 hover:bg-neutral-600 cursor-pointer"
			>
				Create Entry
			</button>
		</div>
	</form>
</div>