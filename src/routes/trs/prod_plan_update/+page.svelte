<script lang="ts">
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

<div class="min-w-full space-y-6 text-neutral-200">
	<h1 class="mb-6 text-center text-5xl font-medium text-neutral-200">
		Update Monthly Production Plan
	</h1>

	<div class="bg-surface shadow-card space-y-6 rounded-md p-6">
		<div class="grid grid-cols-8 items-end gap-4">
			<div class="col-span-2">
				<label for="scheduled_month" class="px-2 text-xl text-neutral-200"> Scheduled Month </label>
				<input
					id="scheduled_month"
					class="input mt-2 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
					type="month"
					bind:value={scheduledMonth}
				/>
			</div>
			<div class="col-span-1">
				<button
					type="button"
					onclick={loadRows}
					disabled={loading}
					class="rounded-md border border-neutral-700 bg-neutral-800 px-4 py-2 text-neutral-200 transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{loading ? 'Loading...' : 'Load'}
				</button>
			</div>
			<div class="col-span-3">
				<label for="search" class="px-2 text-xl text-neutral-200">Search</label>
				<input
					id="search"
					type="text"
					name=""
					class="input mt-2 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
					placeholder="Search"
					bind:value={searchTerm}
				/>
			</div>
			<div class="relative col-span-2">
				<label
					for="electromech_toggle"
					class="absolute right-0 bottom-0 flex cursor-pointer items-center rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5"
				>
					<span class="text-xl text-neutral-200">Main</span>
					<input
						id="electromech_toggle"
						type="checkbox"
						class="peer sr-only"
						bind:checked={electromech}
					/>
					<div
						class="peer peer-checked:after:border-buffer peer-checked:bg-brand relative mx-3 h-5 w-9 rounded-full bg-cyan-500 peer-checked:bg-red-600 after:absolute after:start-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform after:duration-250 after:ease-in-out after:will-change-transform after:content-[''] peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full"
					></div>
					<span class="text-xl text-neutral-200">Electromech</span>
				</label>
			</div>
		</div>

		{#if visibleRows.length === 0 && !loading && searchTerm.trim() === ''}
			<p
				class="font-5xl rounded-md border-2 border-red-600 bg-red-800 py-2 text-center text-2xl text-red-100"
			>
				{electromech
					? 'No Electromech production planned for this month.'
					: 'No Main production planned for this month.'}
			</p>
		{:else if visibleRows.length === 0 && !loading && searchTerm.trim() !== ''}
			<p
				class="font-5xl rounded-md border-2 border-red-600 bg-red-800 py-2 text-center text-2xl text-red-100"
			>
				No results found!
			</p>
		{/if}

		{#each visibleRows as row, index}
			<div class="mb-4 grid grid-cols-8 gap-4 border-b-2 border-neutral-400 py-3">
				<div class="col-span-2">
					<label for={`job_no-${index}`} class="px-2 text-xl text-neutral-200">Job No *</label>
					<input
						id={`job_no-${index}`}
						class="input mt-2 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
						placeholder="Job No *"
						readonly
						aria-readonly="true"
						bind:value={row.job_no}
					/>
				</div>
				<div class="col-span-2">
					<label for={`model_no-${index}`} class="px-2 text-xl text-neutral-200">Model No *</label>
					<input
						id={`model_no-${index}`}
						class="input mt-2 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
						placeholder="Model No *"
						bind:value={row.model_no}
					/>
				</div>
				<div class="col-span-2">
					<label for={`quantity-${index}`} class="px-2 text-xl text-neutral-200"
						>Total Quantity *</label
					>
					<input
						id={`quantity-${index}`}
						class="input mt-2 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
						type="number"
						placeholder="Quantity *"
						bind:value={row.quantity}
					/>
				</div>
				<div class="col-span-2">
					<label for={`planned_dispatch-${index}`} class="px-2 text-xl text-neutral-200"
						>Planned Dispatch *</label
					>
					<input
						id={`planned_dispatch-${index}`}
						class="input mt-2 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
						type="date"
						readonly
						aria-readonly="true"
						bind:value={row.planned_dispatch}
					/>
				</div>
				<div class="col-span-2">
					<label for={`job_card_no-${index}`} class="px-2 text-xl text-neutral-200"
						>Job Card No</label
					>
					<input
						id={`job_card_no-${index}`}
						class="input mt-2 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
						placeholder="Job Card No"
						type="number"
						bind:value={row.job_card_no}
					/>
				</div>
				<div class="col-span-2">
					<label for={`customer-${index}`} class="px-2 text-xl text-neutral-200">Customer</label>
					<input
						id={`customer-${index}`}
						class="input mt-2 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
						placeholder="Customer"
						bind:value={row.customer}
					/>
				</div>
				<div class="col-span-2">
					<label for={`dispatched_qty-${index}`} class="px-2 text-xl text-neutral-200">
						Dispatched Quantity
					</label>
					<input
						id={`dispatched_qty-${index}`}
						class="input mt-2 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
						type="number"
						placeholder="Dispatched Quantity"
						bind:value={row.dispatched_qty}
					/>
				</div>
				<div class="col-span-2">
					<label for={`actual_dispatch-${index}`} class="px-2 text-xl text-neutral-200"
						>Actual Dispatch</label
					>
					<input
						id={`actual_dispatch-${index}`}
						class="input mt-2 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
						type="date"
						bind:value={row.actual_dispatch}
					/>
				</div>
				<div class="col-span-4">
					<label for={`remarks-${index}`} class="px-2 text-xl text-neutral-200">Remarks</label>
					<textarea
						id={`remarks-${index}`}
						name={`remarks-${index}`}
						bind:value={row.remarks}
						class="input mt-2 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
						rows="2"
						placeholder="Remarks"
					></textarea>
				</div>
				<div class="col-span-2">
					<label for={`pending_qty-${index}`} class="px-2 text-xl text-neutral-200">
						Pending Quantity
					</label>
					<input
						id={`pending_qty-${index}`}
						class="input mt-2 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
						type="number"
						placeholder="Pending Quantity"
						readonly
						aria-readonly="true"
						bind:value={row.pending_qty}
					/>
				</div>
			</div>
		{/each}

		<div class="flex justify-end gap-3">
			<button
				type="button"
				onclick={saveUpdates}
				disabled={saving || rows.length === 0}
				class="font-5xl cursor-pointer rounded-md bg-neutral-800 px-4 py-2 hover:bg-neutral-600 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{saving ? 'Saving...' : 'Save Updates'}
			</button>
		</div>
	</div>
</div>
