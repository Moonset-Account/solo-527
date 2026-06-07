<script lang="ts">
	import { onMount } from 'svelte';
	import * as echarts from 'echarts';
	import type { EChartsOption } from 'echarts';

	let { option, class: className = '', style = '', onclick }: {
		option: EChartsOption;
		class?: string;
		style?: string;
		onclick?: (params: any) => void;
	} = $props();

	let chartEl: HTMLDivElement;
	let chart: echarts.ECharts | null = null;

	onMount(() => {
		chart = echarts.init(chartEl);
		chart.setOption(option);
		if (onclick) {
			chart.on('click', (params) => onclick(params));
		}
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
