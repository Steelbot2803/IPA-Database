<script lang="ts">
	import { styles as uiStyles } from '$lib/utils/styles';
	import { toast } from '$lib/utils/toast';
	import { enhance } from '$app/forms';
	import { Eye, EyeOff } from 'lucide-svelte';
	import LoaderDots from '$lib/components/Loading.svelte';
	export let form;
	let loggingIn = false;
	let showPassword = false;
	$: if (form?.error) {
		toast.show(form.error, 'error', 5000);
	}
</script>

<svelte:head>
	<title>Login | TRS</title>
</svelte:head>

<h1 class={uiStyles.c0021}>TRS</h1>

<div
	class="mx-auto mt-20 max-w-md rounded-md border-2 border-neutral-700 bg-neutral-900 p-6 text-neutral-200"
>
	<form
		method="POST"
		class="space-y-4"
		use:enhance={() => {
			loggingIn = true;

			return async ({ update }) => {
				await update();
				loggingIn = false;
			};
		}}
	>
		<div>
			<input
				id="identifier"
				name="identifier"
				type="text"
				required
				autocapitalize="none"
				spellcheck="false"
				placeholder="Email"
				autocomplete="username"
				class="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
			/>
		</div>
		<div class="relative">
			<input
				id="password"
				name="password"
				type={showPassword ? 'text' : 'password'}
				required
				placeholder="Password"
				autocomplete="current-password"
				class="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 pr-12 text-neutral-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
			/>
			<button
				type="button"
				aria-label={showPassword ? 'Hide password' : 'Show password'}
				onclick={() => {
					showPassword = !showPassword;
				}}
				class="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-neutral-400 transition hover:text-neutral-200"
			>
				{#if showPassword}
					<EyeOff size={18} />
				{:else}
					<Eye size={18} />
				{/if}
			</button>
		</div>
		{#if loggingIn}
			<div class="flex items-center justify-center text-cyan-500">
				<LoaderDots />
			</div>
		{:else}
			<button
				type="submit"
				class="font-5xl w-full cursor-pointer rounded-md border-2 border-neutral-700 bg-neutral-800 px-4 py-2 transition hover:border-blue-700 hover:bg-blue-800"
			>
				Sign in
			</button>
		{/if}
	</form>
</div>
