<script>
	import { Dot } from 'lucide-svelte';

	export let size = 48;
</script>

<div class="flex items-center gap-1">
	<Dot class="animate-bounce" {size} />
	<Dot class="[animation-delay-0.15s] animate-bounce" {size} />
	<Dot class="[animation-delay-0.3s] animate-bounce" {size} />
</div>
