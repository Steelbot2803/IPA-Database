<script lang="ts">
	let { form } = $props();
</script>

<svelte:head>
	<title>Login | TRS</title>
</svelte:head>

<div
	class="mx-auto mt-20 max-w-md rounded-lg border border-neutral-700 bg-neutral-900 p-6 text-white"
>
	<h1 class="mb-4 text-2xl font-semibold">Sign in</h1>
	<form method="POST" class="space-y-4">
		<div>
			<label class="mb-1 block text-sm" for="identifier">Username</label>
			<input
				id="identifier"
				name="identifier"
				type="text"
				required
				autocomplete="username"
				class="w-full rounded border border-neutral-600 bg-neutral-800 px-3 py-2"
			/>
		</div>
		<div>
			<label class="mb-1 block text-sm" for="password">Password</label>
			<input
				id="password"
				name="password"
				type="password"
				required
				autocomplete="current-password"
				class="w-full rounded border border-neutral-600 bg-neutral-800 px-3 py-2"
			/>
		</div>
		{#if form?.error}
			<p class="text-sm text-red-400">{form.error}</p>
		{/if}
		<button
			type="submit"
			class="w-full rounded bg-blue-600 px-4 py-2 font-medium hover:bg-blue-500"
		>
			Sign in
		</button>
	</form>
</div>
