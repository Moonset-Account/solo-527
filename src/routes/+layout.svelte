<script lang="ts">
	import '../app.css';
	import Navbar from '$components/Navbar.svelte';
</script>

<div class="min-h-screen bg-gray-50">
	<Navbar />
	<main class="container mx-auto px-4 py-6 max-w-7xl">
		<slot />
	</main>
</div>
