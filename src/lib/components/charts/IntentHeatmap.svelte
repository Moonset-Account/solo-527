<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import * as echarts from 'echarts';
	import type { DimensionDataPoint } from '@/lib/types';
	import { formatNumber, formatPercent, isLowSample } from '@/lib/utils/format';

	const dispatch = createEventDispatcher<{
		select: { dimension: string; value: string };
	}>();

	export let data: DimensionDataPoint[] = [];
	export let title = '意图热度分析';

	let chartContainer: HTMLDivElement;
	let chart: echarts.ECharts | null = null;

	function initChart() {
		if (!chartContainer) return;

		chart = echarts.init(chartContainer);
		updateChart();

		chart.on('click', (params: any) => {
			if (params.dataIndex !== undefined) {
				const point = data[params.dataIndex];
				dispatch('select', { dimension: point.dimension, value: point.dimension_value });
			}
		});
	}

	function updateChart() {
		if (!chart) return;

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
				formatter: (params: any) => {
					const point = data[params.dataIndex];
					const lowSample = isLowSample(point.total_sessions);
					return `
                        <div style="font-weight: 600; margin-bottom: 4px;">${point.dimension_value}</div>
                        <div>会话量: <strong>${formatNumber(point.total_sessions)}</strong></div>
                        <div>转人工率: <strong>${formatPercent(point.transfer_rate)}</strong></div>
                        <div>满意度: <strong>${point.avg_satisfaction.toFixed(2)}</strong></div>
                        <div>平均轮次: <strong>${point.avg_rounds.toFixed(1)}</strong></div>
                        ${lowSample ? '<div style="color: #f59e0b; margin-top: 4px;">⚠️ 样本量不足</div>' : ''}
                    `;
				}
			},
			grid: {
				left: '3%',
				right: '4%',
				bottom: '10%',
				top: 60,
				containLabel: true
			},
			xAxis: {
				type: 'value',
				name: '转人工率',
				axisLabel: {
					formatter: (value: number) => `${(value * 100).toFixed(0)}%`
				}
			},
			yAxis: {
				type: 'value',
				name: '会话量',
				axisLabel: {
					formatter: (value: number) => formatNumber(value)
				}
			},
			series: [
				{
					type: 'scatter',
					symbolSize: (value: number[], params: any) => {
						const point = data[params.dataIndex];
						const baseSize = 15;
						const size = baseSize + point.avg_satisfaction * 5;
						return size;
					},
					data: data.map((point) => {
						const isHighTransfer = point.transfer_rate > 0.3;
						const isLow = isLowSample(point.total_sessions);
						return {
							value: [point.transfer_rate, point.total_sessions],
							name: point.dimension_value,
							itemStyle: {
								color: isHighTransfer
									? isLow
										? '#f59e0b'
										: '#ef4444'
									: isLow
										? '#94a3b8'
										: '#0ea5e9'
							}
						};
					}),
					emphasis: {
						itemStyle: {
							shadowBlur: 10,
							shadowColor: 'rgba(0, 0, 0, 0.3)'
						}
					}
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

<div bind:this={chartContainer} class="chart-container w-full h-[350px]" />

<div class="mt-2 flex gap-4 text-xs text-slate-500 justify-center">
	<div class="flex items-center gap-1">
		<span class="w-3 h-3 rounded-full bg-cyan-500"></span>
		正常
	</div>
	<div class="flex items-center gap-1">
		<span class="w-3 h-3 rounded-full bg-red-500"></span>
		高转人工率
	</div>
	<div class="flex items-center gap-1">
		<span class="w-3 h-3 rounded-full bg-amber-500"></span>
		高转人工+低样本
	</div>
	<div class="flex items-center gap-1">
		<span class="w-3 h-3 rounded-full bg-slate-400"></span>
		低样本
	</div>
</div>
