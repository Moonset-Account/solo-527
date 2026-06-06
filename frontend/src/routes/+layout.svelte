<script>
	import '../app.css';
	import Layout from '$lib/components/Layout.svelte';
	import { page } from '$app/stores';
</script>

{#if $page.url.pathname === '/login'}
	<slot />
{:else}
	<Layout>
		<slot />
	</Layout>
{/if}
