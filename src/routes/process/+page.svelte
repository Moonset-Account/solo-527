<script lang="ts">
	import { onMount } from 'svelte';
	import FilterPanel from '$components/FilterPanel.svelte';
	import SankeyChart from '$components/charts/SankeyChart.svelte';
	import WaitDistributionChart from '$components/charts/WaitDistributionChart.svelte';
	import type { FilterParams, SankeyData, HistogramBin, WaitTimeStats } from '$types';
	import { AlertTriangle } from 'lucide-svelte';

	let filters: Partial<FilterParams> = {
		departments: [],
		doctors: [],
		timeSlots: [],
		patientTypes: [],
		processNodes: [],
		excludeAnomalies: true
	};

	let loading = true;
	let sankeyData: SankeyData | null = null;
	let distributions: Record<string, HistogramBin[]> = {};
	let nodeStats: Record<string, WaitTimeStats> = {};
	let selectedNode = '分诊-叫号';

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

			sankeyData = data.sankey;
			distributions = data.distributions;
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

	$: availableNodes = Object.keys(distributions || {});

	$: bottleneckNodes = Object.entries(nodeStats || {})
		.map(([node, stats]) => ({ node, avg: stats.avg }))
		.sort((a, b) => b.avg - a.avg)
		.slice(0, 3);
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-gray-900">流程瓶颈分析</h1>
		<p class="text-gray-500 mt-1">深入分析各流程环节的等待时间，识别瓶颈环节</p>
	</div>

	<FilterPanel {filters} onFilterChange={onFilterChange} />

	{#if loading}
		<div class="flex items-center justify-center py-20">
			<div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
		</div>
	{:else}
		{#if bottleneckNodes.length > 0}
			<div class="bg-orange-50 border border-orange-200 rounded-xl p-4">
				<div class="flex items-start space-x-3">
					<AlertTriangle class="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
					<div>
						<h3 class="font-medium text-orange-800">瓶颈预警</h3>
						<p class="text-sm text-orange-700 mt-1">
							当前筛选条件下，等待时间最长的前 3 个环节：
							{#each bottleneckNodes as bn, i}
								<strong class="mx-1">{bn.node}</strong>
								({bn.avg}分钟)
								{#if i < bottleneckNodes.length - 1}、{/if}
							{/each}
						</p>
					</div>
				</div>
			</div>
		{/if}

		{#if sankeyData}
			<SankeyChart data={sankeyData} title="全流程流转桑基图" height="500px" />
		{/if}

		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each Object.entries(nodeStats || {}) as [node, stats]}
				<div class="card">
					<div class="flex items-center justify-between mb-3">
						<h4 class="font-medium text-gray-800">{node}</h4>
						<span
							class="px-2 py-1 text-xs rounded-full font-medium {stats.avg > 30
								? 'bg-red-100 text-red-700'
								: stats.avg > 15
									? 'bg-orange-100 text-orange-700'
									: 'bg-green-100 text-green-700'}"
						>
							{stats.avg > 30 ? '高风险' : stats.avg > 15 ? '需关注' : '正常'}
						</span>
					</div>
					<div class="grid grid-cols-3 gap-3 text-center">
						<div>
							<p class="text-2xl font-bold text-gray-900">{stats.avg}</p>
							<p class="text-xs text-gray-500">平均(分钟)</p>
						</div>
						<div>
							<p class="text-2xl font-bold text-gray-900">{stats.median}</p>
							<p class="text-xs text-gray-500">中位(分钟)</p>
						</div>
						<div>
							<p class="text-2xl font-bold text-gray-900">{stats.p95}</p>
							<p class="text-xs text-gray-500">P95(分钟)</p>
						</div>
					</div>
					<div class="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
						有效样本: {stats.count} 条
					</div>
				</div>
			{/each}
		</div>

		<div>
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-lg font-semibold text-gray-800">等待时间分布详情</h2>
				<select
					class="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
					bind:value={selectedNode}
				>
					{#each availableNodes as node}
						<option value={node}>{node}</option>
					{/each}
				</select>
			</div>
			{#if distributions && distributions[selectedNode]}
				<WaitDistributionChart
					data={distributions[selectedNode]}
					title=""
					nodeName={selectedNode}
					height="400px"
				/>
			{/if}
		</div>
	{/if}
</div>
