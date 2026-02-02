<script lang="ts">
	import { toast } from '$lib/stores/toast';
    import {fade} from 'svelte/transition';
    import { X } from 'lucide-svelte';

	const styles = {
		success: 'bg-green-800 text-green-100',
		error: 'bg-red-800 text-red-100',
		info: 'bg-blue-800 text-blue-100',
		warning: 'bg-yellow-800 text-yellow-100'
	};
</script>

<div class="fixed top-8 right-4 z-50 flex flex-col max-w-base gap-3 text-xl">
	{#each $toast as t (t.id)}
		<div
			class={`min-w-[260px] max-w-sm px-4 py-3 rounded shadow-md 
			        ${styles[t.type]}
			        animate-toast-in`}
			in:fade={{ duration: 150 }}
			out:fade={{ duration: 150 }}
		>
			<div class="flex justify-between items-start gap-3">
				<p class="leading-snug">{t.message}</p>

				<button
					class="text-neutral-400 hover:text-white"
					onclick={() => toast.dismiss(t.id)}
				>
					<X size="16" />
				</button>
			</div>
		</div>
	{/each}
</div>
