<script lang="ts">
	import { goto } from '$app/navigation';

	onMount(() => {
		goto('/dashboard');
	});

	import { onMount } from 'svelte';
</script>

<div class="min-h-screen flex items-center justify-center bg-slate-50">
	<div class="text-center">
		<div class="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
		<p class="text-slate-600">正在跳转...</p>
	</div>
</div>
