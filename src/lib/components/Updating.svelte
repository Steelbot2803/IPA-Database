<script>
	import { Dot } from 'lucide-svelte';

	export let size = 24;
</script>

<div class="flex cursor-not-allowed items-center">
	Updating
	<Dot class="animate-dot" {size} />
	<Dot class="animate-dot" style="animation-delay: 150ms;" {size} />
	<Dot class="animate-dot" style="animation-delay: 300ms;" {size} />
</div>
