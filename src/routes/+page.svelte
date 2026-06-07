<script lang="ts">
	import { onMount } from 'svelte';
	import { filterStore } from '$lib/stores';
	import { queryOverviewMetrics, queryCompletionTrend, queryWeatherCorrelation } from '$lib/duckdb-service';
	import Chart from '$lib/components/Chart.svelte';
	import MetricCard from '$lib/components/MetricCard.svelte';
	import type { EChartsOption } from 'echarts';

	let metrics: any = $state(null);
	let trendGroupBy: 'day' | 'week' | 'month' = $state('day');
	let trendOption: EChartsOption = $state({});
	let weatherOption: EChartsOption = $state({});

	async function loadMetrics() {
		try {
			const m = await queryOverviewMetrics($filterStore);
			metrics = m;
		} catch (e) {
			console.error(e);
		}
	}

	async function loadTrend() {
		try {
			const data = await queryCompletionTrend($filterStore, trendGroupBy);
			const dates = data.map((d: any) => {
				const dt = new Date(d.period);
				return `${dt.getMonth() + 1}/${dt.getDate()}`;
			});
			trendOption = {
				tooltip: { trigger: 'axis' },
				legend: { data: ['总任务', '已完成', '逾期', '雨天延期'], top: 0, textStyle: { fontSize: 11 } },
				grid: { top: 40, right: 20, bottom: 30, left: 50 },
				xAxis: { type: 'category', data: dates, axisLabel: { fontSize: 10 } },
				yAxis: { type: 'value', axisLabel: { fontSize: 10 } },
				series: [
					{ name: '总任务', type: 'bar', data: data.map((d: any) => d.total), itemStyle: { color: '#e0e0e0' }, barMaxWidth: 20 },
					{ name: '已完成', type: 'bar', data: data.map((d: any) => d.completed), itemStyle: { color: '#40916C' }, barMaxWidth: 20 },
					{ name: '逾期', type: 'line', data: data.map((d: any) => d.overdue), itemStyle: { color: '#E76F51' }, lineStyle: { width: 2 }, symbolSize: 4 },
					{ name: '雨天延期', type: 'line', data: data.map((d: any) => d.rain_delayed), itemStyle: { color: '#219EBC' }, lineStyle: { width: 2, type: 'dashed' }, symbolSize: 4 }
				]
			};
		} catch (e) {
			console.error(e);
		}
	}

	async function loadWeather() {
		try {
			const data = await queryWeatherCorrelation($filterStore);
			const dates = data.map((d: any) => {
				const dt = new Date(d.date);
				return `${dt.getMonth() + 1}/${dt.getDate()}`;
			});
			const rainfallData = data.map((d: any) => d.avg_rainfall);
			const overdueData = data.map((d: any) => d.overdue_rate);
			const rainDelayedData = data.map((d: any) => d.rain_delayed_rate);
			const markAreas: any[] = [];
			for (let i = 0; i < rainfallData.length; i++) {
				if (rainfallData[i] >= 10) {
					markAreas.push([{ xAxis: dates[i] }, { xAxis: dates[Math.min(i + 1, dates.length - 1)] }]);
				}
			}
			weatherOption = {
				tooltip: { trigger: 'axis' },
				legend: { data: ['降雨量', '逾期率', '雨天延期率'], top: 0, textStyle: { fontSize: 11 } },
				grid: { top: 40, right: 60, bottom: 30, left: 50 },
				xAxis: { type: 'category', data: dates, axisLabel: { fontSize: 10 } },
				yAxis: [
					{ type: 'value', name: '降雨量mm', axisLabel: { fontSize: 10 }, nameTextStyle: { fontSize: 10 } },
					{ type: 'value', name: '%', axisLabel: { fontSize: 10 }, nameTextStyle: { fontSize: 10 } }
				],
				series: [
					{
						name: '降雨量', type: 'bar', data: rainfallData, itemStyle: { color: '#219EBC', opacity: 0.6 },
						barMaxWidth: 15, markArea: {
							silent: true, itemStyle: { color: 'rgba(33,158,188,0.08)' }, data: markAreas
						}
					},
					{ name: '逾期率', type: 'line', yAxisIndex: 1, data: overdueData, itemStyle: { color: '#E76F51' }, lineStyle: { width: 2 }, symbolSize: 4 },
					{ name: '雨天延期率', type: 'line', yAxisIndex: 1, data: rainDelayedData, itemStyle: { color: '#219EBC' }, lineStyle: { width: 2, type: 'dashed' }, symbolSize: 4 }
				]
			};
		} catch (e) {
			console.error(e);
		}
	}

	async function loadAll() {
		await Promise.all([loadMetrics(), loadTrend(), loadWeather()]);
	}

	onMount(() => {
		loadAll();
	});

	$effect(() => {
		const f = $filterStore;
		loadAll();
	});

	$effect(() => {
		loadTrend();
	});
</script>

<div class="space-y-5">
	<div class="flex items-center justify-between">
		<h1 class="text-lg font-bold text-[#1B4332] font-serif">运营复盘总览</h1>
		<div class="text-[10px] text-gray-400">统计周期：默认近30天 | 雨天判定阈值：降雨≥10mm</div>
	</div>

	{#if metrics}
		<div class="grid grid-cols-4 gap-4">
			<MetricCard label="总任务数" value={Number(metrics.total_tasks)} color="#1B4332" />
			<MetricCard label="完成率" value={Number(metrics.completion_rate)} unit="%" color="#40916C" trend={Number(metrics.completion_rate) > 80 ? 'up' : 'down'} trendValue={Number(metrics.completion_rate)} />
			<MetricCard label="人工逾期率" value={Number(metrics.overdue_rate)} unit="%" color="#E76F51" trend={Number(metrics.overdue_rate) > 10 ? 'up' : 'down'} trendValue={Number(metrics.overdue_rate)} />
			<MetricCard label="雨天延期率" value={Number(metrics.rain_delayed_rate)} unit="%" color="#219EBC" trend="flat" trendValue={Number(metrics.rain_delayed_rate)} />
		</div>
	{:else}
		<div class="grid grid-cols-4 gap-4">
			{#each [0, 1, 2, 3] as _}
				<div class="bg-white rounded-lg p-4 border border-gray-100 animate-pulse h-20"></div>
			{/each}
		</div>
	{/if}

	<div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
		<div class="flex items-center justify-between mb-3">
			<h2 class="text-sm font-semibold text-[#1B4332]">任务完成趋势</h2>
			<div class="flex gap-1">
				{#each ['day', 'week', 'month'] as g}
					<button
						class="px-2.5 py-1 rounded text-[10px] transition-colors cursor-pointer {trendGroupBy === g ? 'bg-[#1B4332] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
						onclick={() => (trendGroupBy = g as any)}
					>
						{g === 'day' ? '按日' : g === 'week' ? '按周' : '按月'}
					</button>
				{/each}
			</div>
		</div>
		<Chart option={trendOption} class="w-full" style="height: 280px" />
	</div>

	<div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
		<div class="flex items-center justify-between mb-3">
			<h2 class="text-sm font-semibold text-[#1B4332]">天气关联分析</h2>
			<div class="text-[10px] text-gray-400">
				<span class="inline-block w-3 h-2 bg-[#219EBC]/20 rounded mr-1"></span>蓝色区间=雨天(降雨≥10mm)
			</div>
		</div>
		<Chart option={weatherOption} class="w-full" style="height: 280px" />
	</div>
</div>
