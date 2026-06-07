<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as echarts from 'echarts';
	import type { TrendDataPoint } from '@/lib/types';
	import { formatPercent } from '@/lib/utils/format';

	export let data: TrendDataPoint[] = [];
	export let title = '满意度与转人工率趋势';

	let chartContainer: HTMLDivElement;
	let chart: echarts.ECharts | null = null;

	function initChart() {
		if (!chartContainer) return;

		chart = echarts.init(chartContainer);
		updateChart();
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
				trigger: 'axis',
				axisPointer: {
					type: 'cross'
				},
				formatter: (params: any) => {
					const time = params[0].axisValue;
					let html = `<div style="font-weight: 600; margin-bottom: 8px;">${time}</div>`;
					params.forEach((p: any) => {
						const value = p.seriesName === '转人工率' ? formatPercent(p.value) : p.value.toFixed(2);
						html += `<div style="display: flex; align-items: center; gap: 8px;">
                            <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${p.color};"></span>
                            <span>${p.seriesName}:</span>
                            <strong>${value}</strong>
                        </div>`;
					});
					return html;
				}
			},
			legend: {
				data: ['满意度', '转人工率', '会话量'],
				top: 30
			},
			grid: {
				left: '3%',
				right: '4%',
				bottom: '3%',
				top: 80,
				containLabel: true
			},
			xAxis: {
				type: 'category',
				boundaryGap: false,
				data: data.map((d) => d.time),
				axisLabel: {
					rotate: 45,
					fontSize: 11
				}
			},
			yAxis: [
				{
					type: 'value',
					name: '满意度',
					min: 0,
					max: 5,
					position: 'left',
					axisLine: {
						lineStyle: {
							color: '#10b981'
						}
					},
					axisLabel: {
						formatter: '{value}'
					}
				},
				{
					type: 'value',
					name: '转人工率',
					min: 0,
					max: 0.6,
					position: 'right',
					axisLine: {
						lineStyle: {
							color: '#ef4444'
						}
					},
					axisLabel: {
						formatter: (value: number) => `${(value * 100).toFixed(0)}%`
					}
				}
			],
			series: [
				{
					name: '满意度',
					type: 'line',
					yAxisIndex: 0,
					smooth: true,
					data: data.map((d) => d.avg_satisfaction),
					itemStyle: {
						color: '#10b981'
					},
					areaStyle: {
						color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
							{ offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
							{ offset: 1, color: 'rgba(16, 185, 129, 0.05)' }
						])
					}
				},
				{
					name: '转人工率',
					type: 'line',
					yAxisIndex: 1,
					smooth: true,
					data: data.map((d) => d.transfer_rate),
					itemStyle: {
						color: '#ef4444'
					},
					areaStyle: {
						color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
							{ offset: 0, color: 'rgba(239, 68, 68, 0.2)' },
							{ offset: 1, color: 'rgba(239, 68, 68, 0.02)' }
						])
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
