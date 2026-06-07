<script lang="ts">
	import EChart from './EChart.svelte';
	import type { TemperatureRecord, DoorEvent } from '$lib/types';
	import { formatDateTime, formatTemperature, getCalibrationStatus } from '$lib/utils/format';

	export let temperatureRecords: TemperatureRecord[] = [];
	export let doorEvents: DoorEvent[] = [];
	export let tempUpper: number = 8;
	export let tempLower: number = -25;

	$: chartOption = {
		tooltip: {
			trigger: 'axis',
			axisPointer: { type: 'cross' },
			backgroundColor: 'rgba(255, 255, 255, 0.98)',
			borderColor: '#e2e8f0',
			borderWidth: 1,
			textStyle: { color: '#334155' },
			formatter: function (params: any) {
				if (!params || !params.length) return '';
				const tempParam = params.find((p: any) => p.seriesName === '箱内温度');
				const doorParam = params.find((p: any) => p.seriesName === '箱门状态');

				let html = `<div style="font-weight: 600; margin-bottom: 8px;">${formatDateTime(params[0].axisValue)}</div>`;

				if (tempParam) {
					const dataIndex = tempParam.dataIndex;
					const record = temperatureRecords[dataIndex];
					const temp = tempParam.value[1];
					const tempStatus = temp > tempUpper ? '超温' : temp < tempLower ? '低温' : '正常';
					const tempColor = temp > tempUpper ? '#ef4444' : temp < tempLower ? '#3b82f6' : '#22c55e';

					html += `<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
						<span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${tempParam.color};"></span>
						<span>箱内温度: <strong style="color: ${tempColor}">${formatTemperature(temp)}</strong> <span style="font-size: 12px; color: ${tempColor}">(${tempStatus})</span></span>
					</div>`;

					if (record) {
						const calib = getCalibrationStatus(record.probeCalibrated, record.calibrationDeviation);
						html += `<div style="font-size: 12px; color: #64748b; padding-left: 18px; margin-bottom: 4px;">
							探头: ${record.probeId} | 
							<span style="color: ${calib.color}">● ${calib.status}</span>
							${record.calibrationDeviation !== undefined ? ` (偏差 ${record.calibrationDeviation > 0 ? '+' : ''}${record.calibrationDeviation.toFixed(2)}°C)` : ''}
						</div>`;
					}
				}

				if (doorParam && doorParam.value !== undefined) {
					const doorStatus = doorParam.value[1] === 1 ? '开启' : '关闭';
					const doorColor = doorParam.value[1] === 1 ? '#f59e0b' : '#22c55e';
					html += `<div style="display: flex; align-items: center; gap: 8px;">
						<span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${doorColor};"></span>
						<span>箱门状态: <strong style="color: ${doorColor}">${doorStatus}</strong></span>
					</div>`;
				}

				return html;
			}
		},
		legend: {
			data: ['箱内温度', '箱门状态', '温度上限', '温度下限'],
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
			type: 'time',
			axisLabel: {
				formatter: (value: number) => {
					const d = new Date(value);
					return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
				}
			}
		},
		yAxis: [
			{
				type: 'value',
				name: '温度 (°C)',
				position: 'left',
				axisLabel: {
					formatter: '{value}°C'
				}
			},
			{
				type: 'value',
				name: '箱门',
				position: 'right',
				min: 0,
				max: 1,
				interval: 1,
				axisLabel: {
					formatter: (value: number) => (value === 1 ? '开' : '关')
				},
				splitLine: { show: false }
			}
		],
		series: [
			{
				name: '温度上限',
				type: 'line',
				yAxisIndex: 0,
				data: temperatureRecords.length
					? [
							[temperatureRecords[0].timestamp, tempUpper],
							[temperatureRecords[temperatureRecords.length - 1].timestamp, tempUpper]
						]
					: [],
				lineStyle: { type: 'dashed', color: '#ef4444', width: 1 },
				itemStyle: { color: '#ef4444' },
				symbol: 'none'
			},
			{
				name: '温度下限',
				type: 'line',
				yAxisIndex: 0,
				data: temperatureRecords.length
					? [
							[temperatureRecords[0].timestamp, tempLower],
							[temperatureRecords[temperatureRecords.length - 1].timestamp, tempLower]
						]
					: [],
				lineStyle: { type: 'dashed', color: '#3b82f6', width: 1 },
				itemStyle: { color: '#3b82f6' },
				symbol: 'none'
			},
			{
				name: '箱内温度',
				type: 'line',
				yAxisIndex: 0,
				smooth: true,
				sampling: 'lttb',
				itemStyle: {
					color: '#0F4C81'
				},
				areaStyle: {
					color: {
						type: 'linear',
						x: 0,
						y: 0,
						x2: 0,
						y2: 1,
						colorStops: [
							{ offset: 0, color: 'rgba(15, 76, 129, 0.3)' },
							{ offset: 1, color: 'rgba(15, 76, 129, 0.05)' }
						]
					}
				},
				data: temperatureRecords.map((r) => {
					const isAbnormal = r.temperature > tempUpper || r.temperature < tempLower;
					return {
						value: [r.timestamp, r.temperature],
						itemStyle: isAbnormal
							? {
									color: '#ef4444',
									borderColor: '#ef4444',
									borderWidth: 2
								}
							: undefined,
						symbol: isAbnormal ? 'circle' : 'none',
						symbolSize: isAbnormal ? 8 : 0
					};
				})
			},
			{
				name: '箱门状态',
				type: 'line',
				yAxisIndex: 1,
				step: 'after',
				lineStyle: { width: 2, color: '#f59e0b' },
				itemStyle: { color: '#f59e0b' },
				symbol: 'circle',
				symbolSize: 6,
				data: buildDoorSeries()
			}
		]
	};

	function buildDoorSeries(): any[] {
		if (temperatureRecords.length === 0 || doorEvents.length === 0) return [];

		const points: any[] = [];
		let isOpen = false;

		const sortedEvents = [...doorEvents].sort(
			(a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
		);

		for (const event of sortedEvents) {
			isOpen = event.eventType === 'open';
			points.push({
				value: [event.timestamp, isOpen ? 1 : 0]
			});
		}

		return points;
	}
</script>

<div class="card">
	<div class="card-header">
		<h3 class="text-base font-semibold text-slate-800">温度曲线监控</h3>
		<p class="text-sm text-slate-500 mt-1">实时监控箱内温度变化，标记异常点和探头校准状态</p>
	</div>
	<div class="card-body">
		{#if temperatureRecords.length === 0}
			<div class="empty-state">
				<svg class="w-16 h-16 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
				</svg>
				<p class="text-sm font-medium">暂无温度数据</p>
				<p class="text-xs text-slate-400 mt-1">请先导入运输数据或选择运单</p>
			</div>
		{:else}
			<EChart option={chartOption} height="380px" />
			<div class="flex items-center gap-6 mt-4 pt-4 border-t border-slate-100">
				<div class="flex items-center gap-2">
					<div class="w-3 h-3 rounded-full bg-red-500" />
					<span class="text-xs text-slate-600">异常点（温度超标/过低）</span>
				</div>
				<div class="flex items-center gap-2">
					<div class="w-3 h-3 rounded-full bg-cyan-500" />
					<span class="text-xs text-slate-600">探头已校准</span>
				</div>
				<div class="flex items-center gap-2">
					<div class="w-3 h-3 rounded-full bg-yellow-500" />
					<span class="text-xs text-slate-600">探头待校准（数据仅供参考）</span>
				</div>
			</div>
		{/if}
	</div>
</div>
