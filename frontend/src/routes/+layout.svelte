<script lang="ts">
	import '../app.css';
	import Layout from '$lib/components/Layout.svelte';
	import { page } from '$app/stores';
	import { auth } from '$lib/stores/auth';
</script>

{#if $page.url.pathname === '/login'}
	<slot />
{:else}
	<Layout>
		<slot />
	</Layout>
{/if}
