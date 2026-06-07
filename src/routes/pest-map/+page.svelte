<script lang="ts">
	import { onMount } from 'svelte';
	import { filterStore } from '$lib/stores';
	import { queryPestMap, queryPestTrend, queryPestDistribution } from '$lib/duckdb-service';
	import Chart from '$lib/components/Chart.svelte';
	import { DISTRICT_AREAS } from '$lib/types';
	import type { EChartsOption } from 'echarts';

	let mapOption: EChartsOption = $state({});
	let distOption: EChartsOption = $state({});
	let trendOption: EChartsOption = $state({});

	const districtCoords: Record<string, [number, number]> = {
		'城东片区': [116.48, 39.92],
		'城西片区': [116.28, 39.92],
		'城南片区': [116.38, 39.82],
		'城北片区': [116.38, 40.02],
		'中心片区': [116.38, 39.92]
	};

	const severityColors: Record<string, string> = {
		low: '#40916C',
		medium: '#E9C46A',
		high: '#E76F51'
	};

	async function loadMap() {
		try {
			const data = await queryPestMap($filterStore);
			const districtData: Record<string, { count: number; high: number; medium: number; low: number }> = {};
			for (const r of data) {
				const d = r.district as string;
				if (!districtData[d]) districtData[d] = { count: 0, high: 0, medium: 0, low: 0 };
				districtData[d].count += Number(r.count);
				if (r.severity === 'high') districtData[d].high += Number(r.count);
				else if (r.severity === 'medium') districtData[d].medium += Number(r.count);
				else districtData[d].low += Number(r.count);
			}
			const scatterData = Object.entries(districtData).map(([name, v]) => ({
				name,
				value: [...(districtCoords[name] || [116.38, 39.92]), v.count],
				high: v.high,
				medium: v.medium,
				low: v.low
			}));
			mapOption = {
				tooltip: {
					formatter: (params: any) => {
						const d = params.data;
						if (!d) return '';
						return `<b>${d.name}</b><br/>病虫害总数: ${d.value[2]}<br/>严重: ${d.high} | 中等: ${d.medium} | 轻微: ${d.low}<br/>严重度: ${(d.value[2] / (DISTRICT_AREAS[d.name] || 100)).toFixed(2)}/亩`;
					}
				},
				visualMap: {
					min: 0, max: 80, left: 10, bottom: 10,
					text: ['高', '低'], textStyle: { fontSize: 10 },
					inRange: { color: ['#40916C', '#E9C46A', '#E76F51'] },
					calculable: true
				},
				xAxis: { show: false, min: 116.2, max: 116.6 },
				yAxis: { show: false, min: 39.75, max: 40.1 },
				series: [{
					type: 'scatter',
					coordinateSystem: 'cartesian2d',
					data: scatterData,
					symbolSize: (val: number[]) => Math.max(20, val[2] * 1.5),
					itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.2)' },
					label: { show: true, formatter: '{b}', fontSize: 10, position: 'top' }
				}]
			};
		} catch (e) {
			console.error(e);
		}
	}

	async function loadDistribution() {
		try {
			const data = await queryPestDistribution($filterStore);
			distOption = {
				tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
				legend: { orient: 'vertical', right: 10, top: 'center', textStyle: { fontSize: 10 } },
				series: [{
					type: 'pie',
					radius: ['40%', '70%'],
					avoidLabelOverlap: true,
					itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
					label: { show: true, fontSize: 10 },
					data: data.map((d: any) => ({ name: d.pest_type, value: Number(d.count) })),
					color: ['#1B4332', '#40916C', '#219EBC', '#E9C46A', '#E76F51', '#264653', '#A7C957', '#6A994E']
				}]
			};
		} catch (e) {
			console.error(e);
		}
	}

	async function loadTrend() {
		try {
			const data = await queryPestTrend($filterStore);
			const dates = [...new Set(data.map((d: any) => d.date))].sort();
			const districts = [...new Set(data.map((d: any) => d.district))];
			const series = districts.map((dist) => ({
				name: dist,
				type: 'line' as const,
				stack: 'total',
				areaStyle: { opacity: 0.3 },
				data: dates.map((dt) => {
					const found = data.find((d: any) => d.date === dt && d.district === dist);
					return found ? Number(found.count) : 0;
				}),
				smooth: true,
				symbolSize: 3,
				lineStyle: { width: 1.5 }
			}));
			trendOption = {
				tooltip: { trigger: 'axis' },
				legend: { data: districts, top: 0, textStyle: { fontSize: 10 } },
				grid: { top: 40, right: 20, bottom: 30, left: 40 },
				xAxis: {
					type: 'category',
					data: dates.map((d) => { const dt = new Date(d); return `${dt.getMonth() + 1}/${dt.getDate()}`; }),
					axisLabel: { fontSize: 10 }
				},
				yAxis: { type: 'value', axisLabel: { fontSize: 10 } },
				series,
				color: ['#1B4332', '#40916C', '#219EBC', '#E9C46A', '#E76F51']
			};
		} catch (e) {
			console.error(e);
		}
	}

	async function loadAll() {
		await Promise.all([loadMap(), loadDistribution(), loadTrend()]);
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
		<h1 class="text-lg font-bold text-[#1B4332] font-serif">病虫害地图</h1>
		<div class="text-[10px] text-gray-400">严重度 = 片区病虫害报告数 / 片区养护面积(亩)</div>
	</div>

	<div class="grid grid-cols-3 gap-4">
		<div class="col-span-2 bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
			<h2 class="text-sm font-semibold text-[#1B4332] mb-3">片区病虫害热力分布</h2>
			<Chart option={mapOption} class="w-full" style="height: 360px" />
		</div>
		<div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
			<h2 class="text-sm font-semibold text-[#1B4332] mb-3">虫害类型分布</h2>
			<Chart option={distOption} class="w-full" style="height: 360px" />
		</div>
	</div>

	<div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
		<h2 class="text-sm font-semibold text-[#1B4332] mb-3">病虫害报告时间趋势（按片区堆叠）</h2>
		<Chart option={trendOption} class="w-full" style="height: 280px" />
	</div>
</div>
