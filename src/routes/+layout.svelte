<script lang="ts">
	import './layout.css';
	import "../app.css"
	import logo from '$lib/assets/ipa_logo.png';

	let { children } = $props();
</script>

<svelte:head>
	<title>TRS - Job Management</title>

  	<meta name="description" content="Internal job and blank tracking system for IPA manufacturing." />
  	<meta name="theme-color" content="#0f172a" />

	<link rel="icon" type="image/png" href={logo} />
</svelte:head>

<div class="min-h-screen grid grid-cols-[250px_1fr] bg-neutral-950 text-neutral-200">

  <aside class="bg-neutral-900 text-neutral-400 shadow-card p-4 font-medium">
    <img src={logo} alt="IPA LOGO" class="mb-4 mx-auto"/>
	<h1 class="text-4xl mb-6 text-center">Transducer</h1>

    <nav class="space-y-1" aria-label="Main Navigation">
      <a href="/" class="text-xl block px-3 py-2 rounded-md hover:bg-neutral-600">
        Dashboard
      </a>
      <a href="/trs/new" class="text-xl block px-3 py-2 rounded-md hover:bg-neutral-600">
        New Job
      </a>
      <a href="/trs/update" class="text-xl block px-3 py-2 rounded-md hover:bg-neutral-600">
        Update Job
      </a>
    </nav>
  </aside>

  <main class="p-6">
    {@render children()}
  </main>

</div>

