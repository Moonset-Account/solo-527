<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as echarts from 'echarts';

	export let option: any;
	export let height: string = '400px';
	export let theme: string | undefined = undefined;

	let chartContainer: HTMLDivElement;
	let chart: echarts.ECharts | null = null;

	function initChart() {
		if (!chartContainer) return;
		chart = echarts.init(chartContainer, theme);
		chart.setOption(option);
	}

	function resizeChart() {
		chart?.resize();
	}

	$: if (chart && option) {
		chart.setOption(option, true);
	}

	onMount(() => {
		initChart();
		window.addEventListener('resize', resizeChart);
	});

	onDestroy(() => {
		window.removeEventListener('resize', resizeChart);
		chart?.dispose();
	});
</script>

<div bind:this={chartContainer} style="width: 100%; height: {height};"></div>
