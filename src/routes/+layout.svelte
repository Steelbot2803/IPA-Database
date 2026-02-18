<script lang="ts">
	import { styles as uiStyles } from '$lib/utils/styles';
	import './layout.css';
	import '../app.css';
	import logo from '$lib/assets/ipa_logo.png';
	import Toasts from '$lib/components/Toasts.svelte';
	import { page } from '$app/state';
	import { navigating } from '$app/state';
	import { Loader } from 'lucide-svelte';

	let { children } = $props();
	let isOpen = $state(false);
	let sidebarElement: HTMLElement | undefined;
	let toggleButtonElement: HTMLButtonElement | undefined;

	function handleClickOutside(event: MouseEvent) {
		if (!isOpen) return;

		const target = event.target as Node;
		if (!target) return;

		if (sidebarElement && sidebarElement.contains(target)) return;
		if (toggleButtonElement && toggleButtonElement.contains(target)) return;

		isOpen = false;
	}

	function isActivePath(path: string) {
		return page.url.pathname === path;
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
	class={uiStyles.c0006}
>
	<div class={uiStyles.c0007}>
		<div class={uiStyles.c0008} class:translate-y-2={isOpen} class:rotate-45={isOpen}></div>
		<div class={uiStyles.c0009} class:opacity-0={isOpen}></div>
		<div class={uiStyles.c0008} class:-translate-y-2={isOpen} class:-rotate-45={isOpen}></div>
	</div>
</button>

<div class={uiStyles.c0010} class:grid-cols-[250px_1fr]={isOpen} class:grid-cols-[0_1fr]={!isOpen}>
	<aside
		bind:this={sidebarElement}
		class={uiStyles.c0011}
		class:w-[250px]={isOpen}
		class:w-0={!isOpen}
		class:p-4={isOpen}
		class:p-0={!isOpen}
	>
		<div
			class={uiStyles.c0012}
			class:opacity-100={isOpen}
			class:opacity-0={!isOpen}
			class:delay-200={isOpen}
			class:delay-0={!isOpen}
			class:pointer-events-auto={isOpen}
			class:pointer-events-none={!isOpen}
		>
			<img src={logo} alt="IPA LOGO" class={uiStyles.c0013} />
			<h1 class={uiStyles.c0014}>Transducer</h1>

			<nav class={uiStyles.c0015} aria-label="Main Navigation">
				<a
					href="/"
					class={uiStyles.c0016}
					class:bg-neutral-600={isActivePath('/')}
					class:rounded-md={isActivePath('/')}
				>
					<span>Dashboard</span>
					{#if navigating?.to?.url.pathname === '/'}
						<Loader class="animate-spin" stroke-width="5" size={28} />
					{/if}
				</a>
				<nav class={uiStyles.c0017} aria-label="Production Plan Navigation">
					<h2 class={uiStyles.c0018}>Production Plan</h2>
					<a
						href="/trs/prod_plan"
						class={uiStyles.c0019}
						class:bg-neutral-600={isActivePath('/trs/prod_plan')}
					>
						<span>Entry</span>
						{#if navigating?.to?.url.pathname === '/trs/prod_plan'}
							<Loader class="animate-spin" stroke-width="5" size={20} />
						{/if}
					</a>
					<a
						href="/trs/prod_plan_update"
						class={uiStyles.c0019}
						class:bg-neutral-600={isActivePath('/trs/prod_plan_update')}
					>
						<span>Update</span>
						{#if navigating?.to?.url.pathname === '/trs/prod_plan_update'}
							<Loader class="animate-spin" stroke-width="5" size={20} />
						{/if}
					</a>
					<a
						href="/trs/prod_plan_db"
						class={uiStyles.c0019}
						class:bg-neutral-600={isActivePath('/trs/prod_plan_db')}
					>
						<span>Database</span>
						{#if navigating?.to?.url.pathname === '/trs/prod_plan_db'}
							<Loader class="animate-spin" stroke-width="5" size={20} />
						{/if}
					</a>
				</nav>
				<nav class={uiStyles.c0017} aria-label="Jobs Navigation">
					<h2 class={uiStyles.c0018}>Loadcells</h2>
					<a href="/trs/new" class={uiStyles.c0019} class:bg-neutral-600={isActivePath('/trs/new')}>
						<span>Entry</span>
						{#if navigating?.to?.url.pathname === '/trs/new'}
							<Loader class="animate-spin" stroke-width="5" size={20} />
						{/if}
					</a>
					<a
						href="/trs/update"
						class={uiStyles.c0019}
						class:bg-neutral-600={isActivePath('/trs/update')}
					>
						<span>Update</span>
						{#if navigating?.to?.url.pathname === '/trs/updateb'}
							<Loader class="animate-spin" stroke-width="5" size={20} />
						{/if}
					</a>
					<a
						href="/trs/loadcell_db"
						class={uiStyles.c0019}
						class:bg-neutral-600={isActivePath('/trs/loadcell_db')}
					>
						<span>Database</span>
						{#if navigating?.to?.url.pathname === '/trs/loadcell_db'}
							<Loader class="animate-spin" stroke-width="5" size={20} />
						{/if}
					</a>
				</nav>
			</nav>
		</div>
	</aside>

	<main class={uiStyles.c0020}>
		{@render children()}
	</main>
</div>
