<script lang="ts">
	import { styles as uiStyles } from '$lib/utils/styles';
	import { toast } from '$lib/utils/toast';
	import { Plus, Trash2 } from 'lucide-svelte';
	import { isElectromech } from '$lib/utils/customerFilters';
	import { fade, slide } from 'svelte/transition';
	import { cubicInOut } from 'svelte/easing';

	type JobRow = {
		job_no: string;
		job_card_no: number | '';
		model_no: string;
		quantity: number | '';
		planned_dispatch: Date;
		actual_dispatch: Date;
		customer: string;
		remarks: string;
		dispatched_qty: number | '';
	};

	function emptyRow(): JobRow {
		return {
			job_no: '',
			job_card_no: '',
			model_no: '',
			quantity: '',
			planned_dispatch: new Date(),
			actual_dispatch: new Date(),
			customer: '',
			remarks: '',
			dispatched_qty: ''
		};
	}

	let rows: JobRow[] = [emptyRow()];
	let submitting = false;
	const today = new Date();
	const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
	let scheduledMonth = defaultMonth;
	let electromech = false;

	function addRow() {
		const row = emptyRow();
		if (electromech) row.customer = 'ELECTROMECH';
		rows = [...rows, row];
	}

	function toggleElectromech() {
		electromech = !electromech;

		if (electromech) {
			rows = rows.map((row) => ({ ...row, customer: 'ELECTROMECH' }));
		} else {
			rows = rows.map((row) => ({ ...row, customer: '' }));
		}
	}

	function removeRow(index: number) {
		if (rows.length === 1) return;
		rows = rows.filter((_, rowIndex) => rowIndex !== index);
	}

	async function submit() {
		submitting = true;

		const payload = rows.map((row) => ({
			...row,
			scheduled_month: scheduledMonth
		}));

		const res = await fetch('/trs/prod_plan', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});

		submitting = false;

		if (!res.ok) {
			const { message } = await res.json();
			toast.show(message, 'error');
			return;
		}

		const { inserted } = await res.json();
		toast.show(`Created ${inserted} entries successfully`, 'success');
		rows = [emptyRow()];
	}
</script>

<div class={uiStyles.c0042}>
	<h1 class={uiStyles.c0021}>Monthly Production Plan</h1>

	<div class={uiStyles.c0043}>
		<section>
			<div class={uiStyles.c0044}>
				<div class={uiStyles.c0045}>
					<label for="scheduled_month" class={uiStyles.c0046}> Scheduled Month * </label>
					<input
						id="scheduled_month"
						name="scheduled_month"
						class={uiStyles.c0047}
						type="month"
						bind:value={scheduledMonth}
					/>
				</div>
				<div class={uiStyles.c0048}></div>
				<div class={uiStyles.c0049}>
					<label for="electromech_toggle" class={uiStyles.c0050}>
						<span class={uiStyles.c0051}>Main</span>
						<input
							id="electromech_toggle"
							name="electromech_toggle"
							type="checkbox"
							class={uiStyles.c0052}
							checked={electromech}
							onchange={toggleElectromech}
						/>
						<div class={uiStyles.c0053}></div>
						<span class={uiStyles.c0051}>Electromech</span>
					</label>
				</div>
			</div>
		</section>

		<section>
			{#key electromech}
				<div in:slide={{ duration: 180, easing: cubicInOut }} out:slide={{ duration: 120 }}>
					<div in:fade={{ duration: 180, easing: cubicInOut }} out:fade={{ duration: 120 }}>
						{#each rows as row, index}
							{#if !electromech || isElectromech(row.customer)}
								<div class={uiStyles.c0054}>
									<div class={uiStyles.c0045}>
										<label for={`job_no-${index}`} class={uiStyles.c0046}>Job No *</label>
										<input
											id={`job_no-${index}`}
											name={`job_no-${index}`}
											class={uiStyles.c0055}
											placeholder="Job No *"
											bind:value={row.job_no}
										/>
									</div>
									<div class={uiStyles.c0045}>
										<label for={`model_no-${index}`} class={uiStyles.c0046}>Model No *</label>
										<input
											id={`model_no-${index}`}
											name={`model_no-${index}`}
											class={uiStyles.c0055}
											placeholder="Model No *"
											bind:value={row.model_no}
										/>
									</div>
									<div class={uiStyles.c0045}>
										<label for={`quantity-${index}`} class={uiStyles.c0046}>Total Quantity *</label>
										<input
											id={`quantity-${index}`}
											name={`quantity-${index}`}
											class={uiStyles.c0055}
											type="number"
											placeholder="Quantity *"
											bind:value={row.quantity}
										/>
									</div>
									<div class={uiStyles.c0045}>
										<label for={`planned_dispatch-${index}`} class={uiStyles.c0046}
											>Planned Dispatch *</label
										>
										<input
											id={`planned_dispatch-${index}`}
											name={`planned_dispatch-${index}`}
											class={uiStyles.c0055}
											type="date"
											bind:value={row.planned_dispatch}
										/>
									</div>
									<div class={uiStyles.c0045}>
										<label for={`job_card_no-${index}`} class={uiStyles.c0046}>Job Card No</label>
										<input
											id={`job_card_no-${index}`}
											name={`job_card_no-${index}`}
											class={uiStyles.c0055}
											placeholder="Job Card No"
											type="number"
											bind:value={row.job_card_no}
										/>
									</div>
									<div class={uiStyles.c0045}>
										<label for={`customer-${index}`} class={uiStyles.c0046}>Customer</label>
										<input
											id={`customer-${index}`}
											name={`customer-${index}`}
											class={uiStyles.c0055}
											placeholder="Customer"
											readonly={electromech}
											aria-readonly={electromech}
											bind:value={row.customer}
										/>
									</div>
									<div class={uiStyles.c0045}>
										<label for={`dispatched_qty-${index}`} class={uiStyles.c0046}
											>Dispatched Quantity</label
										>
										<input
											id={`dispatched_qty-${index}`}
											name={`dispatched_qty-${index}`}
											class={uiStyles.c0055}
											type="number"
											placeholder="Dispatched Quantity"
											bind:value={row.dispatched_qty}
										/>
									</div>
									<div class={uiStyles.c0045}>
										<label for={`actual_dispatch-${index}`} class={uiStyles.c0046}
											>Actual Dispatch</label
										>
										<input
											id={`actual_dispatch-${index}`}
											name={`actual_dispatch-${index}`}
											class={uiStyles.c0055}
											type="date"
											bind:value={row.actual_dispatch}
										/>
									</div>
									<div class={uiStyles.c0056}>
										<label for={`remarks-${index}`} class={uiStyles.c0046}>Remarks</label>
										<textarea
											id={`remarks-${index}`}
											name={`remarks-${index}`}
											placeholder="Remarks"
											bind:value={row.remarks}
											class={uiStyles.c0057}
										></textarea>
									</div>
									<div class={uiStyles.c0058}>
										<button
											type="button"
											onclick={() => removeRow(index)}
											disabled={rows.length === 1}
											class={uiStyles.c0059}
											aria-label="Remove row"
										>
											<Trash2 size={24} />
										</button>
									</div>
								</div>
							{/if}
						{/each}
					</div>
				</div>
			{/key}
		</section>
		<div class={uiStyles.c0060}>
			<button type="button" onclick={addRow} class={uiStyles.c0061} aria-label="Add row">
				<Plus size={24} />
			</button>
			<button type="button" onclick={submit} disabled={submitting} class={uiStyles.c0062}>
				{submitting ? 'Saving...' : 'Submit'}
			</button>
		</div>
	</div>
</div>
