<script lang="ts">
	import { styles as uiStyles } from '$lib/utils/styles';
	import './layout.css';
	import '../app.css';
	import logo from '$lib/assets/ipa_logo.png';
	import Toasts from '$lib/components/Toasts.svelte';
	import { page } from '$app/state';

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
					Dashboard
				</a>
				<nav class={uiStyles.c0017} aria-label="Production Plan Navigation">
					<h2 class={uiStyles.c0018}>Production Plan</h2>
					<a
						href="/trs/prod_plan"
						class={uiStyles.c0019}
						class:bg-neutral-600={isActivePath('/trs/prod_plan')}
					>
						| Entry
					</a>
					<a
						href="/trs/prod_plan_update"
						class={uiStyles.c0019}
						class:bg-neutral-600={isActivePath('/trs/prod_plan_update')}
					>
						| Update
					</a>
					<a
						href="/trs/prod_plan_db"
						class={uiStyles.c0019}
						class:bg-neutral-600={isActivePath('/trs/prod_plan_db')}
					>
						| Database
					</a>
				</nav>
				<nav class={uiStyles.c0017} aria-label="Incoming Blanks Navigation">
					<h2 class={uiStyles.c0018}>Blanks</h2>
					<a
						href="/trs/blank"
						class={uiStyles.c0019}
						class:bg-neutral-600={isActivePath('/trs/blank')}
					>
						| Entry
					</a>
					<a
						href="/trs/blank_db"
						class={uiStyles.c0019}
						class:bg-neutral-600={isActivePath('/trs/blank_db')}
					>
						| Database
					</a>
				</nav>
				<nav class={uiStyles.c0017} aria-label="Jobs Navigation">
					<h2 class={uiStyles.c0018}>Loadcells</h2>
					<a href="/trs/new" class={uiStyles.c0019} class:bg-neutral-600={isActivePath('/trs/new')}>
						| Entry
					</a>
					<a
						href="/trs/update"
						class={uiStyles.c0019}
						class:bg-neutral-600={isActivePath('/trs/update')}
					>
						| Update
					</a>
					<a
						href="/trs/loadcell_db"
						class={uiStyles.c0019}
						class:bg-neutral-600={isActivePath('/trs/loadcell_db')}
					>
						| Database
					</a>
				</nav>
			</nav>
		</div>
	</aside>

	<main class={uiStyles.c0020}>
		{@render children()}
	</main>
</div>
