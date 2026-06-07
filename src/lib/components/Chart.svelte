<script lang="ts">
	import { onMount } from 'svelte';
	import * as echarts from 'echarts';
	import type { EChartsOption } from 'echarts';

	let { option, class: className = '', style = '' }: {
		option: EChartsOption;
		class?: string;
		style?: string;
	} = $props();

	let chartEl: HTMLDivElement;
	let chart: echarts.ECharts | null = null;

	onMount(() => {
		chart = echarts.init(chartEl);
		chart.setOption(option);
		const ro = new ResizeObserver(() => chart?.resize());
		ro.observe(chartEl);
		return () => {
			ro.disconnect();
			chart?.dispose();
		};
	});

	$effect(() => {
		if (chart && option) {
			chart.setOption(option, { notMerge: true });
		}
	});
</script>

<div bind:this={chartEl} class={className} {style}></div>
