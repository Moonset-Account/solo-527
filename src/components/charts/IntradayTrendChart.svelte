<script lang="ts">
	import EChart from './EChart.svelte';
	import MetricDefinition from '$components/MetricDefinition.svelte';
	import type { IntradayTrendPoint } from '$types';

	export let data: IntradayTrendPoint[];
	export let title = '日内等待时间趋势';
	export let height = '350px';

	let option: any;
	$: option = {
		title: {
			text: title,
			left: 'center',
			textStyle: {
				fontSize: 16,
				fontWeight: 600,
				color: '#1f2937'
			}
		},
		tooltip: {
			trigger: 'axis',
			axisPointer: {
				type: 'cross'
			},
			formatter: (params: any) => {
				const wait = params.find((p: any) => p.seriesName === '平均等待时间');
				const count = params.find((p: any) => p.seriesName === '就诊人数');
				const item = data.find((d) => d.hour === params[0].axisValue);
				if (!item) return '';
				return `<b>${item.hour}:00 - ${item.hour + 1}:00</b> (${item.timeSlot})<br/>
						平均等待: <b>${item.avgWaitTime} 分钟</b><br/>
						就诊人数: ${item.patientCount} 人`;
			}
		},
		legend: {
			data: ['平均等待时间', '就诊人数'],
			top: 30
		},
		grid: {
			left: '3%',
			right: '4%',
			bottom: '3%',
			top: '80px',
			containLabel: true
		},
		xAxis: {
			type: 'category',
			data: data.map((d) => `${d.hour}:00`),
			axisLabel: {
				fontSize: 11
			}
		},
		yAxis: [
			{
				type: 'value',
				name: '分钟',
				position: 'left',
				axisLabel: {
					fontSize: 11
				}
			},
			{
				type: 'value',
				name: '人数',
				position: 'right',
				axisLabel: {
					fontSize: 11
				}
			}
		],
		series: [
			{
				name: '平均等待时间',
				type: 'line',
				yAxisIndex: 0,
				data: data.map((d) => d.avgWaitTime),
				smooth: true,
				symbol: 'circle',
				symbolSize: 6,
				lineStyle: {
					width: 2,
					color: '#165DFF'
				},
				itemStyle: {
					color: '#165DFF'
				},
				areaStyle: {
					color: {
						type: 'linear',
						x: 0,
						y: 0,
						x2: 0,
						y2: 1,
						colorStops: [
							{ offset: 0, color: 'rgba(22, 93, 255, 0.3)' },
							{ offset: 1, color: 'rgba(22, 93, 255, 0.05)' }
						]
					}
				},
				markArea: {
					silent: true,
					itemStyle: {
						opacity: 0.2
					},
					data: [
						[
							{ name: '上午高峰', xAxis: '8:00', itemStyle: { color: '#FF7D00' } },
							{ xAxis: '10:00' }
						],
						[
							{ name: '下午高峰', xAxis: '14:00', itemStyle: { color: '#FF7D00' } },
							{ xAxis: '16:00' }
						]
					]
				}
			},
			{
				name: '就诊人数',
				type: 'bar',
				yAxisIndex: 1,
				data: data.map((d) => d.patientCount),
				itemStyle: {
					color: 'rgba(114, 46, 209, 0.5)'
				},
				barWidth: '40%'
			}
		]
	};
</script>

<div class="card">
	<EChart {option} {height} />
	<div class="mt-4">
		<MetricDefinition
			title="日内趋势说明"
			customDefinition={{
				key: 'intraday',
				name: '日内等待趋势',
				definition: '展示一天内不同时段的平均等待时间变化规律和患者就诊数量分布。',
				calculation: '按就诊小时分组，统计该小时内所有就诊记录的平均等待时间和总人次。',
				limitations: [
					'橙色区域标注为历史高峰时段，仅供参考',
					'等待时间受当日排班、突发情况等因素影响',
					'凌晨时段数据较少，统计结果可能不稳定'
				]
			}}
		/>
	</div>
</div>
