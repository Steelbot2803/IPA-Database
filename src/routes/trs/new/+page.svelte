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
    ["ready_date", "Ready Date"],
    ["dispatch_date", "Dispatch Date"]
  ];
</script>

<div class="max-w-5xl">
    <h1 class="text-5xl text-neutral-400 font-medium mb-6">New Job</h1>

        <form
        method="POST"
        use:enhance
        class="bg-surface rounded-md shadow-card p-6 space-y-8"
        >

        <!-- CORE DETAILS -->
        <section>
            <h2 class="text-2xl text-neutral-400 mb-4">Core Details</h2>
            <div class="grid grid-cols-8 gap-4 mb-4">

                <div class="col-span-2">

                    <label for="job_date" class="text-xl text-neutral-400 ">Job Date *</label>
                    <input type="date" name="job_date" required class="input w-full bg-neutral-800 text-neutral-200 rounded-md px-3 py-2 border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" />

                </div>

                <div class="col-span-2">

                    <label for="job_no" class="text-xl text-neutral-400 ">Job No *</label>
                    <input type="text" name="job_no" placeholder="Job No *" required class="input w-full bg-neutral-800 text-neutral-200 rounded-md px-3 py-2 border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" />

                </div>

                <div class="col-span-2">

                    <label for="model_no" class="text-xl text-neutral-400 ">Model No *</label>
                    <input type="text" name="model_no" placeholder="Model No *" required class="input w-full bg-neutral-800 text-neutral-200 rounded-md px-3 py-2 border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" />

                </div>

                <div class="col-span-2">

                    <label for="blank_no" class="text-xl text-neutral-400 ">Blank No *</label>
                    <input name="blank_no" type="number" placeholder="Blank No (7 digits) *" inputmode="numeric" pattern="\d{7}" required class="input w-full bg-neutral-800 text-neutral-200 rounded-md px-3 py-2 border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" />
                    <div class="flex items-center gap-2 col-span-6 mb-2">
                        <input type="checkbox" id="allow_duplicate_blank" name="allow_duplicate_blank" class="accent-primary"/>
                        <label for="allow_duplicate_blank" class="text-base text-neutral-400">
                            Allow duplicate Blank No
                        </label>
                    </div>

                </div>

            </div>
        </section>
        <!-- ADDITIONAL DETAILS -->
        <section>
            <h2 class="text-2xl text-neutral-400 mb-4">Additional Details</h2>
            <div class="grid grid-cols-8 gap-4 mb-4">

                <div class="col-span-2">
        
                    <label for="job_card_no" class="text-xl text-neutral-400 ">Job Card No</label>
                    <input name="job_card_no" type="number" placeholder="Job Card No" class="input w-full bg-neutral-800 text-neutral-200 rounded-md px-3 py-2 border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" />

                </div>

                <div class="col-span-2">

                    <label for="serial_no" class="text-xl text-neutral-400 ">Serial No</label>
                    <input name="serial_no" type="number" placeholder="Serial No (6 digits)" inputmode="numeric" pattern="\d{6}" class="input w-full bg-neutral-800 text-neutral-200 rounded-md px-3 py-2 border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" />

                </div>

                <div class="col-span-2">

                    <label for="customer" class="text-xl text-neutral-400 ">Customer</label>
                    <textarea name="customer" rows="1" placeholder="Customer" class="input w-full bg-neutral-800 text-neutral-200 rounded-md px-3 py-2 border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary col-span-3"></textarea>

                </div>

            </div>

        </section>

        <!-- PROCESS DATES -->
        <section>
            <h2 class="text-2xl text-neutral-400 mb-4">Process Dates</h2>
            <div class="grid grid-cols-8 gap-4">

                {#each dateFields as [field, label]}
                <label for={field} class="text-xl text-neutral-400 col-span-1">{label}</label>
                <input type="date" id={field} name={field} class="input w-full bg-neutral-800 text-neutral-200 rounded-md px-3 py-2 border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary col-span-1" />
                {/each}

            </div>
        </section>

        <!-- REMARKS -->
        <section>
            <h2 class="text-xl text-neutral-400 mb-4">Remarks</h2>
            <div class="grid grid-cols-2">
                <textarea name="remarks" class="input bg-neutral-800 text-neutral-200 rounded-md px-3 py-2 border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary col-span-2"></textarea>
            </div>
        </section>

        <!-- FEEDBACK -->
        {#if form?.error}
            <p class="text-danger text-xl">{form.error}</p>
        {/if}
        {#if form?.success}
            <p class="text-success text-xl">Job created successfully</p>
        {/if}

        <!-- ACTIONS -->
        <div class="flex justify-end gap-2">
            <a href="/" class="px-4 py-2 rounded-md bg-neutral-800 hover:bg-neutral-600 font-5xl">Cancel</a>
            <button type="submit" formaction="?/create" class="px-4 py-2 rounded-md bg-neutral-800 font-5xl hover:bg-neutral-600">
                Create Job
            </button>
        </div>

    </form>
</div>
