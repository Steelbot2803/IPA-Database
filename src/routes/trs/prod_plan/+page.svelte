<script lang="ts">
	import { toast } from '$lib/stores/toast';

	type JobRow = {
		job_no: string;
		job_card_no: number;
		model_no: string;
		quantity: number;
		planned_dispatch: Date;
		scheduled_month: Date;
        actual_dispatch: Date;
        customer: string;
        remarks: string;
        dimension: string;
        dispatched_qty: number
	};

	function emptyRow(): JobRow {
		return {
			job_no: '',
			job_card_no: 0,
			model_no: '',
			quantity: 0,
			planned_dispatch: new Date(),
			scheduled_month: new Date(),
            actual_dispatch: new Date(),
            customer: '',
            remarks: '',
            dimension: '',
            dispatched_qty: 0
		};
	}

	let rows: JobRow[] = [emptyRow()];
	let submitting = false;

	function addRow() {
		rows = [...rows, emptyRow()];
	}

	async function submit() {
		submitting = true;

		const res = await fetch('/trs/prod_plan', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(rows)
		});

		submitting = false;

		if (!res.ok) {
			const {message} = await res.json();
			toast.show(message, 'error');
			return;
		}

        const {inserted} = await res.json();
		toast.show(`Inserted ${inserted} jobs successfully`, 'success');
		rows = [emptyRow()];
	}
</script>

<div class="space-y-6">
	<h1 class="text-2xl font-semibold">Monthly Production Plan</h1>

	{#each rows as row}
		<div class="grid grid-cols-6 gap-2">
			<input class="input" placeholder="Job No" bind:value={row.job_no} />
			<input class="input" placeholder="Job Card" bind:value={row.job_card_no} />
			<input class="input" placeholder="Model No" bind:value={row.model_no} />
			<input class="input" type="number" bind:value={row.quantity} />
			<input class="input" type="date" bind:value={row.planned_dispatch} />
			<input class="input" type="month" bind:value={row.scheduled_month} />
            <input class="input" type="date" bind:value={row.actual_dispatch} />
            <input class="input" placeholder="Customer" bind:value={row.customer} />
            <input class="input" placeholder="Remarks" bind:value={row.remarks} />
            <input class="input" placeholder="dimension" bind:value={row.dimension} />
            <input class="input" type="number" bind:value={row.dispatched_qty} />
		</div>
	{/each}

	<div class="flex gap-3">
		<button on:click={addRow}>＋ Add Row</button>
		<button on:click={submit} disabled={submitting}>
			{submitting ? 'Saving…' : 'Submit'}
		</button>
	</div>
</div>