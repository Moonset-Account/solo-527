<script lang="ts">
	import * as echarts from 'echarts';
	import { onMount } from 'svelte';
	import type { HeatmapData } from '$lib/types';
	import { heatmapOption } from '$lib/chart-options';
	import { getChapterList } from '$lib/db';

	let { data = $bindable([]), loading = false } = $props();

	let chartEl: HTMLDivElement;
	let chart: echarts.ECharts | null = null;

	$effect(() => {
		if (chart && data.length > 0) {
			const chapters = getChapterList();
			chart.setOption(heatmapOption(data, chapters), true);
		}
	});

	onMount(() => {
		chart = echarts.init(chartEl);
		const ro = new ResizeObserver(() => chart?.resize());
		ro.observe(chartEl);
		return () => {
			ro.disconnect();
			chart?.dispose();
			chart = null;
		};
	});
</script>

<div class="chart-card">
	<div class="chart-toolbar">
		<span class="chart-title">错题热力图</span>
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

	.chart-container {
		width: 100%;
		height: 380px;
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
