<script lang="ts">
	import { styles as uiStyles } from '$lib/utils/styles';
	import './layout.css';
	import '../app.css';
	import logo from '$lib/assets/ipa_logo.png';
	import Toasts from '$lib/components/Toasts.svelte';
	import { page } from '$app/state';
	import { navigating } from '$app/state';
	import { Loader, Sun, Moon, Menu, X } from 'lucide-svelte';
	import { fade, slide } from 'svelte/transition';
	import { cubicInOut } from 'svelte/easing';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let { data, children } = $props();
	let isOpen = $state(false);
	let sidebarElement: HTMLElement | undefined;
	let toggleButtonElement: HTMLButtonElement | undefined;

	type Theme = 'dark' | 'light';
	const THEME_STORAGE_KEY = 'theme-preference';

	let theme = $state<Theme>('dark');

	function applyTheme(nextTheme: Theme) {
		if (!browser) return;

		theme = nextTheme;
		document.documentElement.classList.toggle('light', nextTheme === 'light');
		document.documentElement.dataset.theme = nextTheme;
		localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
	}

	function toggleTheme() {
		applyTheme(theme === 'dark' ? 'light' : 'dark');
	}

	onMount(() => {
		const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
		if (storedTheme === 'dark' || storedTheme === 'light') {
			applyTheme(storedTheme);
			return;
		}

		const preferredTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
			? 'dark'
			: 'light';
		applyTheme(preferredTheme);
	});

	function handleClickOutside(event: MouseEvent) {
		if (!isOpen) return;

		const target = event.target as Node;
		if (!target) return;

		if (sidebarElement && sidebarElement.contains(target)) return;
		if (toggleButtonElement && toggleButtonElement.contains(target)) return;

		isOpen = false;
	}

	function handleDocumentKeydown(event: KeyboardEvent) {
		const key = event.key;
		if (!key) return;
		if (!isOpen) return;

		isOpen = false;
	}

	function isActivePath(path: string) {
		return page.url.pathname === path;
	}
</script>

<Toasts />

<svelte:document onclick={handleClickOutside} onkeydown={handleDocumentKeydown} />

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

<button
	type="button"
	onclick={toggleTheme}
	class="fixed top-2 right-2 z-50 rounded-md p-1 text-neutral-200 transition hover:bg-neutral-700"
	aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
>
	{#if theme === 'dark'}
		<Sun size={32} />
	{:else}
		<Moon size={32} />
	{/if}
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

			{#if data.user}
				<div
					class="mb-3 rounded-md border border-neutral-700 bg-neutral-900/80 p-2 text-sm text-neutral-300"
				>
					Signed in as <span class="font-semibold">{data.user.user_metadata?.username ?? data.user.email} ({data.role})</span>
				</div>
				<form method="POST" action="/auth/logout" class="mb-4">
					<button
						type="submit"
						class="w-full rounded-md border border-neutral-700 bg-neutral-900/80 px-3 py-2 text-sm text-neutral-200 transition hover:bg-neutral-700"
					>
						Sign out
					</button>
				</form>
			{/if}

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
					{#if data.role === 'ADMIN' || data.role === 'USER'}
					<a
						href="/trs/prod_plan_new"
						class={uiStyles.c0019}
						class:bg-neutral-600={isActivePath('/trs/prod_plan_new')}
					>
						<span>Entry</span>
						{#if navigating?.to?.url.pathname === '/trs/prod_plan_new'}
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
					{/if}
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
					{#if data.role === 'ADMIN' || data.role === 'USER'}
					<a
						href="/trs/lc_new"
						class={uiStyles.c0019}
						class:bg-neutral-600={isActivePath('/trs/lc_new')}
					>
						<span>Entry</span>
						{#if navigating?.to?.url.pathname === '/trs/lc_new'}
							<Loader class="animate-spin" stroke-width="5" size={20} />
						{/if}
					</a>
					<a
						href="/trs/lc_update"
						class={uiStyles.c0019}
						class:bg-neutral-600={isActivePath('/trs/lc_update')}
					>
						<span>Update</span>
						{#if navigating?.to?.url.pathname === '/trs/lc_update'}
							<Loader class="animate-spin" stroke-width="5" size={20} />
						{/if}
					</a>
					{/if}
					<a
						href="/trs/lc_db"
						class={uiStyles.c0019}
						class:bg-neutral-600={isActivePath('/trs/lc_db')}
					>
						<span>Database</span>
						{#if navigating?.to?.url.pathname === '/trs/lc_db'}
							<Loader class="animate-spin" stroke-width="5" size={20} />
						{/if}
					</a>
				</nav>
			</nav>
		</div>
	</aside>

	<main class={`${uiStyles.c0020} page-transition-container`}>
		{#key page.url.pathname}
			<div in:slide={{ duration: 180, easing: cubicInOut }} out:slide={{ duration: 120 }}>
				<div
					class="page-transition-content"
					in:fade={{ duration: 180, easing: cubicInOut }}
					out:fade={{ duration: 120 }}
				>
					{@render children()}
				</div>
			</div>
		{/key}
	</main>
</div>
