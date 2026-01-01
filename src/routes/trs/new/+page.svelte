<script lang="ts">
  import { enhance } from "$app/forms";
  export let form;
  const dateFields = [
    ["wiring", "Wiring"],
    ["tc0", "TC0"],
    ["cycling", "Cycling"],
    ["cabling", "Cabling"],
    ["trimming", "Trimming"],
    ["black_putty", "Black Putty"],
    ["bellow_welding", "Bellow Welding"],
    ["pocket_welding", "Pocket Welding"],
    ["sealing_side_1", "Sealing Side 1"],
    ["sealing_side_2", "Sealing Side 2"],
    ["linearity", "Linearity"],
    ["tc0_qc", "TC0 QC"],
    ["tinning", "Tinning"],
    ["ready_date", "Ready Date"]
  ];
</script>

<div class="max-w-5xl">
  <h1 class="text-5xl font-medium mb-6">New Job</h1>

  <form
    method="POST"
    use:enhance
    class="bg-surface rounded-md shadow-card p-6 space-y-8"
  >

    <!-- CORE DETAILS -->
    <section>
      <h2 class="text-2xl text-neutral-400 mb-4">Core Details</h2>
      <div class="grid grid-cols-4 gap-4">

        <label for="job_date" class="text-xl text-neutral-400 col-span-full">Job Date *</label>
        <input type="date" name="job_date" required class="input w-full bg-surface2 text-neutral-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
        <input name="job_no" placeholder="Job No *" required class="input w-full bg-surface2 text-neutral-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
        <input name="model_no" placeholder="Model No *" required class="input w-full bg-surface2 text-neutral-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
        <input name="job_card_no" type="number" placeholder="Job Card No" class="input w-full bg-surface2 text-neutral-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />

        <input name="blank_no" placeholder="Blank No (7 digits) *"
               inputmode="numeric" pattern="\d{7}" required class="input w-full bg-surface2 text-neutral-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />

        <input name="serial_no" placeholder="Serial No (6 digits)"
               inputmode="numeric" pattern="\d{6}" class="input w-full bg-surface2 text-neutral-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />

        <input name="customer" placeholder="Customer" class="input w-full bg-surface2 text-neutral-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary col-span-2" />

      </div>
    </section>

    <!-- PROCESS DATES -->
    <section>
      <h2 class="text-base text-neutral-400 mb-4">Process Dates</h2>
      <div class="grid grid-cols-10 gap-4">

        {#each dateFields as [field, label]}
        <label for={field} class="text-xs text-neutral-400">{label}</label>
          <input type="date" id={field} name={field} class="input w-full bg-surface2 text-neutral-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary col-span-2" />
        {/each}

      </div>
    </section>

    <!-- REMARKS -->
    <section>
      <h2 class="text-sm text-neutral-400 mb-4">Remarks</h2>
      <textarea name="remarks" rows="3" class="input w-full"></textarea>
    </section>

    <!-- FEEDBACK -->
    {#if form?.error}
      <p class="text-danger text-sm">{form.error}</p>
    {/if}
    {#if form?.success}
      <p class="text-success text-sm">Job created successfully</p>
    {/if}

    <!-- ACTIONS -->
    <div class="flex justify-end gap-2">
      <a href="/" class="px-4 py-2 rounded-md bg-surface2">Cancel</a>
      <button class="px-4 py-2 rounded-md bg-primary font-medium">
        Create Job
      </button>
    </div>

  </form>
</div>
