<script>
	import { Dot } from 'lucide-svelte';

	let { size = 48 } = $props();
</script>

<div class="flex items-center">
	<Dot class="animate-dot" {size} />
	<Dot class="animate-dot" style="animation-delay: 150ms;" {size} />
	<Dot class="animate-dot" style="animation-delay: 300ms;" {size} />
</div>
