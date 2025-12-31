<script lang="ts">
	import './layout.css';
	import "../app.css"
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<div class="min-h-screen grid grid-cols-[220px_1fr] bg-neutral-950 text-neutral-200">

  <aside class="bg-surface shadow-card p-4">
    <h1 class="text-xl font-medium mb-6">TRS</h1>

    <nav class="space-y-1">
      <a href="/" class="block px-3 py-2 rounded-md hover:bg-surface2">
        Dashboard
      </a>
      <a href="/trs/new" class="block px-3 py-2 rounded-md hover:bg-surface2">
        New Job
      </a>
      <a href="/trs/update" class="block px-3 py-2 rounded-md hover:bg-surface2">
        Update Job
      </a>
    </nav>
  </aside>

  <main class="p-6">
    {@render children()}
  </main>

</div>

