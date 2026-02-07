<script lang="ts">
	import { styles as uiStyles } from '$lib/utils/styles';
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

<div class={uiStyles.c0069}>
	<h1 class={uiStyles.c0021}>Loadcell Entry</h1>

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
		<!-- CORE DETAILS -->
		<section>
			<h2 class={uiStyles.c0091}>Core Details</h2>
			<div class={uiStyles.c0092}>
				<div class={uiStyles.c0045}>
					<label for="job_date" class={uiStyles.c0046}>Job Date *</label>
					<input type="date" name="job_date" class={uiStyles.c0055} />
				</div>

				<div class={uiStyles.c0045}>
					<label for="job_no" class={uiStyles.c0046}>Job No *</label>
					<input
						type="text"
						name="job_no"
						placeholder="Job No *"
						value={blank?.job_no ?? ''}
						class={uiStyles.c0055}
					/>
				</div>

				<div class={uiStyles.c0045}>
					<label for="model_no" class={uiStyles.c0046}>Model No *</label>
					<input
						type="text"
						name="model_no"
						placeholder="Model No *"
						value={blank?.model_no ?? ''}
						class={uiStyles.c0055}
					/>
				</div>

				<div class={uiStyles.c0045}>
					<label for="blank_no" class={uiStyles.c0046}>Blank No *</label>
					<input
						name="blank_no"
						type="number"
						placeholder="Blank No (7 digits) *"
						value={blank?.blank_no ?? ''}
						inputmode="numeric"
						pattern="\d{7}"
						class={uiStyles.c0055}
					/>
					<div class={uiStyles.c0103}>
						<input
							type="checkbox"
							id="allow_duplicate_blank"
							name="allow_duplicate_blank"
							class={uiStyles.c0139}
						/>
						<label for="allow_duplicate_blank" class={uiStyles.c0140}>
							Allow duplicate Blank No
						</label>
					</div>
				</div>
			</div>
		</section>
		<!-- ADDITIONAL DETAILS -->
		<section>
			<h2 class={uiStyles.c0091}>Additional Details</h2>
			<div class={uiStyles.c0092}>
				<div class={uiStyles.c0045}>
					<label for="job_card_no" class={uiStyles.c0046}>Job Card No</label>
					<input
						name="job_card_no"
						type="number"
						placeholder="Job Card No"
						value={blank?.job_card_no ?? ''}
						class={uiStyles.c0055}
					/>
				</div>

				<div class={uiStyles.c0045}>
					<label for="serial_no" class={uiStyles.c0046}>Serial No</label>
					<input
						name="serial_no"
						type="number"
						placeholder="Serial No (6 digits)"
						inputmode="numeric"
						pattern="\d{6}"
						class={uiStyles.c0055}
					/>
				</div>

				<div class={uiStyles.c0045}>
					<label for="customer" class={uiStyles.c0046}>Customer</label>
					<textarea name="customer" rows="1" placeholder="Customer" class={uiStyles.c0141}
					></textarea>
				</div>
			</div>
		</section>

		<!-- PROCESS DATES -->
		<section>
			<h2 class={uiStyles.c0091}>Process Dates</h2>
			<div class={uiStyles.c0094}>
				{#each dateFields as [field, label]}
					<label for={field} class={uiStyles.c0095}>{label}</label>
					<input type="date" id={field} name={field} class={uiStyles.c0142} />
				{/each}
			</div>
		</section>

		<!-- REMARKS -->
		<section>
			<h2 class={uiStyles.c0143}>Remarks</h2>
			<div class={uiStyles.c0098}>
				<textarea placeholder="Remarks" name="remarks" class={uiStyles.c0144}></textarea>
			</div>
		</section>

		<!-- FEEDBACK -->
		<!-- {#if form?.error || form?.success}
			<div class={uiStyles.c0145}>
				{#if form?.error}
					<p class={uiStyles.c0146}>
						{form.error}
					</p>
				{/if}

				{#if form?.success}
					<p class={uiStyles.c0147}>
						Loadcell entry created successfully
					</p>
				{/if}
			</div>
		{/if} -->

		<!-- ACTIONS -->
		<div class={uiStyles.c0111}>
			<a href="/trs/new" class={uiStyles.c0100}>Cancel</a>
			<button type="submit" formaction="?/create" class={uiStyles.c0062} disabled={saving}>
				{saving ? 'Saving...' : 'Create Entry'}
			</button>
		</div>
	</form>
</div>
