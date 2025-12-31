<script lang="ts">
	import { supabase } from '$lib/supabaseClient';

	let job = {
		job_no: null,
		job_card_no: null,
		model_no: null,
		capacity: null,
		job_date: null,
		blank_no: null
	};

	async function save() {
		// Validate required fields
		if (!job.job_no || !job.job_card_no || !job.model_no || !job.capacity || !job.blank_no || !job.job_date) {
			alert('All fields are required');
			return;
		}

		try {
			const { error } = await supabase.from('trs_prod').insert([
				{
					job_no: job.job_no,
					job_card_no: job.job_card_no,
					model_no: job.model_no,
					capacity: job.capacity,
					blank_no: job.blank_no,
					job_date: job.job_date
				}
			]);

			if (error) alert(error.message);
			else {
				alert('Job created successfully');
				// Reset form
				job = {
					job_no: null,
					job_card_no: null,
					model_no: null,
					capacity: null,
					job_date: null,
					blank_no: null
				};
			}
		} catch (err) {
            alert('An unexpected error occurred');
            console.error(err);
        }
	}
</script>

<h1 class="mb-4 text-2xl font-bold">New Job</h1>
<div class="max-w-md space-y-4">
	<div>
		<label for="job_no" class="mb-1 block font-semibold">Job No</label>
		<input
			id="job_no"
			type="text"
			bind:value={job.job_no}
			class="w-full rounded border border-gray-300 px-3 py-2"
		/>
	</div>

	<div>
		<label for="job_card_no" class="mb-1 block font-semibold">Job Card No</label>
		<input
			id="job_card_no"
			type="number"
			bind:value={job.job_card_no}
			class="w-full rounded border border-gray-300 px-3 py-2"
		/>
	</div>

	<div>
		<label for="model_no" class="mb-1 block font-semibold">Model No</label>
		<input
			id="model_no"
			type="text"
			bind:value={job.model_no}
			class="w-full rounded border border-gray-300 px-3 py-2"
		/>
	</div>

	<div>
		<label for="capacity" class="mb-1 block font-semibold">Capacity</label>
		<input
			id="capacity"
			type="number"
			bind:value={job.capacity}
			class="w-full rounded border border-gray-300 px-3 py-2"
		/>
	</div>

	<div>
		<label for="blank_no" class="mb-1 block font-semibold">Blank No</label>
		<input
			id="blank_no"
			type="number"
			bind:value={job.blank_no}
			class="w-full rounded border border-gray-300 px-3 py-2"
		/>
	</div>

	<div>
		<label for="job_date" class="mb-1 block font-semibold">Job Date</label>
		<input
			id="job_date"
			type="date"
			bind:value={job.job_date}
			class="w-full rounded border border-gray-300 px-3 py-2"
		/>
	</div>

	<button on:click={save} class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
		Save Job
	</button>
</div>
