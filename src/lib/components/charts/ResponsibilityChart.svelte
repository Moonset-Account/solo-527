<script lang="ts">
	import EChart from './EChart.svelte';
	import type { ResponsibilitySegment } from '$lib/types';
	import {
		formatDateTime,
		formatDuration,
		getAnomalyTypeLabel,
		getResponsiblePartyLabel
	} from '$lib/utils/format';

	export let data: ResponsibilitySegment[] = [];

	$: chartOption = buildChartOption();

	function buildChartOption() {
		if (data.length === 0) {
			return {};
		}

		const minTime = Math.min(...data.map((d) => new Date(d.startTime).getTime()));
		const maxTime = Math.max(...data.map((d) => new Date(d.endTime).getTime()));
		const batchNos = Array.from(new Set(data.map((d) => d.batchNo))).slice(0, 15).reverse();

		return {
			tooltip: {
				trigger: 'item',
				backgroundColor: 'rgba(255, 255, 255, 0.98)',
				borderColor: '#e2e8f0',
				borderWidth: 1,
				textStyle: { color: '#334155' },
				formatter: function (params: any) {
					const seg = data.find(
						(d) => d.batchNo === params.name && new Date(d.startTime).getTime() === params.value[1]
					);
					if (!seg) return '';
					return `<div style="font-weight: 600; margin-bottom: 8px;">批次: ${seg.batchNo}</div>
						<div style="margin-bottom: 4px;">责任方: <strong style="color: ${seg.color}">${seg.partyLabel}</strong></div>
						<div style="margin-bottom: 4px;">异常类型: <strong>${getAnomalyTypeLabel(seg.anomalyType)}</strong></div>
						<div style="margin-bottom: 4px;">开始时间: ${formatDateTime(seg.startTime)}</div>
						<div style="margin-bottom: 4px;">结束时间: ${formatDateTime(seg.endTime)}</div>
						<div>持续时长: <strong>${formatDuration(seg.durationMinutes)}</strong></div>`;
				}
			},
			grid: {
				left: '3%',
				right: '4%',
				bottom: '3%',
				top: '10%',
				containLabel: true
			},
			xAxis: {
				type: 'time',
				min: minTime - 3600000,
				max: maxTime + 3600000,
				axisLabel: {
					formatter: (value: number) => {
						const d = new Date(value);
						return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
					}
				}
			},
			yAxis: {
				type: 'category',
				data: batchNos,
				axisLabel: {
					fontSize: 11
				}
			},
			series: [
				{
					type: 'custom',
					renderItem: function (params: any, api: any) {
						const categoryIndex = api.value(0);
						const start = api.coord([api.value(1), categoryIndex]);
						const end = api.coord([api.value(2), categoryIndex]);
						const height = api.size([0, 1])[1] * 0.6;

						return {
							type: 'rect',
							shape: {
								x: start[0],
								y: start[1] - height / 2,
								width: end[0] - start[0],
								height: height
							},
							style: {
								fill: api.value(3),
								stroke: '#fff',
								lineWidth: 1
							}
						};
					},
					encode: {
						x: [1, 2],
						y: 0
					},
					data: batchNos.flatMap((batchNo) => {
						const segs = data.filter((d) => d.batchNo === batchNo);
						return segs.map((seg) => [
							batchNo,
							new Date(seg.startTime).getTime(),
							new Date(seg.endTime).getTime(),
							seg.color,
							seg.id
						]);
					})
				}
			]
		};
	}
</script>

<div class="card">
	<div class="card-header">
		<h3 class="text-base font-semibold text-slate-800">责任段定位分析</h3>
		<p class="text-sm text-slate-500 mt-1">按批次时间轴展示各责任方异常时段，点击可下钻查看详情</p>
	</div>
	<div class="card-body">
		{#if data.length === 0}
			<div class="empty-state">
				<svg class="w-16 h-16 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
				</svg>
				<p class="text-sm font-medium">暂无责任段数据</p>
				<p class="text-xs text-slate-400 mt-1">系统将自动识别并定位异常责任段</p>
			</div>
		{:else}
			<EChart option={chartOption} height="380px"></EChart>
			<div class="flex items-center gap-6 mt-4 pt-4 border-t border-slate-100 flex-wrap">
				<div class="flex items-center gap-2">
					<div class="w-4 h-3 rounded" style="background: #0F4C81;"></div>
					<span class="text-xs text-slate-600">承运商</span>
				</div>
				<div class="flex items-center gap-2">
					<div class="w-4 h-3 rounded" style="background: #4CAF50;"></div>
					<span class="text-xs text-slate-600">仓库</span>
				</div>
				<div class="flex items-center gap-2">
					<div class="w-4 h-3 rounded" style="background: #FF9800;"></div>
					<span class="text-xs text-slate-600">客户</span>
				</div>
				<div class="flex items-center gap-2">
					<div class="w-4 h-3 rounded" style="background: #9C27B0;"></div>
					<span class="text-xs text-slate-600">设备</span>
				</div>
				<div class="flex items-center gap-2">
					<div class="w-4 h-3 rounded" style="background: #9E9E9E;"></div>
					<span class="text-xs text-slate-600">待确认</span>
				</div>
			</div>
		{/if}
	</div>
</div>
