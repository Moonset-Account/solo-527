<script lang="ts">
	import { onMount, onDestroy, afterUpdate } from 'svelte';
	import * as echarts from 'echarts';
	import type { EChartsOption } from 'echarts';

	export let option: EChartsOption;
	export let height = '400px';
	export let width = '100%';

	let chartContainer: HTMLDivElement;
	let chart: echarts.ECharts | null = null;

	function initChart() {
		if (chartContainer) {
			chart = echarts.init(chartContainer);
			chart.setOption(option);
		}
	}

	function resizeChart() {
		chart?.resize();
	}

	onMount(() => {
		initChart();
		window.addEventListener('resize', resizeChart);
	});

	afterUpdate(() => {
		if (chart) {
			chart.setOption(option, true);
		}
	});

	onDestroy(() => {
		window.removeEventListener('resize', resizeChart);
		chart?.dispose();
	});
</script>

<div bind:this={chartContainer} style="width: {width}; height: {height};" />
