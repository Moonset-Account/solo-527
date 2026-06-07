<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { filterStore } from '$lib/stores';
	import { queryTeamComparison, queryTeamEfficiency } from '$lib/duckdb-service';
	import Chart from '$lib/components/Chart.svelte';
	import type { EChartsOption } from 'echarts';

	let radarOption: EChartsOption = $state({});
	let barOption: EChartsOption = $state({});
	let scatterOption: EChartsOption = $state({});

	async function loadRadar() {
		try {
			const data = await queryTeamComparison($filterStore);
			const teams = data.map((d: any) => d.team);
			const indicators = [
				{ name: '完成率', max: 100 },
				{ name: '按时率', max: 100 },
				{ name: '无虫害率', max: 100 },
				{ name: '无逾期率', max: 100 }
			];
			const seriesData = data.map((d: any) => {
				const total = Number(d.total) || 1;
				const completionRate = Number(d.completion_rate);
				const onTimeRate = Math.max(0, 100 - Number(d.rain_delayed_rate));
				const noPestRate = Math.max(0, 100 - (Number(d.pest_issues) / total * 100));
				const noOverdueRate = Math.max(0, 100 - Number(d.overdue_rate));
				return {
					value: [completionRate, onTimeRate, noPestRate, noOverdueRate],
					name: d.team
				};
			});
			radarOption = {
				tooltip: {
					trigger: 'item',
					formatter: (params: any) => {
						if (!params.name) return '';
						return `<b>${params.name}</b><br/>点击下钻查看该班组明细`;
					}
				},
				legend: { data: teams, top: 0, textStyle: { fontSize: 10 } },
				radar: { indicator: indicators, shape: 'polygon', splitNumber: 5, axisName: { fontSize: 10 } },
				series: [{
					type: 'radar',
					data: seriesData,
					lineStyle: { width: 2 },
					areaStyle: { opacity: 0.15 },
					emphasis: { lineStyle: { width: 3 }, areaStyle: { opacity: 0.3 } }
				}],
				color: ['#1B4332', '#40916C', '#219EBC', '#E9C46A', '#E76F51']
			};
		} catch (e) {
			console.error(e);
		}
	}

	async function loadBar() {
		try {
			const data = await queryTeamComparison($filterStore);
			const teams = data.map((d: any) => d.team);
			barOption = {
				tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
				legend: { data: ['雨天延期率', '人工逾期率'], top: 0, textStyle: { fontSize: 10 } },
				grid: { top: 40, right: 20, bottom: 30, left: 60 },
				xAxis: { type: 'value', name: '%', axisLabel: { fontSize: 10 } },
				yAxis: { type: 'category', data: teams, axisLabel: { fontSize: 10 } },
				series: [
					{
						name: '雨天延期率', type: 'bar',
						data: data.map((d: any) => Number(d.rain_delayed_rate)),
						itemStyle: { color: '#219EBC' }, barMaxWidth: 20,
						emphasis: { itemStyle: { borderColor: '#1B4332', borderWidth: 2 } }
					},
					{
						name: '人工逾期率', type: 'bar',
						data: data.map((d: any) => Number(d.overdue_rate)),
						itemStyle: { color: '#E76F51' }, barMaxWidth: 20,
						emphasis: { itemStyle: { borderColor: '#1B4332', borderWidth: 2 } }
					}
				]
			};
		} catch (e) {
			console.error(e);
		}
	}

	async function loadScatter() {
		try {
			const data = await queryTeamEfficiency($filterStore);
			scatterOption = {
				tooltip: {
					formatter: (params: any) => {
						return `<b>${params.data[3]}</b><br/>任务数: ${params.data[0]}<br/>平均完成时长: ${params.data[1].toFixed(1)}天<br/><span style="color:#219EBC">点击下钻</span>`;
					}
				},
				grid: { top: 20, right: 20, bottom: 40, left: 60 },
				xAxis: { type: 'value', name: '任务数', axisLabel: { fontSize: 10 }, nameTextStyle: { fontSize: 10 } },
				yAxis: { type: 'value', name: '平均完成天数', axisLabel: { fontSize: 10 }, nameTextStyle: { fontSize: 10 } },
				series: [{
					type: 'scatter',
					data: data.map((d: any) => [Number(d.task_count), Number(d.avg_duration || 0), Number(d.task_count), d.team]),
					symbolSize: (val: number[]) => Math.max(10, val[0] * 0.8),
					itemStyle: { shadowBlur: 6, shadowColor: 'rgba(0,0,0,0.15)' },
					label: { show: true, formatter: (p: any) => p.data[3], position: 'top', fontSize: 10 },
					emphasis: { itemStyle: { borderColor: '#1B4332', borderWidth: 2 } }
				}],
				color: ['#40916C']
			};
		} catch (e) {
			console.error(e);
		}
	}

	async function loadAll() {
		await Promise.all([loadRadar(), loadBar(), loadScatter()]);
	}

	function onRadarClick(params: any) {
		if (!params.name) return;
		goto(`/detail?team=${encodeURIComponent(params.name)}`);
	}

	function onBarClick(params: any) {
		if (!params.name) return;
		let statuses = '';
		if (params.seriesName === '人工逾期率') statuses = 'overdue';
		else if (params.seriesName === '雨天延期率') statuses = 'rain_delayed';
		const p = new URLSearchParams({ team: params.name });
		if (statuses) p.set('status', statuses);
		goto(`/detail?${p.toString()}`);
	}

	function onScatterClick(params: any) {
		if (!params.data || !params.data[3]) return;
		goto(`/detail?team=${encodeURIComponent(params.data[3])}`);
	}

	onMount(() => {
		loadAll();
	});

	$effect(() => {
		const f = $filterStore;
		loadAll();
	});
</script>

<div class="space-y-5">
	<div class="flex items-center justify-between">
		<h1 class="text-lg font-bold text-[#1B4332] font-serif">班组对比</h1>
		<div class="text-[10px] text-gray-400">
			<span class="inline-block w-3 h-2 bg-[#219EBC] rounded mr-1"></span>雨天延期
			<span class="inline-block w-3 h-2 bg-[#E76F51] rounded ml-2 mr-1"></span>人工逾期
			<span class="ml-2">| 点击图表下钻到班组明细</span>
		</div>
	</div>

	<div class="grid grid-cols-2 gap-4">
		<div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
			<h2 class="text-sm font-semibold text-[#1B4332] mb-3">班组综合能力雷达图 <span class="text-[10px] font-normal text-gray-400">（点击下钻）</span></h2>
			<Chart option={radarOption} onclick={onRadarClick} class="w-full" style="height: 340px" />
		</div>
		<div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
			<h2 class="text-sm font-semibold text-[#1B4332] mb-3">逾期率对比（雨天延期 vs 人工逾期） <span class="text-[10px] font-normal text-gray-400">（点击下钻）</span></h2>
			<Chart option={barOption} onclick={onBarClick} class="w-full" style="height: 340px" />
		</div>
	</div>

	<div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
		<h2 class="text-sm font-semibold text-[#1B4332] mb-3">工时效率散点图（任务量 vs 平均完成时长） <span class="text-[10px] font-normal text-gray-400">（点击下钻）</span></h2>
		<Chart option={scatterOption} onclick={onScatterClick} class="w-full" style="height: 300px" />
	</div>
</div>
