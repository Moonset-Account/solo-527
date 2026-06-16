<script lang="ts">
	import '../app.css';
	import AppNav from '$lib/components/AppNav.svelte';
</script>

<AppNav />

<div class="relative min-h-screen">
	<slot />
</div>
