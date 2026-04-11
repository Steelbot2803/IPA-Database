<script lang="ts">
	import { enhance } from '$app/forms';
	import { styles as uiStyles } from '$lib/utils/styles';
	import { toast } from '$lib/utils/toast.js';
	import { Download, Loader, Upload } from 'lucide-svelte';
	import type { ClassifiedRow } from './+page.server';

	// ---------- STATE ----------

	let parsing = false; // true while ?/preview is in flight
	let importing = false; // true while ?/import is in flight

	// Holds the classified rows returned by ?/preview
	let classifiedRows: ClassifiedRow[] = [];

	// JSON string re-submitted to ?/import as a hidden field
	let classifiedPayload = '';

	// Reference to the hidden submit button inside the preview form —
	// we programmatically click it when the file input changes
	let previewSubmitBtn: HTMLButtonElement;

	// Duplicate resolution modal
	let duplicateModalOpen = false;
	let duplicateSelections: Record<string, string[]> = {};

	// ---------- DERIVED ----------

	const PREVIEW_LIMIT = 20;

	$: hasPreview = classifiedRows.length > 0;
	$: insertCount = classifiedRows.filter((r) => r.action === 'insert').length;
	$: updateCount = classifiedRows.filter((r) => r.action === 'update').length;
	$: skipCount = classifiedRows.filter((r) => r.action === 'skip').length;
	$: previewSlice = classifiedRows.slice(0, PREVIEW_LIMIT);

	$: pendingGroups = classifiedRows.filter(
		(r): r is Extract<ClassifiedRow, { action: 'pending' }> => r.action === 'pending'
	);
	$: hasPending = pendingGroups.length > 0;
	$: canConfirmDuplicates =
		pendingGroups.length > 0 &&
		pendingGroups.every((g) => (duplicateSelections[g.key] ?? []).length > 0);

	// ---------- FILE INPUT HANDLER ----------

	function onFileChange(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		if (!input.files?.length) return;

		// Reset any previous preview before submitting the new file
		classifiedRows = [];
		classifiedPayload = '';
		duplicateModalOpen = false;
		duplicateSelections = {};

		// Trigger the hidden submit button — this fires the enhance handler
		previewSubmitBtn.click();
	}

	// ---------- DUPLICATE MODAL ----------

	function openDuplicateModal() {
		duplicateSelections = Object.fromEntries(pendingGroups.map((g) => [g.key, []]));
		duplicateModalOpen = true;
	}

	function closeDuplicateModal() {
		duplicateSelections = {};
		duplicateModalOpen = false;
	}

	function toggleDuplicateSelection(groupKey: string, candidateId: string, checked: boolean) {
		const existing = duplicateSelections[groupKey] ?? [];
		duplicateSelections = {
			...duplicateSelections,
			[groupKey]: checked
				? Array.from(new Set([...existing, candidateId]))
				: existing.filter((id) => id !== candidateId)
		};
	}

	function applyDuplicateSelections() {
		const resolved: ClassifiedRow[] = [];

		for (const item of classifiedRows) {
			if (item.action !== 'pending') {
				resolved.push(item);
				continue;
			}

			const selectedIds = duplicateSelections[item.key] ?? [];

			if (selectedIds.length === 0) {
				resolved.push({
					action: 'skip',
					reason: 'Duplicate — no rows selected',
					blank_no: null,
					serial_no: null
				});
			} else {
				for (const id of selectedIds) {
					resolved.push({ action: 'update', id, payload: item.payload });
				}
			}
		}

		classifiedRows = resolved;
		classifiedPayload = JSON.stringify(resolved);
		duplicateModalOpen = false;
		duplicateSelections = {};
	}

	// ---------- RESET ----------

	function cancelImport() {
		classifiedRows = [];
		classifiedPayload = '';
		duplicateModalOpen = false;
		duplicateSelections = {};
	}
</script>

<div class={uiStyles.c0113}>
	<h1 class={uiStyles.c0021}>Loadcell Bulk Import</h1>

	<div class="space-y-8">
		<!-- ===================== TEMPLATE DOWNLOAD ===================== -->
		<section class="space-y-3">
			<h2 class={uiStyles.c0091}>Step 1 — Download Template</h2>
			<p class="text-sm text-neutral-400">
				Download the CSV template to see the required column format and an example row. Fill it in,
				then select it below.
			</p>
			<a href="/trs/lc_import/template" download>
				<button type="button" class={uiStyles.c0065}>
					<Download size={18} class="mr-2 inline" />
					Download Template CSV
				</button>
			</a>
		</section>

		<!-- ===================== FILE INPUT ===================== -->
		<section class="space-y-3">
			<h2 class={uiStyles.c0091}>Step 2 — Select CSV</h2>
			<p class="text-sm text-neutral-400">
				Select your filled CSV file. A preview will appear automatically below.
			</p>

			<!--
				This form only handles ?/preview.
				The submit button is visually hidden — it gets clicked programmatically
				by onFileChange() the moment the user picks a file, so there's no
				manual "Preview" button for the user to click.
			-->
			<form
				method="POST"
				action="?/preview"
				enctype="multipart/form-data"
				use:enhance={() => {
					parsing = true;
					return async ({ result, update }) => {
						// reset: false stops SvelteKit clearing the file input
						await update({ reset: false });
						parsing = false;

						if (result.type === 'failure') {
							const data = (result.data ?? {}) as { error?: string };
							if (data.error) toast.show(data.error, 'error', 8000);
							return;
						}

						if (result.type === 'success') {
							const data = (result.data ?? {}) as { preview?: string };
							if (data.preview) {
								classifiedRows = JSON.parse(data.preview) as ClassifiedRow[];
								classifiedPayload = data.preview;
							}
						}
					};
				}}
			>
				<div class="flex items-center gap-4">
					<input
						id="csv_file"
						name="csv_file"
						type="file"
						accept=".csv"
						required
						class={uiStyles.c0055}
						onchange={onFileChange}
					/>

					{#if parsing}
						<Loader size={20} class="animate-spin text-cyan-500" />
					{/if}
				</div>

				<!-- Visually hidden, tab-skipped — only clicked by onFileChange() -->
				<button bind:this={previewSubmitBtn} type="submit" class="sr-only" tabindex="-1">
					Submit
				</button>
			</form>
		</section>

		<!-- ===================== PREVIEW TABLE ===================== -->
		{#if hasPreview || parsing}
			<section class="space-y-4">
				<div class="flex flex-wrap items-center justify-between gap-2">
					<h2 class={uiStyles.c0091}>Preview</h2>
					{#if hasPreview}
						<span class="text-sm text-neutral-400">
							{insertCount} to insert · {updateCount} to update · {skipCount} skipped
							{#if pendingGroups.length > 0}
								· <span class="font-semibold text-orange-400">
									{pendingGroups.length} duplicate{pendingGroups.length === 1 ? '' : 's'} need resolution
								</span>
							{/if}
							{#if classifiedRows.length > PREVIEW_LIMIT}
								· showing first {PREVIEW_LIMIT} of {classifiedRows.length}
							{/if}
						</span>
					{/if}
				</div>

				{#if parsing}
					<div class="flex items-center gap-3 text-sm text-neutral-400">
						<Loader size={16} class="animate-spin" />
						<span>Reading file…</span>
					</div>
				{:else}
					<!-- Table -->
					<div class="overflow-x-auto rounded-md border border-neutral-700">
						<table class="w-full text-sm text-neutral-200">
							<thead
								class="border-b border-neutral-700 bg-neutral-800 text-left text-xs tracking-wide text-neutral-400 uppercase"
							>
								<tr>
									<th class="px-3 py-2">Action</th>
									<th class="px-3 py-2">Blank No</th>
									<th class="px-3 py-2">Serial No</th>
									<th class="px-3 py-2">Details</th>
								</tr>
							</thead>
							<tbody>
								{#each previewSlice as item}
									<tr class="border-b border-neutral-800">
										<td class="px-3 py-2">
											{#if item.action === 'insert'}
												<span
													class="rounded bg-green-900 px-2 py-0.5 text-xs font-semibold text-green-300"
													>INSERT</span
												>
											{:else if item.action === 'update'}
												<span
													class="rounded bg-cyan-900 px-2 py-0.5 text-xs font-semibold text-cyan-300"
													>UPDATE</span
												>
											{:else if item.action === 'pending'}
												<span
													class="rounded bg-orange-900 px-2 py-0.5 text-xs font-semibold text-orange-300"
													>DUPLICATE</span
												>
											{:else}
												<span
													class="rounded bg-neutral-700 px-2 py-0.5 text-xs font-semibold text-neutral-400"
													>SKIP</span
												>
											{/if}
										</td>

										<td class="px-3 py-2 font-mono">
											{#if item.action === 'insert'}
												{item.row.blank_no ?? '—'}
											{:else if item.action === 'update'}
												—
											{:else if item.action === 'pending'}
												{item.candidates[0]?.blank_no ?? '—'}
											{:else}
												{item.blank_no ?? '—'}
											{/if}
										</td>

										<td class="px-3 py-2 font-mono">
											{#if item.action === 'insert'}
												{item.row.serial_no ?? '—'}
											{:else if item.action === 'update'}
												—
											{:else if item.action === 'pending'}
												{item.candidates[0]?.serial_no ?? '—'}
											{:else}
												{item.serial_no ?? '—'}
											{/if}
										</td>

										<td class="px-3 py-2 text-xs text-neutral-400">
											{#if item.action === 'insert'}
												{item.row.model_no ?? ''} · {item.row.job_date ?? ''}
											{:else if item.action === 'update'}
												Fields to fill: {Object.keys(item.payload).join(', ')}
											{:else if item.action === 'pending'}
												{item.candidates.length} matching rows — resolve duplicates below
											{:else}
												{item.reason}
											{/if}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>

					<!-- ===================== ACTION BUTTONS ===================== -->
					<form
						method="POST"
						action="?/import"
						use:enhance={() => {
							importing = true;
							return async ({ result, update }) => {
								await update({ reset: false });
								importing = false;

								if (result.type === 'failure') {
									const data = (result.data ?? {}) as { error?: string };
									if (data.error) toast.show(data.error, 'error', 8000);
									return;
								}

								if (result.type === 'success') {
									const data = (result.data ?? {}) as { success?: boolean; message?: string };
									if (data.success && data.message) {
										toast.show(data.message, 'success', 6000);
										cancelImport();
									}
								}
							};
						}}
						class="flex flex-wrap gap-3"
					>
						<input type="hidden" name="classified_rows" value={classifiedPayload} />

						<button type="button" onclick={cancelImport} class={uiStyles.c0100}>Cancel</button>

						{#if hasPending}
							<button type="button" onclick={openDuplicateModal} class={uiStyles.c0062}>
								Resolve {pendingGroups.length} Duplicate{pendingGroups.length === 1 ? '' : 's'}
							</button>
						{:else}
							<button type="submit" disabled={importing} class={uiStyles.c0062}>
								<Upload size={16} class="mr-1 inline" />
								{importing
									? 'Importing…'
									: `Confirm Import (${insertCount + updateCount} change${insertCount + updateCount === 1 ? '' : 's'})`}
							</button>
						{/if}
					</form>
				{/if}
			</section>
		{/if}
	</div>
</div>

<!-- ===================== DUPLICATE RESOLUTION MODAL ===================== -->
{#if duplicateModalOpen}
	<div class={uiStyles.c0130}>
		<div
			class="max-h-[85vh] w-full max-w-5xl overflow-auto rounded-md border-2 border-cyan-500 bg-neutral-900 p-4"
		>
			<h2 class="mb-3 text-center text-2xl font-medium text-neutral-200">
				Select duplicate rows to update
			</h2>
			<p class="mb-4 text-center text-sm text-neutral-400">
				Each group below matched multiple existing entries. Tick the ones you want updated. You can
				select more than one.
			</p>

			{#each pendingGroups as group}
				<div class="mb-4 rounded-md border-2 border-neutral-600 p-3">
					<h3 class="mb-2 text-center text-xl font-medium text-neutral-200">{group.label}</h3>

					{#if Object.keys(group.payload).length > 0}
						<p class="mb-3 text-center text-xs text-neutral-400">
							Fields that will be filled: {Object.keys(group.payload).join(', ')}
						</p>
					{/if}

					<div class="space-y-2">
						{#each group.candidates as candidate}
							<label
								class="flex cursor-pointer items-center gap-3 rounded-md border border-neutral-700 px-3 py-3 hover:bg-neutral-800"
							>
								<input
									type="checkbox"
									checked={(duplicateSelections[group.key] ?? []).includes(candidate.id)}
									onchange={(e) =>
										toggleDuplicateSelection(
											group.key,
											candidate.id,
											(e.currentTarget as HTMLInputElement).checked
										)}
								/>
								<span class="text-sm text-neutral-200">
									Status: {candidate.derived_status ?? '—'} · Job Date: {candidate.job_date ?? '—'} ·
									Job No: {candidate.job_no ?? '—'} · Model No: {candidate.model_no ?? '—'} · Blank No:
									{candidate.blank_no ?? '—'} · Serial No: {candidate.serial_no ?? '—'}
								</span>
							</label>
						{/each}
					</div>
				</div>
			{/each}

			<div class="mt-4 flex justify-end gap-3">
				<button type="button" class={uiStyles.c0100} onclick={closeDuplicateModal}>Close</button>
				<button
					type="button"
					class={uiStyles.c0062}
					disabled={!canConfirmDuplicates}
					onclick={applyDuplicateSelections}
				>
					Apply Selections
				</button>
			</div>
		</div>
	</div>
{/if}
