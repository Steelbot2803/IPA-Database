<script lang="ts">
	import './layout.css';
	import "../app.css"
	import logo from '$lib/assets/ipa_logo.png';

	let { children } = $props();
</script>

<svelte:head>
  <title>TRS</title>
  <meta name="description" content="Job management system for Transducer" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
	<link rel="icon" type="image/png" href={logo} />
</svelte:head>

<div class="min-h-screen grid grid-cols-[250px_1fr] bg-neutral-950 text-neutral-200">

  <aside class="bg-neutral-900 text-neutral-400 shadow-card p-4 font-medium">
    <img src={logo} alt="IPA LOGO" class="mb-4 mx-auto"/>
	  <h1 class="text-4xl mb-6 text-center">Transducer</h1>

    <nav class="space-y-1" aria-label="Main Navigation">
      <a href="/" class="text-2xl block px-3 py-2 rounded-md hover:bg-neutral-600">
        | Dashboard
      </a>
      <a href="/trs/new" class="text-2xl block px-3 py-2 rounded-md hover:bg-neutral-600">
        | New Job
      </a>
      <a href="/trs/update" class="text-2xl block px-3 py-2 rounded-md hover:bg-neutral-600">
        | Update Job
      </a>
      <a href="/trs/db" class="text-2xl block px-3 py-2 rounded-md hover:bg-neutral-600">
        | Job Database
      </a>
    </nav>
  </aside>

  <main class="p-6">
    {@render children()}
  </main>

</div>

