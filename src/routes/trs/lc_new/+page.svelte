<script lang="ts">
	import { styles as uiStyles } from '$lib/utils/styles';
	import { enhance } from '$app/forms';
	import { toast } from '$lib/utils/toast.js';
	import { LOADCELL_PROCESS_DATE_FIELDS } from '$lib/utils/loadcellDates.js';

	let saving = false;

	const dateFields = LOADCELL_PROCESS_DATE_FIELDS;
</script>

<div class={uiStyles.c0069}>
	<h1 class={uiStyles.c0021}>Loadcell Entry</h1>

	<form
		method="POST"
		use:enhance={() => {
			saving = true;
			return async ({ result, update }) => {
				saving = false;
				await update();

				if (result.type !== 'success' && result.type !== 'failure') return;
				const data = (result.data ?? {}) as {
					error?: string;
					info?: string;
					warn?: string;
					success?: boolean;
				};

				if (data.error) toast.show(data.error, 'error', 5000);
				if (data.warn) toast.show(data.warn, 'warning', 3000);
				if (data.info) toast.show(data.info, 'info', 3000);
				if (result.type === 'success' && data.success) {
					toast.show('Loadcell entry created successfully.', 'success', 5000);
				}
			};
		}}
		class={uiStyles.c0090}
	>
		<!-- CORE DETAILS -->
		<section>
			<h2 class={uiStyles.c0091}>Core Details</h2>
			<div class={uiStyles.c0092}>
				<div class={uiStyles.c0045}>
					<div class="flex items-center justify-between px-2">
						<label for="blank_no" class={uiStyles.c0046}>Blank No *</label>
					</div>
					<div class="relative">
						<input
							id="blank_no"
							name="blank_no"
							type="number"
							placeholder="Blank No * (7 digits)"
							inputmode="numeric"
							pattern="\d{7}"
							class={uiStyles.c0055}
						/>
					</div>
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

				<div class={uiStyles.c0045}>
					<label for="received_date" class={uiStyles.c0046}>Recieved Date</label>
					<input id="received_date" type="date" name="received_date" class={uiStyles.c0055} />
				</div>

				<div class={uiStyles.c0045}>
					<label for="job_date" class={uiStyles.c0046}>Job Date *</label>
					<input id="job_date" type="date" name="job_date" class={uiStyles.c0055} />
				</div>

				<div class={uiStyles.c0045}>
					<label for="job_no" class={uiStyles.c0046}>Job No</label>
					<input
						id="job_no"
						type="text"
						name="job_no"
						placeholder="Job No"
						class={uiStyles.c0055}
					/>
				</div>

				<div class={uiStyles.c0045}>
					<label for="serial_no" class={uiStyles.c0046}>Serial No</label>
					<input
						id="serial_no"
						name="serial_no"
						type="number"
						placeholder="Serial No (6 digits)"
						inputmode="numeric"
						pattern="\d{6}"
						class={uiStyles.c0055}
					/>
				</div>

				<div class={uiStyles.c0045}>
					<label for="model_no" class={uiStyles.c0046}>Model No *</label>
					<input
						id="model_no"
						type="text"
						name="model_no"
						placeholder="Model No"
						class={uiStyles.c0055}
					/>
				</div>

				<div class={uiStyles.c0045}>
					<label for="customer" class={uiStyles.c0046}>Customer</label>
					<textarea
						id="customer"
						name="customer"
						rows="1"
						placeholder="Customer"
						class={uiStyles.c0141}
					></textarea>
				</div>

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
				<textarea id="remarks" placeholder="Remarks" name="remarks" class={uiStyles.c0144}
				></textarea>
			</div>
		</section>

		<!-- ACTIONS -->
		<div class={uiStyles.c0111}>
			<a href="/trs/new" class={uiStyles.c0100}>Cancel</a>
			<button type="submit" formaction="?/create" class={uiStyles.c0062} disabled={saving}>
				{saving ? 'Saving...' : 'Create Entry'}
			</button>
		</div>
	</form>
</div>
