<script lang="ts">
	import { onMount } from 'svelte';
	import FilterPanel from '$components/FilterPanel.svelte';
	import MetricCard from '$components/MetricCard.svelte';
	import SankeyChart from '$components/charts/SankeyChart.svelte';
	import DepartmentCompareChart from '$components/charts/DepartmentCompareChart.svelte';
	import IntradayTrendChart from '$components/charts/IntradayTrendChart.svelte';
	import WaitDistributionChart from '$components/charts/WaitDistributionChart.svelte';
	import MetricDefinition from '$components/MetricDefinition.svelte';
	import type { FilterParams, OverviewStats, SankeyData, DepartmentCompareItem, IntradayTrendPoint, HistogramBin } from '$types';

	let filters: Partial<FilterParams> = {
		departments: [],
		doctors: [],
		timeSlots: [],
		patientTypes: [],
		processNodes: [],
		excludeAnomalies: true
	};

	let loading = true;
	let overview: OverviewStats | null = null;
	let sankeyData: SankeyData | null = null;
	let deptCompare: DepartmentCompareItem[] = [];
	let intraday: IntradayTrendPoint[] = [];
	let distributions: Record<string, HistogramBin[]> = {};
	let selectedNode = '分诊-叫号';

	async function loadData() {
		loading = true;
		try {
			const params = new URLSearchParams();
			filters.departments?.forEach((d) => params.append('departments', d));
			filters.doctors?.forEach((d) => params.append('doctors', d));
			filters.timeSlots?.forEach((t) => params.append('timeSlots', t));
			filters.patientTypes?.forEach((t) => params.append('patientTypes', t));
			params.set('excludeAnomalies', String(filters.excludeAnomalies ?? true));

			const res = await fetch(`/api/analytics?${params.toString()}`);
			const data = await res.json();

			overview = data.overview;
			sankeyData = data.sankey;
			deptCompare = data.deptCompare;
			intraday = data.intraday;
			distributions = data.distributions;
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
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">门诊等待时间分析</h1>
			<p class="text-gray-500 mt-1">
				{#if overview}
					数据范围: {overview.dataDateRange.start.toLocaleDateString('zh-CN')} ~ {overview.dataDateRange.end.toLocaleDateString('zh-CN')}
				{/if}
			</p>
		</div>
		<div class="flex items-center space-x-2">
			<a href="/export" class="btn-secondary text-sm">导出报告</a>
		</div>
	</div>

	<FilterPanel {filters} onFilterChange={onFilterChange} />

	{#if loading}
		<div class="flex items-center justify-center py-20">
			<div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
		</div>
	{:else if overview}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			<MetricCard
				label="就诊总人次"
				value={overview.totalPatients.toLocaleString()}
				metricKey="throughput"
				color="default"
			/>
			<MetricCard
				label="平均总等待时间"
				value={overview.totalAvgWaitTime}
				unit="分钟"
				metricKey="avgWaitTime"
				color={overview.totalAvgWaitTime > 40 ? 'danger' : overview.totalAvgWaitTime > 25 ? 'warning' : 'success'}
			/>
			<MetricCard
				label="最长等待环节"
				value={overview.longestWaitNode}
				unit={overview.longestWaitTime + '分钟'}
				color="warning"
			/>
			<MetricCard
				label="最繁忙科室"
				value={overview.busiestDepartment}
				color="default"
			/>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			{#if sankeyData}
				<SankeyChart data={sankeyData} title="患者流程流转分析" height="420px" />
			{/if}

			<div>
				<div class="flex items-center justify-between mb-3">
					<h3 class="text-base font-medium text-gray-700">等待时间分布</h3>
					<select
						class="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
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
						height="300px"
					/>
				{/if}
			</div>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<DepartmentCompareChart data={deptCompare} />
			<IntradayTrendChart data={intraday} />
		</div>

		<div class="card">
			<h3 class="text-base font-semibold text-gray-800 mb-3">重要说明</h3>
			<div class="text-sm text-gray-600 space-y-2">
				<p>
					1. <strong>数据用途</strong>：本系统仅用于医院门诊运营流程效率分析，不涉及任何诊断建议或医疗评价。
				</p>
				<p>
					2. <strong>数据脱敏</strong>：所有展示数据均已进行脱敏处理，医生姓名使用编码替代，不包含任何患者个人信息。
				</p>
				<p>
					3. <strong>统计口径</strong>：等待时间统计基于有效时间戳记录，缺失或异常数据已自动排除。
					各科室因业务性质不同，等待时间存在差异属正常现象。
				</p>
				<p>
					4. <strong>异常标注</strong>：系统自动标记异常数据点（如系统故障、极端等待时间等），
					默认排除异常数据进行统计，如需包含请在筛选中调整。
				</p>
			</div>
		</div>
	{/if}
</div>
