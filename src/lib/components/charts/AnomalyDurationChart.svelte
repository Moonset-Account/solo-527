<script lang="ts">
	import EChart from './EChart.svelte';
	import type { AnomalyDurationStats } from '$lib/types';
	import { getAnomalyTypeLabel, formatDuration } from '$lib/utils/format';

	export let data: AnomalyDurationStats[] = [];

	$: chartOption = {
		tooltip: {
			trigger: 'item',
			backgroundColor: 'rgba(255, 255, 255, 0.98)',
			borderColor: '#e2e8f0',
			borderWidth: 1,
			textStyle: { color: '#334155' },
			formatter: function (params: any) {
				if (params.seriesType === 'sunburst') {
					return `<div style="font-weight: 600; margin-bottom: 4px;">${params.name}</div>
						<div>总时长: <strong>${formatDuration(params.value)}</strong></div>
						<div>异常次数: <strong>${params.data.count || 0} 次</strong></div>
						<div>占比: <strong>${params.percent}%</strong></div>`;
				}
				return `<div style="font-weight: 600; margin-bottom: 4px;">${params.name}</div>
					<div>总时长: <strong>${formatDuration(params.value)}</strong></div>
					<div>占比: <strong>${params.percent}%</strong></div>`;
			}
		},
		legend: {
			type: 'scroll',
			bottom: 0,
			data: data.map((d) => d.label)
		},
		series: [
			{
				name: '异常时长分布',
				type: 'sunburst',
				radius: ['15%', '70%'],
				center: ['50%', '45%'],
				sort: 'desc',
				emphasis: {
					focus: 'ancestor'
				},
				data: data.map((d) => ({
					name: d.label,
					value: d.totalMinutes,
					itemStyle: { color: d.color },
					count: d.count,
					children: d.children?.map((c) => ({
						name: c.label,
						value: c.totalMinutes,
						itemStyle: { color: c.color },
						count: c.count
					}))
				})),
				levels: [
					{},
					{
						r0: '15%',
						r: '40%',
						itemStyle: {
							borderWidth: 2,
							borderColor: '#fff'
						},
						label: {
							rotate: 'tangential',
							fontSize: 12,
							fontWeight: 500
						}
					},
					{
						r0: '40%',
						r: '70%',
						itemStyle: {
							borderWidth: 1,
							borderColor: '#fff'
						},
						label: {
							position: 'outside',
							padding: 3,
							silent: false
						}
					}
				]
			}
		]
	};
</script>

<div class="card">
	<div class="card-header">
		<h3 class="text-base font-semibold text-slate-800">异常时长统计</h3>
		<p class="text-sm text-slate-500 mt-1">按异常类型和严重程度分层统计时长分布</p>
	</div>
	<div class="card-body">
		{#if data.length === 0}
			<div class="empty-state">
				<svg class="w-16 h-16 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
				</svg>
				<p class="text-sm font-medium">暂无异常统计数据</p>
				<p class="text-xs text-slate-400 mt-1">系统将在导入数据后自动统计</p>
			</div>
		{:else}
			<EChart option={chartOption} height="380px" />
		{/if}
	</div>
</div>
