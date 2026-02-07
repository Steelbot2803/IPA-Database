<script lang="ts">
	import { styles as uiStyles } from '$lib/utils/styles';
	import { enhance } from '$app/forms';
	import { toast } from '$lib/utils/toast.js';
	import { LOADCELL_PROCESS_DATE_FIELDS } from '$lib/utils/loadcellDates.js';

	export let form;
	export let data;
	let saving = false;
	let loadingBlank = false;
	let blankLookupTimer: ReturnType<typeof setTimeout> | undefined;
	let blankNoInput = data.blank?.blank_no ? String(data.blank.blank_no) : '';
	let selectedBlankID = data.blank?.id ? String(data.blank.id) : '';
	let duplicateOptions: BlankMatch[] = [];
	let jobNoInput = data.blank?.job_no ?? '';
	let modelNoInput = data.blank?.model_no ?? '';
	let jobCardNoInput = data.blank?.job_card_no ?? '';

	type BlankMatch = {
		id: number;
		blank_no: number;
		job_no: string;
		model_no: string;
		job_card_no: number | null;
	};

	$: if (form?.error || form?.success || form?.warn) {
		if (form.error) {
			toast.show(form.error, 'error', 5000);
		} else if (form.success) {
			toast.show('Loadcell entry created successfully', 'success', 5000);
		} else if (form.warn) {
			toast.show(form.warn, 'info', 3000);
		}
	}

	const dateFields = LOADCELL_PROCESS_DATE_FIELDS;

	function formatOptionLabel(entry: BlankMatch) {
		return `${entry.job_no ?? '—'} . ${entry.job_card_no ?? '—'} . ${entry.model_no ?? '—'} `;
	}

	function applySelectedBlank(matchId: string) {
		selectedBlankID = matchId;
		const found = duplicateOptions.find((entry) => String(entry.id) === matchId);

		if (!found) return;

		jobNoInput = data.blank?.job_no ?? '';
		modelNoInput = data.blank?.model_no ?? '';
		jobCardNoInput = data.blank?.job_card_no ?? '';
	}

	async function fetchBlankMatches(blankNo: string) {
		if (!/^\d{7}$/.test(blankNo)) {
			duplicateOptions = [];
			selectedBlankID = '';
			return;
		}

		loadingBlank = true;

		try {
			const res = await fetch(`/trs/new/blank_lookup?blank_no=${encodeURIComponent(blankNo)}`, {
				headers: { accept: 'application/json' }
			});

			if (!res.ok) {
				duplicateOptions = [];
				selectedBlankID = '';
				return;
			}

			const payload = await res.json();
			duplicateOptions = Array.isArray(payload?.matches) ? payload.matches : [];

			if (duplicateOptions.length > 0) {
				selectedBlankID = String(duplicateOptions[0].id);
				applySelectedBlank(selectedBlankID);
			} else {
				selectedBlankID = '';
				jobNoInput = '';
				modelNoInput = '';
				jobCardNoInput = '';
			}
		} catch {
			duplicateOptions = [];
			selectedBlankID = '';
		} finally {
			loadingBlank = false;
		}
	}

	$: {
		if (blankLookupTimer) clearTimeout(blankLookupTimer);

		const trimmedBlankNo = blankNoInput.trim();
		blankLookupTimer = setTimeout(() => {
			void fetchBlankMatches(trimmedBlankNo);
		}, 220);
	}
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
						bind:value={jobNoInput}
						class={uiStyles.c0055}
					/>
				</div>

				<div class={uiStyles.c0045}>
					<label for="model_no" class={uiStyles.c0046}>Model No *</label>
					<input
						type="text"
						name="model_no"
						placeholder="Model No *"
						bind:value={modelNoInput}
						class={uiStyles.c0055}
					/>
				</div>

				<div class={uiStyles.c0045}>
					<label for="blank_no" class={uiStyles.c0046}>Blank No *</label>
					<input
						type="number"
						placeholder="Blank No (7 digits) *"
						bind:value={blankNoInput}
						inputmode="numeric"
						pattern="\d{7}"
						class={uiStyles.c0055}
					/>
					{#if loadingBlank}
						<p class={uiStyles.c0051}>Loading related blank entries...</p>
					{/if}

					{#if duplicateOptions.length > 1}
						<div class={uiStyles.c0045}>
							<label for="blank_match" class={uiStyles.c0046}>Select matching blank entry</label>
							<select
								id="blank_match"
								bind:value={selectedBlankID}
								onchange={(event) => applySelectedBlank((event.target as HTMLSelectElement).value)}
								class={uiStyles.c0055}
							>
								{#each duplicateOptions as option}
									<option value={option.id}>{formatOptionLabel(option)}</option>
								{/each}
							</select>
						</div>
					{/if}
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
						bind:value={jobCardNoInput}
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

		<!-- ACTIONS -->
		<div class={uiStyles.c0111}>
			<a href="/trs/new" class={uiStyles.c0100}>Cancel</a>
			<button type="submit" formaction="?/create" class={uiStyles.c0062} disabled={saving}>
				{saving ? 'Saving...' : 'Create Entry'}
			</button>
		</div>
	</form>
</div>
