<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as echarts from 'echarts';
	import type { FunnelDataPoint } from '@/lib/types';
	import { formatNumber, formatPercent } from '@/lib/utils/format';

	export let data: FunnelDataPoint[] = [];
	export let title = '转人工漏斗';

	let chartContainer: HTMLDivElement;
	let chart: echarts.ECharts | null = null;

	function initChart() {
		if (!chartContainer) return;

		chart = echarts.init(chartContainer);
		updateChart();
	}

	function updateChart() {
		if (!chart) return;

		const colors = ['#0c87f0', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981'];

		const option: echarts.EChartsOption = {
			title: {
				text: title,
				left: 'center',
				textStyle: {
					fontSize: 16,
					fontWeight: 600,
					color: '#0f172a'
				}
			},
			tooltip: {
				trigger: 'item',
				formatter: (params: any) => {
					const point = data[params.dataIndex];
					return `
                        <div style="font-weight: 600; margin-bottom: 4px;">${params.name}</div>
                        <div>会话量: <strong>${formatNumber(params.value)}</strong></div>
                        ${point.rate !== undefined ? `<div>转化率: <strong>${formatPercent(point.rate)}</strong></div>` : ''}
                    `;
				}
			},
			legend: {
				top: 30,
				data: data.map((d) => d.name)
			},
			series: [
				{
					name: '转化漏斗',
					type: 'funnel',
					left: '10%',
					top: 80,
					bottom: 20,
					width: '80%',
					min: 0,
					max: Math.max(...data.map((d) => d.value)),
					minSize: '20%',
					maxSize: '100%',
					sort: 'descending',
					gap: 2,
					label: {
						show: true,
						position: 'inside',
						formatter: (params: any) => {
							const point = data[params.dataIndex];
							return `${params.name}\n${formatNumber(params.value)}${point.rate !== undefined ? ` (${formatPercent(point.rate)})` : ''}`;
						},
						color: '#fff',
						fontSize: 12,
						fontWeight: 500
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
						borderWidth: 2
					},
					emphasis: {
						label: {
							fontSize: 14
						}
					},
					data: data.map((d, i) => ({
						value: d.value,
						name: d.name,
						itemStyle: {
							color: colors[i % colors.length]
						}
					}))
				}
			]
		};

		chart.setOption(option);
	}

	function handleResize() {
		chart?.resize();
	}

	$: if (chart && data) {
		updateChart();
	}

	onMount(() => {
		initChart();
		window.addEventListener('resize', handleResize);
	});

	onDestroy(() => {
		window.removeEventListener('resize', handleResize);
		chart?.dispose();
	});
</script>

<div bind:this={chartContainer} class="chart-container w-full h-[400px]" />
