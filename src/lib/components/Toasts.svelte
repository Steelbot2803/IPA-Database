<script lang="ts">
	import { styles as uiStyles } from '$lib/utils/styles';
	import { toast } from '$lib/utils/toast';
	import { fade } from 'svelte/transition';
	import { X } from 'lucide-svelte';

	const styles = {
		success: 'bg-green-800 text-green-100',
		error: 'bg-red-800 text-red-100',
		info: 'bg-blue-800 text-blue-100',
		warning: 'bg-yellow-800 text-yellow-100'
	};
</script>

<div class={uiStyles.c0001}>
	{#each $toast as t (t.id)}
		<div
			role="status"
			class={`relative max-w-sm min-w-[260px] overflow-hidden rounded px-4 py-3 shadow-md 
			        ${styles[t.type]}
			        animate-toast-in`}
			onmouseenter={() => toast.pause(t.id)}
			onmouseleave={() => toast.resume(t.id)}
			in:fade={{ duration: 200 }}
			out:fade={{ duration: 200 }}
		>
			<div class={uiStyles.c0002}>
				<p class={uiStyles.c0003}>{t.message}</p>

				<button class={uiStyles.c0004} onclick={() => toast.dismiss(t.id)}>
					<X size="16" />
				</button>
			</div>

			<div
				class={uiStyles.c0005}
				style={`animation: shrink ${t.remaining}ms linear forwards`}
			></div>
		</div>
	{/each}
</div>

<style>
	@keyframes shrink {
		from {
			width: 100%;
		}
		to {
			width: 0%;
		}
	}
</style>
