<script lang="ts">
	import './layout.css';
	import Navbar from '$lib/components/Navbar.svelte';
	import FilterPanel from '$lib/components/FilterPanel.svelte';
	import { ensureDB, loadMockData } from '$lib/duckdb-service';
	import { onMount } from 'svelte';

	let { children } = $props();
	let loading = $state(true);
	let error = $state('');

	onMount(async () => {
		try {
			await ensureDB();
			await loadMockData();
		} catch (e: any) {
			error = e.message || '数据加载失败';
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;600;700&family=Noto+Serif+SC:wght@600;700&display=swap" rel="stylesheet" />
</svelte:head>

<div class="min-h-screen bg-[#F8F9FA]">
	<Navbar />
	{#if loading}
		<div class="flex items-center justify-center h-[calc(100vh-56px)]">
			<div class="text-center">
				<div class="w-10 h-10 border-3 border-[#1B4332] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
				<p class="text-sm text-gray-500">正在加载 DuckDB 数据引擎...</p>
			</div>
		</div>
	{:else if error}
		<div class="flex items-center justify-center h-[calc(100vh-56px)]">
			<div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-md">
				<p class="text-sm text-red-600 font-medium">数据加载失败</p>
				<p class="text-xs text-red-400 mt-1">{error}</p>
			</div>
		</div>
	{:else}
		<div class="flex" style="height: calc(100vh - 56px)">
			<FilterPanel />
			<main class="flex-1 overflow-y-auto p-5">
				{@render children()}
			</main>
		</div>
	{/if}
</div>
