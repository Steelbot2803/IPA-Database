<script lang="ts">
	import { toast } from '$lib/stores/toast';
	import { Plus, Trash2 } from 'lucide-svelte';

	type JobRow = {
		job_no: string;
		job_card_no: number | '';
		model_no: string;
		quantity: number | '';
		planned_dispatch: Date;
		actual_dispatch: Date;
		customer: string;
		remarks: string;
		dimension: string;
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
			dimension: '',
			dispatched_qty: ''
		};
	}

	let rows: JobRow[] = [emptyRow()];
	let submitting = false;
	const today = new Date();
	const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 2).padStart(2, '0')}`;
	let scheduledMonth = defaultMonth;

	function addRow() {
		rows = [...rows, emptyRow()];
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
		toast.show(`Inserted ${inserted} jobs successfully`, 'success');
		rows = [emptyRow()];
	}
</script>

<div class="min-w-full space-y-6 text-neutral-200">
	<h1 class="mb-6 text-center text-5xl font-medium text-neutral-200">Monthly Production Plan</h1>

	<div class="bg-surface shadow-card space-y-6 rounded-md p-6">
		<section>
			<div class="mb-4 grid grid-cols-8 gap-4">
				<div class="col-span-2">
					<label for="scheduled_month" class="px-2 text-xl text-neutral-200">
						Scheduled Month *
					</label>
					<input
						id="scheduled_month"
						class="input w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
						type="month"
						bind:value={scheduledMonth}
					/>
				</div>
			</div>
		</section>

		<section>
			{#each rows as row, index}
				<div class="mb-4 grid grid-cols-8 gap-4 border-b-2 border-neutral-400 py-3">
					<div class="col-span-2">
						<label for="job_no" class="px-2 text-xl text-neutral-200">Job No *</label>
						<input
							class="input w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
							placeholder="Job No *"
							bind:value={row.job_no}
						/>
					</div>
					<div class="col-span-2">
						<label for="model_no" class="px-2 text-xl text-neutral-200">Model No *</label>
						<input
							class="input w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
							placeholder="Model No *"
							bind:value={row.model_no}
						/>
					</div>
					<div class="col-span-2">
						<label for="quantity" class="px-2 text-xl text-neutral-200">Total Quantity *</label>
						<input
							class="input w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
							type="number"
							placeholder="Quantity *"
							bind:value={row.quantity}
						/>
					</div>
					<div class="col-span-2">
						<label for="planned_dispatch" class="px-2 text-xl text-neutral-200"
							>Planned Dispatch *</label
						>
						<input
							class="input w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
							type="date"
							bind:value={row.planned_dispatch}
						/>
					</div>
					<div class="col-span-2">
						<label for="job_card_no" class="px-2 text-xl text-neutral-200">Job Card No</label>
						<input
							class="input w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
							placeholder="Job Card No"
							type="number"
							bind:value={row.job_card_no}
						/>
					</div>
					<div class="col-span-2">
						<label for="customer" class="px-2 text-xl text-neutral-200">Customer</label>
						<input
							class="input w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
							placeholder="Customer"
							bind:value={row.customer}
						/>
					</div>
					<div class="col-span-2">
						<label for="job_no" class="px-2 text-xl text-neutral-200">Dispatched Quantity</label>
						<input
							class="input w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
							type="number"
							placeholder="Dispatched Quantity"
							bind:value={row.dispatched_qty}
						/>
					</div>
					<div class="col-span-2">
						<label for="actual_dispatch" class="px-2 text-xl text-neutral-200"
							>Actual Dispatch</label
						>
						<input
							class="input w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
							type="date"
							bind:value={row.actual_dispatch}
						/>
					</div>
					<div class="col-span-7">
						<label for="job_no" class="px-2 text-xl text-neutral-200">Remarks</label>
						<textarea
							name="Remarks"
							bind:value={row.remarks}
							class="input w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-2 text-neutral-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
							>Remarks</textarea
						>
					</div>
					<div class="relative justify-self-end">
						<button
							type="button"
							onclick={() => removeRow(index)}
							disabled={rows.length === 1}
							class="absolute right-2 bottom-2 font-5xl rounded-md bg-neutral-800 px-2 py-2 hover:bg-neutral-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
							aria-label="Remove row"
						>
							<Trash2 size={24} />
						</button>
					</div>
				</div>
			{/each}
		</section>
		<div class="flex gap-3 justify-end">
			<button
				type="button"
				onclick={addRow}
				class="font-5xl rounded-md bg-neutral-800 px-2 py-2 hover:bg-neutral-600 cursor-pointer"
				aria-label="Add row"
			>
				<Plus size={24} />
			</button>
			<button
				type="button"
				onclick={submit}
				disabled={submitting}
				class="font-5xl rounded-md bg-neutral-800 px-4 py-2 hover:bg-neutral-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
			>
				{submitting ? 'Saving...' : 'Submit'}
			</button>
		</div>
	</div>
</div>
