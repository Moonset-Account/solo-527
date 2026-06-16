<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import AppNav from '$lib/components/AppNav.svelte';
	import { store } from '$lib/stores/mock-data.svelte';

	onMount(async () => {
		if (!store.initialized) {
			await store.loadAll();
		}
	});
</script>

<AppNav />

<div class="relative min-h-screen">
	<slot />
</div>
