<script lang="ts">
	import { toast } from '$lib/stores/toast';
	import { Plus, Trash2 } from 'lucide-svelte';

	type JobRow = {
		job_no: string;
		job_card_no: string;
		model_no: string;
		quantity: string;
		planned_dispatch: Date;
		actual_dispatch: Date;
		customer: string;
		remarks: string;
		dimension: string;
		dispatched_qty: string;
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
	const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
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

<div class="min-w-full space-y-6 text-neutral-400">
	<h1 class="mb-6 text-center text-5xl font-medium text-neutral-400">Monthly Production Plan</h1>

	<div class="bg-surface shadow-card space-y-6 rounded-md p-6">
		<div class="grid grid-cols-12 gap-4">
			<div class="col-span-3">
				<label for="scheduled_month" class="px-2 text-xl text-neutral-400">
					Scheduled Month
				</label>
				<input
					id="scheduled_month"
					class="input w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
					type="month"
					bind:value={scheduledMonth}
				/>
			</div>
		</div>

		{#each rows as row, index}
			<div class="grid grid-cols-12 items-center gap-3">
				<input
					class="input col-span-2 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
					placeholder="Job No"
					bind:value={row.job_no}
				/>
				<input
					class="input col-span-2 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
					placeholder="Job Card"
					type="number"
					bind:value={row.job_card_no}
				/>
				<input
					class="input col-span-2 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
					placeholder="Model No"
					bind:value={row.model_no}
				/>
				<input
					class="input col-span-1 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
					type="number"
					placeholder="Qty"
					bind:value={row.quantity}
				/>
				<input
					class="input col-span-2 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
					type="date"
					bind:value={row.planned_dispatch}
				/>
				<input
					class="input col-span-2 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
					type="date"
					bind:value={row.actual_dispatch}
				/>
				<input
					class="input col-span-2 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
					placeholder="Customer"
					bind:value={row.customer}
				/>
				<input
					class="input col-span-2 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
					placeholder="Remarks"
					bind:value={row.remarks}
				/>
				<input
					class="input col-span-1 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
					placeholder="Dimension"
					bind:value={row.dimension}
				/>
				<input
					class="input col-span-1 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
					type="number"
					placeholder="Dispatched"
					bind:value={row.dispatched_qty}
				/>
				<div class="col-span-1 flex justify-center">
					<button
						type="button"
						on:click={() => removeRow(index)}
						disabled={rows.length === 1}
						class="rounded-md border border-neutral-700 p-2 text-neutral-300 transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
						aria-label="Remove row"
					>
						<Trash2 size={18} />
					</button>
				</div>
			</div>
		{/each}

		<div class="flex gap-3">
			<button
				type="button"
				on:click={addRow}
				class="rounded-md border border-neutral-700 p-2 text-neutral-300 transition hover:bg-neutral-800"
				aria-label="Add row"
			>
				<Plus size={18} />
			</button>
			<button
				type="button"
				on:click={submit}
				disabled={submitting}
				class="rounded-md border border-neutral-700 bg-neutral-800 px-4 py-2 text-neutral-200 transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{submitting ? 'Saving…' : 'Submit'}
			</button>
		</div>
	</div>
</div>
