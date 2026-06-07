<script lang="ts">
	import EChart from './EChart.svelte';
	import MetricDefinition from '$components/MetricDefinition.svelte';
	import type { DepartmentCompareItem } from '$types';

	export let data: DepartmentCompareItem[];
	export let title = '各科室等待时间对比';
	export let height = '400px';

	$: sortedData = [...data].sort((a, b) => b.avgWaitTime - a.avgWaitTime);

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
				type: 'shadow'
			},
			formatter: (params: any) => {
				const avg = params.find((p: any) => p.seriesName === '平均等待时间');
				const item = sortedData.find((d) => d.department === params[0].axisValue);
				if (!item) return '';
				return `<b>${item.department}</b><br/>
						平均等待: <b>${item.avgWaitTime} 分钟</b><br/>
						中位等待: ${item.medianWaitTime} 分钟<br/>
						就诊人数: ${item.patientCount} 人<br/>
						瓶颈环节: ${item.bottleneckNode}`;
			}
		},
		legend: {
			data: ['平均等待时间', '中位等待时间'],
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
			data: sortedData.map((d) => d.department),
			axisLabel: {
				rotate: 30,
				fontSize: 11
			}
		},
		yAxis: {
			type: 'value',
			name: '分钟',
			axisLabel: {
				fontSize: 11
			}
		},
		series: [
			{
				name: '平均等待时间',
				type: 'bar',
				data: sortedData.map((d) => ({
					value: d.avgWaitTime,
					itemStyle: {
						color: d.avgWaitTime > 40 ? '#F53F3F' : d.avgWaitTime > 25 ? '#FF7D00' : '#165DFF'
					}
				})),
				barWidth: '40%'
			},
			{
				name: '中位等待时间',
				type: 'bar',
				data: sortedData.map((d) => d.medianWaitTime),
				itemStyle: {
					color: '#722ED1'
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
			title="科室对比说明"
			customDefinition={{
				key: 'dept-compare',
				name: '科室等待时间对比',
				definition: '对比各科室从挂号到叫号的平均和中位等待时间，帮助识别效率较低的科室。',
				calculation: '按科室分组统计，计算挂号到叫号环节的等待时间平均值和中位数。',
				limitations: [
					'不同科室业务性质不同，跨科室对比需结合业务特点',
					'患者数量较少的科室统计结果可能波动较大',
					'瓶颈环节为该科室平均等待最长的子环节'
				]
			}}
		/>
	</div>
</div>
