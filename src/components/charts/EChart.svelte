<script lang="ts">
	import { onMount, onDestroy, beforeUpdate } from 'svelte';
	import * as echarts from 'echarts';

	export let option: any;
	export let height = '400px';
	export let theme: 'light' | 'dark' = 'light';

	let chartContainer: HTMLDivElement;
	let chart: echarts.ECharts | null = null;

	function initChart() {
		if (!chartContainer) return;

		if (chart) {
			chart.dispose();
		}

		chart = echarts.init(chartContainer, theme);
		chart.setOption(option);

		const resizeObserver = new ResizeObserver(() => {
			chart?.resize();
		});
		resizeObserver.observe(chartContainer);
	}

	$: if (chart && option) {
		chart.setOption(option, true);
	}

	onMount(() => {
		initChart();
		window.addEventListener('resize', handleResize);
	});

	onDestroy(() => {
		window.removeEventListener('resize', handleResize);
		if (chart) {
			chart.dispose();
			chart = null;
		}
	});

	function handleResize() {
		chart?.resize();
	}
</script>

<div bind:this={chartContainer} style="width: 100%; height: {height};" />
