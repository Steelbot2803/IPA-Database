<script>
	import { Dot } from 'lucide-svelte';

	let { size = 24 } = $props();
</script>

<div class="flex cursor-not-allowed items-center">
	Saving
	<Dot class="animate-dot" {size} />
	<Dot class="animate-dot" style="animation-delay: 150ms;" {size} />
	<Dot class="animate-dot" style="animation-delay: 300ms;" {size} />
</div>
