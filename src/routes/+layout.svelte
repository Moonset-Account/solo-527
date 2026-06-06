<script lang="ts">
	import '../app.css';
	import Sidebar from '$lib/components/Sidebar.svelte';
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex">
	<Sidebar />
	<main class="flex-1 ml-64 p-8">
		<slot />
	</main>
</div>
