<script lang="ts">
	import { styles as uiStyles } from '$lib/utils/styles';
	import { onMount } from 'svelte';
	import { toast } from '$lib/utils/toast';
	import { isElectromech } from '$lib/utils/customerFilters';

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
	let electromech = false;
	let searchTerm = '';

	const normalize = (value: unknown) =>
		String(value ?? '')
			.toLowerCase()
			.replace(/\s+/g, ' ')
			.trim();

	const compact = (value: unknown) => normalize(value).replace(/[^a-z0-9]/g, '');

	const constainsSearchTerm = (row: JobRow, term: string) => {
		if (!term) return true;

		const rowText = [
			row.job_no,
			row.model_no,
			row.customer,
			row.job_card_no,
			row.remarks,
			row.planned_dispatch,
			row.actual_dispatch,
			row.quantity,
			row.dispatched_qty,
			row.pending_qty
		]
			.map((value) => normalize(value))
			.join(' ');

		return rowText.includes(term) || compact(rowText).includes(compact(term));
	};

	$: filteredRows = electromech
		? rows.filter((row) => isElectromech(row.customer))
		: rows.filter((row) => !isElectromech(row.customer));

	$: normSearchTerm = searchTerm.trim().toLowerCase();
	$: visibleRows = filteredRows.filter((row) => constainsSearchTerm(row, normSearchTerm));

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
		toast.show(`Updated ${updated} entries successfully`, 'success');
		await loadRows();
	}

	onMount(loadRows);
</script>

<div class={uiStyles.c0042}>
	<h1 class={uiStyles.c0021}>Update Monthly Production Plan</h1>

	<div class={uiStyles.c0043}>
		<div class={uiStyles.c0063}>
			<div class={uiStyles.c0045}>
				<label for="scheduled_month" class={uiStyles.c0046}> Scheduled Month </label>
				<input
					id="scheduled_month"
					class={uiStyles.c0047}
					type="month"
					bind:value={scheduledMonth}
				/>
			</div>
			<div class={uiStyles.c0064}>
				<button type="button" onclick={loadRows} disabled={loading} class={uiStyles.c0065}>
					{loading ? 'Loading...' : 'Load'}
				</button>
			</div>
			<div class={uiStyles.c0066}>
				<label for="search" class={uiStyles.c0046}>Search</label>
				<input
					id="search"
					type="text"
					name=""
					class={uiStyles.c0047}
					placeholder="Search"
					bind:value={searchTerm}
				/>
			</div>
			<div class={uiStyles.c0049}>
				<label for="electromech_toggle" class={uiStyles.c0050}>
					<span class={uiStyles.c0051}>Main</span>
					<input
						id="electromech_toggle"
						type="checkbox"
						class={uiStyles.c0052}
						bind:checked={electromech}
					/>
					<div class={uiStyles.c0053}></div>
					<span class={uiStyles.c0051}>Electromech</span>
				</label>
			</div>
		</div>

		{#if visibleRows.length === 0 && !loading && searchTerm.trim() === ''}
			<p class={uiStyles.c0067}>
				{electromech
					? 'No Electromech production planned for this month.'
					: 'No Main production planned for this month.'}
			</p>
		{:else if visibleRows.length === 0 && !loading && searchTerm.trim() !== ''}
			<p class={uiStyles.c0067}>No results found!</p>
		{/if}

		{#each visibleRows as row, index}
			<div class={uiStyles.c0054}>
				<div class={uiStyles.c0045}>
					<label for={`job_no-${index}`} class={uiStyles.c0046}>Job No *</label>
					<input
						id={`job_no-${index}`}
						class={uiStyles.c0068}
						placeholder="Job No *"
						readonly
						aria-readonly="true"
						bind:value={row.job_no}
					/>
				</div>
				<div class={uiStyles.c0045}>
					<label for={`model_no-${index}`} class={uiStyles.c0046}>Model No *</label>
					<input
						id={`model_no-${index}`}
						class={uiStyles.c0047}
						placeholder="Model No *"
						bind:value={row.model_no}
					/>
				</div>
				<div class={uiStyles.c0045}>
					<label for={`quantity-${index}`} class={uiStyles.c0046}>Total Quantity *</label>
					<input
						id={`quantity-${index}`}
						class={uiStyles.c0047}
						type="number"
						placeholder="Quantity *"
						bind:value={row.quantity}
					/>
				</div>
				<div class={uiStyles.c0045}>
					<label for={`planned_dispatch-${index}`} class={uiStyles.c0046}>Planned Dispatch *</label>
					<input
						id={`planned_dispatch-${index}`}
						class={uiStyles.c0068}
						type="date"
						readonly
						aria-readonly="true"
						bind:value={row.planned_dispatch}
					/>
				</div>
				<div class={uiStyles.c0045}>
					<label for={`job_card_no-${index}`} class={uiStyles.c0046}>Job Card No</label>
					<input
						id={`job_card_no-${index}`}
						class={uiStyles.c0047}
						placeholder="Job Card No"
						type="number"
						bind:value={row.job_card_no}
					/>
				</div>
				<div class={uiStyles.c0045}>
					<label for={`customer-${index}`} class={uiStyles.c0046}>Customer</label>
					<input
						id={`customer-${index}`}
						class={uiStyles.c0047}
						placeholder="Customer"
						bind:value={row.customer}
					/>
				</div>
				<div class={uiStyles.c0045}>
					<label for={`dispatched_qty-${index}`} class={uiStyles.c0046}>
						Dispatched Quantity
					</label>
					<input
						id={`dispatched_qty-${index}`}
						class={uiStyles.c0047}
						type="number"
						placeholder="Dispatched Quantity"
						bind:value={row.dispatched_qty}
					/>
				</div>
				<div class={uiStyles.c0045}>
					<label for={`actual_dispatch-${index}`} class={uiStyles.c0046}>Actual Dispatch</label>
					<input
						id={`actual_dispatch-${index}`}
						class={uiStyles.c0047}
						type="date"
						bind:value={row.actual_dispatch}
					/>
				</div>
				<div class={uiStyles.c0048}>
					<label for={`remarks-${index}`} class={uiStyles.c0046}>Remarks</label>
					<textarea
						id={`remarks-${index}`}
						name={`remarks-${index}`}
						bind:value={row.remarks}
						class={uiStyles.c0047}
						rows="2"
						placeholder="Remarks"
					></textarea>
				</div>
				<div class={uiStyles.c0045}>
					<label for={`pending_qty-${index}`} class={uiStyles.c0046}> Pending Quantity </label>
					<input
						id={`pending_qty-${index}`}
						class={uiStyles.c0068}
						type="number"
						placeholder="Pending Quantity"
						readonly
						aria-readonly="true"
						bind:value={row.pending_qty}
					/>
				</div>
			</div>
		{/each}

		<div class={uiStyles.c0060}>
			<button
				type="button"
				onclick={saveUpdates}
				disabled={saving || rows.length === 0}
				class={uiStyles.c0062}
			>
				{saving ? 'Saving...' : 'Save Updates'}
			</button>
		</div>
	</div>
</div>
