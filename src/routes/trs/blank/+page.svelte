<script lang="ts">
	import { styles as uiStyles } from '$lib/utils/styles';
	import { enhance } from '$app/forms';
	import { toast } from '$lib/utils/toast.js';
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

<div class={uiStyles.c0069}>
	<h1 class={uiStyles.c0021}>Blank Incoming Entry</h1>

	<!-- MODE TOGGLE -->
	<div class={uiStyles.c0101}>
		<button
			type="button"
			class={uiStyles.c0102}
			class:bg-neutral-800={isBatchMode === false}
			class:text-neutral-100={isBatchMode === false}
			class:shadow-inner={isBatchMode === false}
			class:border-cyan-500={isBatchMode === false}
			onclick={() => (isBatchMode = false)}
			aria-pressed={isBatchMode === false}
		>
			Single Entry
		</button>
		<button
			type="button"
			class={uiStyles.c0102}
			class:bg-neutral-800={isBatchMode === true}
			class:text-neutral-100={isBatchMode === true}
			class:shadow-inner={isBatchMode === true}
			class:border-cyan-500={isBatchMode === true}
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
		class={uiStyles.c0090}
	>
		<!-- Hidden field to indicate batch mode -->
		<input id="is_batch" type="hidden" name="is_batch" value={isBatchMode ? 'true' : 'false'} />

		<!-- CORE DETAILS -->
		<section>
			<h2 class={uiStyles.c0091}>Core Details</h2>
			<div class={uiStyles.c0092}>
				<div class={uiStyles.c0045}>
					<label for="received_date" class={uiStyles.c0046}>Received Date *</label>
					<input
						id="received_date"
						type="date"
						name="received_date"
						required
						class={uiStyles.c0055}
					/>
				</div>

				<div class={uiStyles.c0045}>
					<label for="job_no" class={uiStyles.c0046}>Job No *</label>
					<input
						id="job_no"
						type="text"
						name="job_no"
						placeholder="Job No *"
						required
						class={uiStyles.c0055}
					/>
				</div>

				<div class={uiStyles.c0045}>
					<label for="model_no" class={uiStyles.c0046}>Model No *</label>
					<input
						id="model_no"
						type="text"
						name="model_no"
						placeholder="Model No *"
						required
						class={uiStyles.c0055}
					/>
				</div>

				<!-- SINGLE ENTRY MODE -->
				{#if !isBatchMode}
					<div class={uiStyles.c0045}>
						<label for="blank_no" class={uiStyles.c0046}>Blank No *</label>
						<input
							id="blank_no"
							name="blank_no"
							type="number"
							placeholder="Blank No (7 digits) *"
							inputmode="numeric"
							pattern="\d{7}"
							required
							class={uiStyles.c0055}
						/>
						<div class={uiStyles.c0103}>
							<input
								type="checkbox"
								id="allow_duplicate_blank"
								name="allow_duplicate_blank"
								class={uiStyles.c0104}
							/>
							<label for="allow_duplicate_blank" class={uiStyles.c0105}>
								Allow duplicate Blank No
							</label>
						</div>
					</div>
				{/if}

				<!-- BATCH ENTRY MODE -->
				{#if isBatchMode}
					<div class={uiStyles.c0045}>
						<div class={uiStyles.c0046}>Blank No Range *</div>
						<div class={uiStyles.c0106}>
							<input
								id="blank_no_start"
								name="blank_no_start"
								type="number"
								placeholder="Start"
								inputmode="numeric"
								pattern="\d{7}"
								required
								class={uiStyles.c0055}
							/>
							<input
								id="blank_no_end"
								name="blank_no_end"
								type="number"
								placeholder="End"
								inputmode="numeric"
								pattern="\d{7}"
								required
								class={uiStyles.c0055}
							/>
						</div>
						<div class={uiStyles.c0103}>
							<input
								type="checkbox"
								id="allow_duplicate_blank_batch"
								name="allow_duplicate_blank"
								class={uiStyles.c0104}
							/>
							<label for="allow_duplicate_blank_batch" class={uiStyles.c0105}>
								Allow duplicate Blank No
							</label>
						</div>
					</div>
				{/if}
			</div>
		</section>

		<!-- ADDITIONAL DETAILS -->
		<section>
			<h2 class={uiStyles.c0091}>Additional Details</h2>
			<div class={uiStyles.c0092}>
				<div class={uiStyles.c0045}>
					<label for="job_card_no" class={uiStyles.c0046}>Job Card No</label>
					<input
						id="job_card_no"
						name="job_card_no"
						type="number"
						placeholder="Job Card No"
						class={uiStyles.c0055}
					/>
				</div>
				<div class={uiStyles.c0107}>
					<label for="remarks" class={uiStyles.c0046}>Remarks</label>
					<textarea id="remarks" placeholder="Remarks" name="remarks" class={uiStyles.c0108}
					></textarea>
				</div>
			</div>
		</section>

		<!-- ACTIONS -->
		<div class={uiStyles.c0111}>
			<a href="/" class={uiStyles.c0100}>Cancel</a>
			<button type="submit" formaction="?/create" class={uiStyles.c0112} disabled={saving}>
				{saving ? 'Saving...' : isBatchMode ? 'Create Batch Entries' : 'Create Entry'}
			</button>
		</div>
	</form>
</div>
