<script lang="ts">
	import EChart from './EChart.svelte';
	import MetricDefinition from '$components/MetricDefinition.svelte';
	import type { HistogramBin } from '$types';

	export let data: HistogramBin[];
	export let title = '等待时间分布';
	export let nodeName = '';
	export let height = '350px';

	let option: any;
	$: option = {
		title: {
			text: title,
			subtext: nodeName ? `环节: ${nodeName}` : '',
			left: 'center',
			textStyle: {
				fontSize: 16,
				fontWeight: 600,
				color: '#1f2937'
			},
			subtextStyle: {
				fontSize: 12,
				color: '#6b7280'
			}
		},
		tooltip: {
			trigger: 'axis',
			axisPointer: {
				type: 'shadow'
			},
			formatter: (params: any) => {
				const p = params[0];
				return `等待时间: ${p.axisValue} 分钟<br/>患者数量: <b>${p.value}</b>`;
			}
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
			data: data.map((d) => `${d.start}-${d.end}`),
			axisLabel: {
				rotate: 45,
				fontSize: 11
			}
		},
		yAxis: {
			type: 'value',
			name: '患者数量',
			axisLabel: {
				fontSize: 11
			}
		},
		series: [
			{
				type: 'bar',
				data: data.map((d, i) => ({
					value: d.count,
					itemStyle: {
						color: getBarColor(i, data.length)
					}
				})),
				barWidth: '80%'
			}
		]
	};

	function getBarColor(index: number, total: number): string {
		const ratio = index / total;
		if (ratio < 0.5) return '#00B42A';
		if (ratio < 0.75) return '#FF7D00';
		return '#F53F3F';
	}
</script>

<div class="card">
	<EChart {option} {height} />
	<div class="mt-4">
		<MetricDefinition
			metricKey="avgWaitTime"
			title="等待时间分布说明"
		/>
	</div>
</div>
