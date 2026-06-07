<script lang="ts">
	import AppLayout from '$lib/components/AppLayout.svelte';
	import FilterBar from '$lib/components/FilterBar.svelte';
	import EChart from '$lib/components/charts/EChart.svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { userStore, showToast, savedViewsStore } from '$lib/stores';
	import { generateMockData } from '$lib/data/mockData';
	import { downloadCSV } from '$lib/utils/format';
	import { Download, BarChart3, PieChart, TrendingUp, Save, FolderOpen } from 'lucide-svelte';
	import type { SavedView } from '$lib/types';

	let loading = true;
	let selectedDimension = 'vehicle';
	let selectedMetric = 'complianceRate';
	let chartType = 'bar';
	let pivotData: any[] = [];
	let savedViews: SavedView[] = [];
	let showViewDialog = false;
	let viewName = '';

	const dimensions = [
		{ key: 'vehicle', label: '车辆' },
		{ key: 'customer', label: '客户' },
		{ key: 'route', label: '路线' },
		{ key: 'container', label: '温控箱' }
	];

	const metrics = [
		{ key: 'complianceRate', label: '温控合规率' },
		{ key: 'anomalyCount', label: '异常次数' },
		{ key: 'avgTemp', label: '平均温度' },
		{ key: 'shipmentCount', label: '运单数量' }
	];

	const vehicleOptions = [
		{ id: 'v001', label: '京A·12345' },
		{ id: 'v002', label: '京B·67890' },
		{ id: 'v003', label: '沪A·54321' }
	];
	const customerOptions = [
		{ id: 'c001', label: '鲜优生鲜' },
		{ id: 'c002', label: '康泰医药' }
	];
	const routeOptions = [
		{ id: 'r001', label: '北京-上海' },
		{ id: 'r002', label: '北京-广州' }
	];
	const anomalyTypes = [
		{ key: 'over_temp', label: '温度超标' },
		{ key: 'under_temp', label: '温度过低' },
		{ key: 'door_open', label: '开门超时' }
	];
	const severityLevels = [
		{ key: 'low', label: '低' },
		{ key: 'medium', label: '中' },
		{ key: 'high', label: '高' }
	];

	onMount(async () => {
		if (!$userStore) {
			goto('/login');
			return;
		}
		generatePivotData();
		loading = false;
	});

	function generatePivotData() {
		const mockData = generateMockData();

		const dimMap: Record<string, { id: string; label: string }[]> = {
			vehicle: vehicleOptions,
			customer: customerOptions,
			route: routeOptions,
			container: [
				{ id: 'ct001', label: 'REE-001' },
				{ id: 'ct002', label: 'REE-002' },
				{ id: 'ct003', label: 'REE-003' }
			]
		};

		const items = dimMap[selectedDimension] || [];

		pivotData = items.map((item, idx) => {
			const baseValue = 85 + idx * 3;
			return {
				dimension: item.label,
				dimensionId: item.id,
				complianceRate: Math.min(99, baseValue + Math.random() * 10),
				anomalyCount: Math.floor(Math.random() * 8) + 1,
				avgTemp: -15 + Math.random() * 10,
				shipmentCount: Math.floor(Math.random() * 20) + 5
			};
		});
	}

	$: chartOption = buildChartOption();

	function buildChartOption() {
		if (pivotData.length === 0) return {};

		const metricLabels: Record<string, string> = {
			complianceRate: '温控合规率 (%)',
			anomalyCount: '异常次数',
			avgTemp: '平均温度 (°C)',
			shipmentCount: '运单数量'
		};

		if (chartType === 'bar') {
			return {
				tooltip: {
					trigger: 'axis',
					backgroundColor: 'rgba(255,255,255,0.98)',
					borderColor: '#e2e8f0',
					textStyle: { color: '#334155' }
				},
				grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
				xAxis: {
					type: 'category',
					data: pivotData.map((d) => d.dimension),
					axisLabel: { rotate: 15 }
				},
				yAxis: {
					type: 'value',
					name: metricLabels[selectedMetric]
				},
				series: [
					{
						type: 'bar',
						data: pivotData.map((d) => ({
							value: d[selectedMetric],
							itemStyle: {
								color: selectedMetric === 'complianceRate'
									? d[selectedMetric] >= 95 ? '#22c55e' : d[selectedMetric] >= 90 ? '#eab308' : '#ef4444'
									: '#0F4C81'
							}
						})),
						barWidth: '50%'
					}
				]
			};
		}

		if (chartType === 'pie') {
			return {
				tooltip: {
					trigger: 'item',
					backgroundColor: 'rgba(255,255,255,0.98)',
					borderColor: '#e2e8f0',
					textStyle: { color: '#334155' },
					formatter: (p: any) => `${p.name}: ${p.value} (${p.percent}%)`
				},
				legend: { bottom: 0 },
				series: [
					{
						type: 'pie',
						radius: ['40%', '70%'],
						center: ['50%', '45%'],
						data: pivotData.map((d) => ({
							name: d.dimension,
							value: d[selectedMetric]
						}))
					}
				]
			};
		}

		return {
			tooltip: { trigger: 'axis' },
			grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
			xAxis: { type: 'category', data: pivotData.map((d) => d.dimension) },
			yAxis: { type: 'value', name: metricLabels[selectedMetric] },
			series: [
				{
					type: 'line',
					smooth: true,
					data: pivotData.map((d) => d[selectedMetric]),
					itemStyle: { color: '#0F4C81' },
					areaStyle: { color: 'rgba(15, 76, 129, 0.2)' }
				}
			]
		};
	}

	$: if (selectedDimension || selectedMetric) {
		generatePivotData();
	}

	function handleExport() {
		downloadCSV(pivotData, '多维分析');
		showToast('导出成功', 'success');
	}

	function handleSaveView() {
		if (!viewName.trim()) return;
		showViewDialog = false;
		viewName = '';
		showToast('视图保存成功', 'success');
	}
</script>

<AppLayout>
	{#if loading}
		<div class="flex items-center justify-center h-64">
			<div class="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
		</div>
	{:else}
		<div class="space-y-6">
			<div class="flex items-center justify-between">
				<FilterBar
					vehicles={vehicleOptions}
					customers={customerOptions}
					routes={routeOptions}
					anomalyTypes={anomalyTypes}
					severityLevels={severityLevels}
				/>
			</div>

			<div class="card">
				<div class="card-header flex items-center justify-between">
					<div class="flex items-center gap-4">
						<div class="flex items-center gap-2">
							<span class="text-sm text-slate-600">分析维度:</span>
							<select class="select text-sm py-1.5" bind:value={selectedDimension}>
								{#each dimensions as dim}
									<option value={dim.key}>{dim.label}</option>
								{/each}
							</select>
						</div>
						<div class="flex items-center gap-2">
							<span class="text-sm text-slate-600">分析指标:</span>
							<select class="select text-sm py-1.5" bind:value={selectedMetric}>
								{#each metrics as met}
									<option value={met.key}>{met.label}</option>
								{/each}
							</select>
						</div>
						<div class="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
							<button
								on:click={() => (chartType = 'bar')}
								class="p-1.5 rounded {chartType === 'bar' ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}"
								title="柱状图"
							>
								<BarChart3 class="w-4 h-4" />
							</button>
							<button
								on:click={() => (chartType = 'pie')}
								class="p-1.5 rounded {chartType === 'pie' ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}"
								title="饼图"
							>
								<PieChart class="w-4 h-4" />
							</button>
							<button
								on:click={() => (chartType = 'line')}
								class="p-1.5 rounded {chartType === 'line' ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}"
								title="折线图"
							>
								<TrendingUp class="w-4 h-4" />
							</button>
						</div>
					</div>
					<div class="flex items-center gap-2">
						<button on:click={() => (showViewDialog = true)} class="btn btn-secondary text-sm flex items-center gap-1">
							<Save class="w-4 h-4" />
							保存视图
						</button>
						<button on:click={handleExport} class="btn btn-primary text-sm flex items-center gap-1">
							<Download class="w-4 h-4" />
							导出
						</button>
					</div>
				</div>
				<div class="card-body">
					<EChart option={chartOption} height="400px" />
				</div>
			</div>

			<div class="card">
				<div class="card-header">
					<h3 class="text-base font-semibold text-slate-800">数据透视表</h3>
				</div>
				<div class="overflow-x-auto">
					<table class="table">
						<thead>
							<tr>
								<th>{dimensions.find((d) => d.key === selectedDimension)?.label || '维度'}</th>
								<th class="text-right">运单数量</th>
								<th class="text-right">温控合规率</th>
								<th class="text-right">异常次数</th>
								<th class="text-right">平均温度</th>
							</tr>
						</thead>
						<tbody>
							{#each pivotData as row}
								<tr class="cursor-pointer hover:bg-slate-50">
									<td class="font-medium">{row.dimension}</td>
									<td class="text-right font-mono">{row.shipmentCount}</td>
									<td class="text-right font-mono">
										<span class={row.complianceRate >= 95 ? 'text-green-600' : row.complianceRate >= 90 ? 'text-yellow-600' : 'text-red-600'}>
											{row.complianceRate.toFixed(1)}%
										</span>
									</td>
									<td class="text-right font-mono">
										<span class={row.anomalyCount > 5 ? 'text-red-600' : 'text-slate-700'}>
											{row.anomalyCount}
										</span>
									</td>
									<td class="text-right font-mono">{row.avgTemp.toFixed(1)}°C</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	{/if}

	{#if showViewDialog}
		<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" on:click={() => (showViewDialog = false)}>
			<div class="bg-white rounded-lg p-6 w-96 shadow-xl" on:click|stopPropagation>
				<h3 class="text-lg font-semibold text-slate-800 mb-4">保存当前视图</h3>
				<input
					type="text"
					class="input mb-4"
					placeholder="输入视图名称"
					bind:value={viewName}
					on:keydown={(e) => e.key === 'Enter' && handleSaveView()}
				/>
				<div class="flex justify-end gap-2">
					<button class="btn btn-secondary" on:click={() => (showViewDialog = false)}>取消</button>
					<button class="btn btn-primary" on:click={handleSaveView}>保存</button>
				</div>
			</div>
		</div>
	{/if}
</AppLayout>
