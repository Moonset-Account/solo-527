<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as echarts from 'echarts';
	import type { ActivityTypeFunnel } from '$lib/types';

	export let data: ActivityTypeFunnel[] = [];
	export let title = '各活动类型转化对比';

	let chartContainer: HTMLDivElement;
	let chart: echarts.ECharts | null = null;

	onMount(() => {
		if (chartContainer) {
			chart = echarts.init(chartContainer);
			updateChart();
			window.addEventListener('resize', handleResize);
		}
	});

	onDestroy(() => {
		chart?.dispose();
		window.removeEventListener('resize', handleResize);
	});

	function handleResize() {
		chart?.resize();
	}

	$: if (chart && data.length > 0) {
		updateChart();
	}

	function updateChart() {
		if (!chart) return;

		const categories = data.map((d) => d.name);
		const registerData = data.map((d) => d.funnel[1]);
		const checkinData = data.map((d) => d.funnel[2]);

		const option: echarts.EChartsOption = {
			tooltip: {
				trigger: 'axis',
				axisPointer: {
					type: 'shadow'
				}
			},
			legend: {
				data: ['报名人数', '签到人数'],
				top: 0
			},
			grid: {
				left: '3%',
				right: '4%',
				bottom: '3%',
				top: '15%',
				containLabel: true
			},
			xAxis: {
				type: 'category',
				data: categories,
				axisLabel: {
					rotate: 30,
					fontSize: 11
				}
			},
			yAxis: {
				type: 'value'
			},
			series: [
				{
					name: '报名人数',
					type: 'bar',
					data: registerData,
					itemStyle: {
						color: '#3b82f6'
					}
				},
				{
					name: '签到人数',
					type: 'bar',
					data: checkinData,
					itemStyle: {
						color: '#1e3a5f'
					}
				}
			]
		};

		chart.setOption(option, true);
	}
</script>

<div class="card p-4">
	<h3 class="font-semibold text-gray-800 mb-3">{title}</h3>
	<div bind:this={chartContainer} class="w-full h-72"></div>
</div>
