<script lang="ts">
	import './layout.css';
	import '../app.css';
	import logo from '$lib/assets/ipa_logo.png';

	let { children } = $props();
	let isOpen = $state(false);
</script>

<svelte:head>
	<title>TRS</title>
	<meta name="description" content="Job management system for Transducer" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<link rel="icon" type="image/png" href={logo} />
</svelte:head>

<button
	onclick={() => (isOpen = !isOpen)}
	aria-label="Toggle Navigation"
	class="fixed top-2 left-2 z-50 rounded-md"
>
	<div class="w-6 space-y-1">
		<div
			class="h-1 w-6 bg-cyan-500/80 transition-transform duration-300"
			class:rotate-45={isOpen}
			class:translate-y-2={isOpen}
		></div>
		<div
			class="h-1 w-6 bg-cyan-500/80 transition-opacity duration-300"
			class:opacity-0={isOpen}
		></div>
		<div
			class="h-1 w-6 bg-cyan-500/80 transition-transform duration-300"
			class:-rotate-45={isOpen}
			class:-translate-y-2={isOpen}
		></div>
	</div>
</button>

<div
	class="grid min-h-screen bg-neutral-950 text-neutral-200 transition-all ease-in-out motion-reduce:transition-none duration-300"
	class:grid-cols-[250px_1fr]={isOpen}
	class:grid-cols-[0_1fr]={!isOpen}
>
	<aside
		class="overflow-hidden bg-neutral-900 transition-all duration-300"
		class:w-[250px]={isOpen}
		class:w-0={!isOpen}
		class:p-4={isOpen}
		class:p-0={!isOpen}
	>
		<div
			class="transition-opacity duration-200"
			class:opacity-100={isOpen}
			class:opacity-0={!isOpen}
			class:delay-200={isOpen}
			class:delay-0={!isOpen}
			class:pointer-events-auto={isOpen}
			class:pointer-events-none={!isOpen}
		>
			<img src={logo} alt="IPA LOGO" class="mx-auto mt-8 mb-4" />
			<h1 class="mb-6 text-center text-4xl">Transducer</h1>

			<nav class="space-y-6" aria-label="Main Navigation">
				<a href="/" class="block rounded-md px-3 py-2 text-2xl hover:bg-neutral-600">
					| Dashboard
				</a>
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
					<a
						href="/trs/loadcell_db"
						class="block rounded-md px-3 py-2 text-2xl hover:bg-neutral-600"
					>
						| Loadcell DB
					</a>
				</nav>
			</nav>
		</div>
	</aside>

	<main class="p-6">
		{@render children()}
	</main>
</div>
