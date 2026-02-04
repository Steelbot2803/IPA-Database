<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from '$lib/stores/toast';

	type JobRow = {
		id: number;
		job_no: string;
		job_card_no: number | '';
		model_no: string;
		quantity: number | '';
		planned_dispatch: string;
		scheduled_month: string;
		actual_dispatch: string;
		customer: string;
		remarks: string;
		dimension: string;
		dispatched_qty: number | '';
		pending_qty: number | '';
	};

	let rows: JobRow[] = [];
	let loading = false;
	let saving = false;
	const today = new Date();
	const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
	let scheduledMonth = defaultMonth;

	async function loadRows() {
		loading = true;
		const res = await fetch(`/trs/prod_plan_update?scheduled_month=${scheduledMonth}`);
		loading = false;

		if (!res.ok) {
			const { message } = await res.json();
			toast.show(message, 'error');
			return;
		}

		const { rows: fetchedRows } = await res.json();
		rows = fetchedRows ?? [];
	}

	async function saveUpdates() {
		saving = true;

		const payload = rows.map(
			({
				id,
				job_card_no,
				model_no,
				quantity,
				actual_dispatch,
				customer,
				remarks,
				dimension,
				dispatched_qty
			}) => ({
				id,
				job_card_no,
				model_no,
				quantity,
				actual_dispatch,
				customer,
				remarks,
				dimension,
				dispatched_qty
			})
		);

		const res = await fetch('/trs/prod_plan_update', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});

		saving = false;

		if (!res.ok) {
			const { message } = await res.json();
			toast.show(message, 'error');
			return;
		}

		const { updated } = await res.json();
		toast.show(`Updated ${updated} jobs successfully`, 'success');
		await loadRows();
	}

	onMount(loadRows);
</script>

<div class="min-w-full space-y-6 text-neutral-400">
	<h1 class="mb-6 text-center text-5xl font-medium text-neutral-400">
		Update Monthly Production Plan
	</h1>

	<div class="bg-surface shadow-card space-y-6 rounded-md p-6">
		<div class="grid grid-cols-12 items-end gap-4">
			<div class="col-span-3">
				<label for="scheduled_month" class="px-2 text-xl text-neutral-400"> Scheduled Month </label>
				<input
					id="scheduled_month"
					class="input w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
					type="month"
					bind:value={scheduledMonth}
				/>
			</div>
			<div class="col-span-2">
				<button
					type="button"
					onclick={loadRows}
					disabled={loading}
					class="rounded-md border border-neutral-700 bg-neutral-800 px-4 py-2 text-neutral-200 transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{loading ? 'Loading…' : 'Load'}
				</button>
			</div>
		</div>

		{#if rows.length === 0 && !loading}
			<p class="text-neutral-400">No production plan created for this month.</p>
		{/if}

		{#each rows as row, index}
			<div class="mb-4 grid grid-cols-8 gap-4 border-b-2 border-neutral-400 py-3">
				<div class="col-span-2">
					<label for={`job_no-${index}`} class="px-2 text-xl text-neutral-400">Job No *</label>
					<input
						id={`job_no-${index}`}
						class="input w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
						placeholder="Job No *"
						readonly
						aria-readonly="true"
						bind:value={row.job_no}
					/>
				</div>
				<div class="col-span-2">
					<label for={`model_no-${index}`} class="px-2 text-xl text-neutral-400">Model No *</label>
					<input
						id={`model_no-${index}`}
						class="input w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
						placeholder="Model No *"
						bind:value={row.model_no}
					/>
				</div>
				<div class="col-span-2">
					<label for={`quantity-${index}`} class="px-2 text-xl text-neutral-400"
						>Total Quantity *</label
					>
					<input
						id={`quantity-${index}`}
						class="input w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
						type="number"
						placeholder="Quantity *"
						bind:value={row.quantity}
					/>
				</div>
				<div class="col-span-2">
					<label for={`planned_dispatch-${index}`} class="px-2 text-xl text-neutral-400"
						>Planned Dispatch *</label
					>
					<input
						id={`planned_dispatch-${index}`}
						class="input w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
						type="date"
						readonly
						aria-readonly="true"
						bind:value={row.planned_dispatch}
					/>
				</div>
				<div class="col-span-2">
					<label for={`job_card_no-${index}`} class="px-2 text-xl text-neutral-400"
						>Job Card No</label
					>
					<input
						id={`job_card_no-${index}`}
						class="input w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
						placeholder="Job Card No"
						type="number"
						bind:value={row.job_card_no}
					/>
				</div>				
				<div class="col-span-2">
					<label for={`customer-${index}`} class="px-2 text-xl text-neutral-400">Customer</label>
					<input
						id={`customer-${index}`}
						class="input w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
						placeholder="Customer"
						bind:value={row.customer}
					/>
				</div>
				<div class="col-span-2">
					<label for={`dispatched_qty-${index}`} class="px-2 text-xl text-neutral-400">
						Dispatched Quantity
					</label>
					<input
						id={`dispatched_qty-${index}`}
						class="input w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
						type="number"
						placeholder="Dispatched Quantity"
						bind:value={row.dispatched_qty}
					/>
				</div>
                <div class="col-span-2">
					<label for={`actual_dispatch-${index}`} class="px-2 text-xl text-neutral-400"
						>Actual Dispatch</label
					>
					<input
						id={`actual_dispatch-${index}`}
						class="input w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
						type="date"
						bind:value={row.actual_dispatch}
					/>
				</div>
				<div class="col-span-4">
					<label for={`remarks-${index}`} class="px-2 text-xl text-neutral-400">Remarks</label>
					<textarea
						id={`remarks-${index}`}
						name={`remarks-${index}`}
						bind:value={row.remarks}
						class="input w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
						rows="2"
						placeholder="Remarks"
					></textarea>
				</div>
                <div class="col-span-2">
					<label for={`pending_qty-${index}`} class="px-2 text-xl text-neutral-400">
						Pending Quantity
					</label>
					<input
						id={`pending_qty-${index}`}
						class="input w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
						type="number"
						placeholder="Pending Quantity"
						readonly
						aria-readonly="true"
						bind:value={row.pending_qty}
					/>
				</div>
			</div>
		{/each}

		<div class="flex gap-3 justify-end">
			<button
				type="button"
				onclick={saveUpdates}
				disabled={saving || rows.length === 0}
				class="font-5xl rounded-md bg-neutral-800 px-4 py-2 hover:bg-neutral-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
			>
				{saving ? 'Saving...' : 'Save Updates'}
			</button>
		</div>
	</div>
</div>
