<script lang="ts">
	import { styles as uiStyles } from '$lib/utils/styles';
	import { toast } from '$lib/utils/toast';
	import { enhance } from '$app/forms';
	import { LoaderIcon } from 'lucide-svelte';
	export let form;
	let loggingIn = false;
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
				placeholder="Username/Email"
				autocomplete="username"
				class="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
			/>
		</div>
		<div>
			<input
				id="password"
				name="password"
				type="password"
				required
				placeholder="Password"
				autocomplete="current-password"
				class="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
			/>
		</div>
		{#if loggingIn}
			<div class="flex items-center justify-center">
				<LoaderIcon class="animate-spin" size={32} />
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
