<script lang="ts">
	import './layout.css';
	import '../app.css';
	import logo from '$lib/assets/ipa_logo.png';

	let { children } = $props();
</script>

<svelte:head>
	<title>TRS</title>
	<meta name="description" content="Job management system for Transducer" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<link rel="icon" type="image/png" href={logo} />
</svelte:head>

<div class="grid min-h-screen grid-cols-[250px_1fr] bg-neutral-950 text-neutral-200">
	<aside class="shadow-card bg-neutral-900 p-4 font-medium text-neutral-400">
		<img src={logo} alt="IPA LOGO" class="mx-auto mb-4" />
		<h1 class="mb-6 text-center text-4xl">Transducer</h1>

		<nav class="space-y-6" aria-label="Main Navigation">
			<a href="/" class="block rounded-md px-3 py-2 text-2xl hover:bg-neutral-600"> | Dashboard </a>
			<nav class="space-y-1" aria-label="Incoming Blanks Navigation">
				<a href="/trs/blank" class="block rounded-md px-3 py-2 text-2xl hover:bg-neutral-600">
					| Blank Entry
				</a>
				<a href="/trs/blank_db" class="block rounded-md px-3 py-2 text-2xl hover:bg-neutral-600">
					| Blank Stock DB
				</a>
			</nav>
			<nav class="space-y-1" aria-label="Jobs Navigation">
				<a href="/trs/new" class="block rounded-md px-3 py-2 text-2xl hover:bg-neutral-600">
					| Loadcell Entry
				</a>
				<a href="/trs/update" class="block rounded-md px-3 py-2 text-2xl hover:bg-neutral-600">
					| Loadcell Update
				</a>
				<a href="/trs/loadcell_db" class="block rounded-md px-3 py-2 text-2xl hover:bg-neutral-600">
					| Loadcell DB
				</a>
			</nav>
		</nav>
	</aside>

	<main class="p-6">
		{@render children()}
	</main>
</div>
