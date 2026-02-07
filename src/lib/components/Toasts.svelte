<script lang="ts">
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

<div class="max-w-base fixed top-8 right-4 z-50 flex flex-col gap-3 text-xl">
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
			<div class="flex items-start justify-between gap-3">
				<p class="leading-snug">{t.message}</p>

				<button class="text-neutral-200 hover:text-white" onclick={() => toast.dismiss(t.id)}>
					<X size="16" />
				</button>
			</div>

			<div
				class="absolute bottom-0 left-0 h-1 bg-neutral-400"
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
