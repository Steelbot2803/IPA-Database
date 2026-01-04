<script lang="ts">
  export let data;
</script>

<h1>TRS Dashboard</h1>

<!-- KPI SECTION -->
<section class="kpi-grid">
  <div class="kpi dispatched">
    <h1>Dispatched</h1>
    <p>{data.dispatched}</p>
  </div>

  <div class="kpi ready">
    <h1>Ready</h1>
    <p>{data.ready}</p>
  </div>

  <div class="kpi inprocess">
    <h1>In Process</h1>
    <p>{data.inProcess}</p>
  </div>
</section>

<!-- RECENT JOBS -->
<section>
  <h2>Recent Entries</h2>

  <table>
    <thead>
      <tr>
        <th>Blank No</th>
        <th>Status</th>
        <th>Last Updated</th>
      </tr>
    </thead>
    <tbody>
      {#each data.recentJobs as job}
        <tr>
          <td>{job.blank_no}</td>
          <td>{job.status}</td>
          <td>{job.updated_at}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</section>

<!-- DUPLICATE BLANK NO -->
<section class="danger">
  <h2>⚠ Duplicate Blank Numbers</h2>

  {#if data.blankDuplicates.length === 0}
    <p>No duplicates found.</p>
  {:else}
    <table>
      <thead>
        <tr>
          <th>Blank No</th>
          <th>Occurrences</th>
        </tr>
      </thead>
      <tbody>
        {#each data.blankDuplicates as dup}
          <tr>
            <td>{dup.blank_no}</td>
            <td>{dup.count}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</section>

<section class="danger">
  <h2>⚠ Duplicate Serial Numbers</h2>

  {#if data.serialDuplicates.length === 0}
    <p>No duplicates found.</p>
  {:else}
    <table>
      <thead>
        <tr>
          <th>Serial No</th>
          <th>Occurrences</th>
        </tr>
      </thead>
      <tbody>
        {#each data.serialDuplicates as dup}
          <tr>
            <td>{dup.blank_no}</td>
            <td>{dup.count}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</section>
