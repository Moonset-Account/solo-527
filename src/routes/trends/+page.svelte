<script lang="ts">
	import { onMount } from 'svelte';
	import FilterPanel from '$components/FilterPanel.svelte';
	import IntradayTrendChart from '$components/charts/IntradayTrendChart.svelte';
	import type { FilterParams, IntradayTrendPoint } from '$types';

	let filters: Partial<FilterParams> = {
		departments: [],
		doctors: [],
		timeSlots: [],
		patientTypes: [],
		processNodes: [],
		excludeAnomalies: true
	};

	let loading = true;
	let intraday: IntradayTrendPoint[] = [];

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

			intraday = data.intraday;
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

	$: peakHours = intraday
		.filter((d) => d.patientCount > 0)
		.sort((a, b) => b.avgWaitTime - a.avgWaitTime)
		.slice(0, 3);
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-gray-900">趋势分析</h1>
		<p class="text-gray-500 mt-1">观察等待时间的日内变化规律和趋势</p>
	</div>

	<FilterPanel {filters} onFilterChange={onFilterChange} />

	{#if loading}
		<div class="flex items-center justify-center py-20">
			<div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
		</div>
	{:else}
		<IntradayTrendChart data={intraday} height="450px" />

		{#if peakHours.length > 0}
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				{#each peakHours as hour, i}
					<div
						class="card {i === 0
							? 'border-2 border-red-200 bg-red-50/50'
							: i === 1
								? 'border-2 border-orange-200 bg-orange-50/50'
								: 'border-2 border-yellow-200 bg-yellow-50/50'}"
					>
						<div class="flex items-center justify-between">
							<span
								class="text-2xl font-bold {i === 0
									? 'text-red-600'
									: i === 1
										? 'text-orange-600'
										: 'text-yellow-600'}"
							>
								#{i + 1}
							</span>
							<span
								class="px-2 py-1 text-xs rounded-full font-medium {i === 0
									? 'bg-red-100 text-red-700'
									: i === 1
										? 'bg-orange-100 text-orange-700'
										: 'bg-yellow-100 text-yellow-700'}"
							>
								高峰时段
							</span>
						</div>
						<div class="mt-3">
							<p class="text-lg font-semibold text-gray-900">{hour.hour}:00 - {hour.hour + 1}:00</p>
							<p class="text-sm text-gray-500">{hour.timeSlot}</p>
						</div>
						<div class="mt-3 flex justify-between items-end">
							<div>
								<p class="text-2xl font-bold text-gray-900">{hour.avgWaitTime}</p>
								<p class="text-xs text-gray-500">平均等待(分钟)</p>
							</div>
							<div>
								<p class="text-xl font-bold text-gray-700">{hour.patientCount}</p>
								<p class="text-xs text-gray-500">就诊人次</p>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<div class="card">
			<h3 class="text-base font-semibold text-gray-800 mb-4">趋势分析要点</h3>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
				<div>
					<h4 class="font-medium text-gray-700 mb-2">📊 高峰时段特征</h4>
					<ul class="space-y-1 list-disc list-inside">
						<li>上午 8:00-10:00 通常为全天最高峰</li>
						<li>下午 14:00-16:00 出现次高峰</li>
						<li>午间时段等待时间相对较短</li>
					</ul>
				</div>
				<div>
					<h4 class="font-medium text-gray-700 mb-2">💡 优化建议</h4>
					<ul class="space-y-1 list-disc list-inside">
						<li>高峰时段建议增加医护人员配置</li>
						<li>引导患者预约非高峰时段就诊</li>
						<li>考虑午间增设值班医生分流</li>
					</ul>
				</div>
			</div>
			<div class="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
				* 以上分析基于历史统计数据，实际情况受当日排班、突发情况等因素影响
			</div>
		</div>
	{/if}
</div>
