<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as echarts from 'echarts';
	import type { FunnelStage } from '$lib/types';

	export let data: FunnelStage[] = [];

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

		const funnelData = data.map((item) => ({
			name: `${item.name} (${item.count.toLocaleString()})`,
			value: item.count
		}));

		const option: echarts.EChartsOption = {
			tooltip: {
				trigger: 'item',
				formatter: (params: any) => {
					const stage = data.find((s) => s.name === params.name.split(' ')[0]);
					if (!stage) return params.name;
					return `
                        <div class="font-medium">${stage.name}</div>
                        <div>人数: ${stage.count.toLocaleString()}</div>
                        <div>上层转化率: ${stage.rate.toFixed(1)}%</div>
                        <div>总转化率: ${stage.totalRate.toFixed(1)}%</div>
                    `;
				}
			},
			legend: {
				show: false
			},
			series: [
				{
					name: '转化漏斗',
					type: 'funnel',
					left: '10%',
					top: 20,
					bottom: 20,
					width: '80%',
					min: 0,
					max: Math.max(...data.map((d) => d.count)),
					minSize: '20%',
					maxSize: '100%',
					sort: 'descending',
					gap: 3,
					label: {
						show: true,
						position: 'inside',
						formatter: '{b}',
						fontSize: 14,
						fontWeight: 500,
						color: '#fff'
					},
					labelLine: {
						length: 10,
						lineStyle: {
							width: 1,
							type: 'solid'
						}
					},
					itemStyle: {
						borderColor: '#fff',
						borderWidth: 1
					},
					emphasis: {
						label: {
							fontSize: 16
						}
					},
					data: funnelData,
					color: ['#1e3a5f', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd']
				}
			]
		};

		chart.setOption(option, true);
	}
</script>

<div bind:this={chartContainer} class="w-full h-96"></div>
