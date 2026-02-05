<script lang="ts">
	import './layout.css';
	import '../app.css';
	import logo from '$lib/assets/ipa_logo.png';
	import Toasts from '$lib/components/Toasts.svelte';

	let { children } = $props();
	let isOpen = $state(false);
	let sidebarElement: HTMLElement | undefined;
	let toggleButtonElement: HTMLButtonElement | undefined;

	function handleClickOutside(event: MouseEvent) {
		if(!isOpen) return;

		const target = event.target as Node;
		if (!target) return;

		if (sidebarElement && sidebarElement.contains(target)) return;
		if (toggleButtonElement && toggleButtonElement.contains(target)) return;

		isOpen = false;
	}
</script>

<Toasts />

<svelte:document onclick={handleClickOutside} />

<svelte:head>
	<title>TRS</title>
	<meta name="description" content="Job management system for Transducer" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<link rel="icon" type="image/png" href={logo} />
</svelte:head>

<button
	bind:this={toggleButtonElement}
	onclick={() => (isOpen = !isOpen)}
	aria-label="Toggle Navigation"
	class="fixed top-3 left-2 z-50 rounded-md"
>
	<div class="w-6 space-y-1">
		<div
			class="h-1 w-6 bg-cyan-500/80 transition-transform duration-300"
			class:translate-y-2={isOpen}
			class:rotate-45={isOpen}
		></div>
		<div
			class="h-1 w-6 bg-cyan-500/80 transition-opacity duration-300"
			class:opacity-0={isOpen}
		></div>
		<div
			class="h-1 w-6 bg-cyan-500/80 transition-transform duration-300"
			class:-translate-y-2={isOpen}
			class:-rotate-45={isOpen}
		></div>
	</div>
</button>

<div
	class="grid min-h-screen bg-neutral-950 text-neutral-200 transition-all duration-300 ease-in-out motion-reduce:transition-none"
	class:grid-cols-[250px_1fr]={isOpen}
	class:grid-cols-[0_1fr]={!isOpen}
>
	<aside
		bind:this={sidebarElement}
		class="overflow-hidden bg-neutral-800 transition-all duration-300"
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
				<a href="/" class="block px-3 py-2 text-2xl text-neutral-200 hover:bg-neutral-600 border-b-2 text-center hover:rounded-md">
					Dashboard
				</a>
				<nav class="space-y-1 border-b-2 py-2" aria-label="Production Plan Navigation">
					<h2 class="rounded-md px-3 py-2 text-2xl bg-neutral-950">Production Plan</h2>
					<a href="/trs/prod_plan" class="block rounded-md px-3 py-2 text-xl hover:bg-neutral-600">
						| Entry
					</a>
					<a href="/trs/prod_plan_update" class="block rounded-md px-3 py-2 text-xl hover:bg-neutral-600">
						| Update
					</a>
					<a href="/trs/prod_plan_db" class="block rounded-md px-3 py-2 text-xl hover:bg-neutral-600">
						| Database
					</a>
				</nav>
				<nav class="space-y-1 border-b-2 py-2" aria-label="Incoming Blanks Navigation">
					<h2 class="rounded-md px-3 py-2 text-2xl bg-neutral-950">Blank</h2>
					<a href="/trs/blank" class="block rounded-md px-3 py-2 text-xl hover:bg-neutral-600">
						| Entry
					</a>
					<a href="/trs/blank_db" class="block rounded-md px-3 py-2 text-xl hover:bg-neutral-600">
						| Database
					</a>
				</nav>
				<nav class="space-y-1 border-b-2 py-2" aria-label="Jobs Navigation">
					<h2 class="rounded-md px-3 py-2 text-2xl bg-neutral-950">Loadcell</h2>
					<a href="/trs/new" class="block rounded-md px-3 py-2 text-xl hover:bg-neutral-600">
						| Entry
					</a>
					<a href="/trs/update" class="block rounded-md px-3 py-2 text-xl hover:bg-neutral-600">
						| Update
					</a>
					<a
						href="/trs/loadcell_db"
						class="block rounded-md px-3 py-2 text-xl hover:bg-neutral-600"
					>
						| Database
					</a>
				</nav>
			</nav>
		</div>
	</aside>

	<main class="p-6">
		{@render children()}
	</main>
</div>
