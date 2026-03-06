<script>
	import { Dot } from 'lucide-svelte';

	export let size = 36;
</script>

<div class="flex items gap-1">
    Updating
	<Dot class="animate-bounce" {size} />
	<Dot class="[animation-delay-0.15s] animate-bounce" {size} />
	<Dot class="[animation-delay-0.3s] animate-bounce" {size} />
</div>
