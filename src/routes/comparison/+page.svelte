<script lang="ts">
	import { onMount } from 'svelte';
	import FilterPanel from '$components/FilterPanel.svelte';
	import DepartmentCompareChart from '$components/charts/DepartmentCompareChart.svelte';
	import EChart from '$components/charts/EChart.svelte';
	import type { FilterParams, DepartmentCompareItem, WaitTimeStats } from '$types';

	let filters: Partial<FilterParams> = {
		departments: [],
		doctors: [],
		timeSlots: [],
		patientTypes: [],
		processNodes: [],
		excludeAnomalies: true
	};

	let loading = true;
	let deptCompare: DepartmentCompareItem[] = [];
	let nodeStats: Record<string, WaitTimeStats> = {};
	let compareBy: 'department' | 'timeSlot' | 'patientType' = 'department';

	function setCompareBy(key: string) {
		compareBy = key as typeof compareBy;
	}

	async function loadData() {
		loading = true;
		try {
			const params = new URLSearchParams();
			filters.departments?.forEach((d) => params.append('departments', d));
			filters.doctors?.forEach((d) => params.append('doctors', d));
			filters.timeSlots?.forEach((t) => params.append('timeSlots', t));
			filters.patientTypes?.forEach((t) => params.append('patientTypes', t));
			filters.processNodes?.forEach((n) => params.append('processNodes', n));
			params.set('excludeAnomalies', String(filters.excludeAnomalies ?? true));

			const res = await fetch(`/api/analytics?${params.toString()}`);
			const data = await res.json();

			deptCompare = data.deptCompare;
			nodeStats = data.nodeStats;
		} catch (e) {
			console.error('Failed to load data:', e);
		} finally {
			loading = false;
		}
	}

	function onFilterChange(newFilters: Partial<FilterParams>) {
		filters = newFilters;
		loadData();
	}

	onMount(() => {
		loadData();
	});

	let nodeCompareOption: any;
	$: nodeCompareOption = {
		title: {
			text: '各环节等待时间对比',
			left: 'center',
			textStyle: { fontSize: 16, fontWeight: 600, color: '#1f2937' }
		},
		tooltip: {
			trigger: 'axis',
			axisPointer: { type: 'shadow' }
		},
		legend: {
			data: ['平均时间', '中位时间', 'P95时间'],
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
			data: Object.keys(nodeStats || {}),
			axisLabel: { rotate: 30, fontSize: 11 }
		},
		yAxis: {
			type: 'value',
			name: '分钟',
			axisLabel: { fontSize: 11 }
		},
		series: [
			{
				name: '平均时间',
				type: 'bar',
				data: Object.values(nodeStats || {}).map((s) => s.avg),
				itemStyle: { color: '#165DFF' },
				barWidth: '25%'
			},
			{
				name: '中位时间',
				type: 'bar',
				data: Object.values(nodeStats || {}).map((s) => s.median),
				itemStyle: { color: '#722ED1' },
				barWidth: '25%'
			},
			{
				name: 'P95时间',
				type: 'bar',
				data: Object.values(nodeStats || {}).map((s) => s.p95),
				itemStyle: { color: '#F53F3F' },
				barWidth: '25%'
			}
		]
	};
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-gray-900">多维对比分析</h1>
		<p class="text-gray-500 mt-1">从不同维度对比等待时间表现</p>
	</div>

	<FilterPanel {filters} onFilterChange={onFilterChange} />

	{#if loading}
		<div class="flex items-center justify-center py-20">
			<div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
		</div>
	{:else}
		<div class="flex items-center space-x-2 mb-4">
			<span class="text-sm text-gray-600">对比维度:</span>
			<div class="flex space-x-1">
				{#each [
					{ key: 'department', label: '按科室' },
					{ key: 'timeSlot', label: '按时段' },
					{ key: 'patientType', label: '按患者类型' }
				] as opt}
					<button
						class="px-3 py-1.5 text-sm rounded-lg transition-colors {compareBy === opt.key
							? 'bg-primary-500 text-white'
							: 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}"
						on:click={() => setCompareBy(opt.key)}
					>
						{opt.label}
					</button>
				{/each}
			</div>
		</div>

		{#if compareBy === 'department'}
			<DepartmentCompareChart data={deptCompare} height="450px" />
		{:else}
			<div class="card">
				<div class="flex items-center justify-center h-64 text-gray-500">
					{compareBy === 'timeSlot' ? '时段对比功能开发中...' : '患者类型对比功能开发中...'}
				</div>
			</div>
		{/if}

		<div class="card">
			<EChart option={nodeCompareOption} height="400px" />
			<div class="mt-4 text-xs text-gray-500">
				<p>说明：P95 时间表示 95% 的患者等待时间不超过该值，用于衡量长尾等待情况。</p>
			</div>
		</div>

		<div class="card overflow-x-auto">
			<h3 class="text-base font-semibold text-gray-800 mb-4">科室详细数据</h3>
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-gray-200">
						<th class="text-left py-3 px-4 font-medium text-gray-600">科室</th>
						<th class="text-right py-3 px-4 font-medium text-gray-600">就诊人次</th>
						<th class="text-right py-3 px-4 font-medium text-gray-600">平均等待(分)</th>
						<th class="text-right py-3 px-4 font-medium text-gray-600">中位等待(分)</th>
						<th class="text-left py-3 px-4 font-medium text-gray-600">瓶颈环节</th>
					</tr>
				</thead>
				<tbody>
					{#each deptCompare as item}
						<tr class="border-b border-gray-100 hover:bg-gray-50">
							<td class="py-3 px-4 font-medium text-gray-800">{item.department}</td>
							<td class="py-3 px-4 text-right text-gray-600">{item.patientCount}</td>
							<td
								class="py-3 px-4 text-right font-medium {item.avgWaitTime > 40
									? 'text-danger'
									: item.avgWaitTime > 25
										? 'text-warning'
										: 'text-success'}"
							>
								{item.avgWaitTime}
							</td>
							<td class="py-3 px-4 text-right text-gray-600">{item.medianWaitTime}</td>
							<td class="py-3 px-4">
								<span class="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
									{item.bottleneckNode}
								</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
