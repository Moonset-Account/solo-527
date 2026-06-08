<script lang="ts">
	import * as echarts from 'echarts';
	import { onMount } from 'svelte';
	import type { PathFlowNode, PathFlowLink } from '$lib/types';
	import { sankeyOption } from '$lib/chart-options';
	import { filterStore } from '$lib/store';
	import type { FilterState } from '$lib/types';

	let { nodes = $bindable([]), links = $bindable([]), loading = false } = $props();

	let chartEl: HTMLDivElement;
	let chartInstance: echarts.ECharts | null = null;
	let currentVersion = $state('latest');

	function renderChart() {
		if (!chartInstance || nodes.length === 0) return;

		let filteredLinks = links;
		let filteredNodes = nodes;

		if (currentVersion !== 'latest') {
			const activeNodeNames = new Set<string>();
			filteredLinks.forEach((l) => {
				activeNodeNames.add(l.source);
				activeNodeNames.add(l.target);
			});
			filteredNodes = nodes.filter((n) => activeNodeNames.has(n.name));
		}

		chartInstance.setOption(sankeyOption(filteredNodes, filteredLinks), true);
	}

	$effect(() => {
		if (nodes.length > 0 || links.length > 0) {
			renderChart();
		}
	});

	onMount(() => {
		chartInstance = echarts.init(chartEl);
		const ro = new ResizeObserver(() => chartInstance?.resize());
		ro.observe(chartEl);
		return () => {
			ro.disconnect();
			chartInstance?.dispose();
			chartInstance = null;
		};
	});

	function handleVersionChange(v: string) {
		currentVersion = v;

		const current = filterStore.getCurrent();
		let newVersions: string[];

		if (v === 'latest') {
			newVersions = [];
		} else {
			newVersions = [v];
		}

		const updated: FilterState = {
			...current,
			versions: newVersions
		};
		filterStore.set(updated);
	}
</script>

<div class="chart-card">
	<div class="chart-toolbar">
		<span class="chart-title">学习路径流向</span>
		<div class="version-switch">
			<span class="version-label">章节版本:</span>
			<select onchange={(e) => handleVersionChange((e.target as HTMLSelectElement).value)} value={currentVersion}>
				<option value="latest">全部版本</option>
				<option value="1.0">v1.0</option>
				<option value="1.1">v1.1</option>
				<option value="2.0">v2.0</option>
			</select>
		</div>
	</div>
	<div bind:this={chartEl} class="chart-container"></div>
	{#if loading}
		<div class="chart-loading">加载中...</div>
	{/if}
</div>

<style>
	.chart-card {
		background: #fff;
		border: 1px solid #e8e8e8;
		border-radius: 8px;
		overflow: hidden;
		position: relative;
	}

	.chart-toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 10px 16px;
		border-bottom: 1px solid #f0f0f0;
	}

	.chart-title {
		font-size: 13px;
		font-weight: 600;
		color: #333;
	}

	.version-switch {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.version-label {
		font-size: 11px;
		color: #999;
	}

	.version-switch select {
		padding: 2px 8px;
		border: 1px solid #d9d9d9;
		border-radius: 4px;
		font-size: 11px;
		background: #fff;
	}

	.chart-container {
		width: 100%;
		height: 360px;
	}

	.chart-loading {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-size: 12px;
		color: #1890ff;
	}
</style>
