<script>
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	onMount(() => {
		if (browser) {
			goto('/tasks');
		}
	});
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50">
	<p class="text-gray-500">正在跳转...</p>
</div>
