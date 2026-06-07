<script lang="ts">
	import { onMount } from 'svelte';
	import { filters, filterOptions } from '$lib/stores/filters';
	import { fetchFilters, fetchFunnel, fetchActivities } from '$lib/api/client';
	import type { FunnelResponse, Activity } from '$lib/types';
	import FunnelChart from '$lib/components/FunnelChart.svelte';
	import MetricCard from '$lib/components/MetricCard.svelte';
	import FilterPanel from '$lib/components/FilterPanel.svelte';
	import BarChart from '$lib/components/BarChart.svelte';
	import ActivityTable from '$lib/components/ActivityTable.svelte';
	import ExportModal from '$lib/components/ExportModal.svelte';

	let loading = true;
	let activitiesLoading = false;
	let funnelData: FunnelResponse | null = null;
	let activities: Activity[] = [];
	let showExportModal = false;

	onMount(async () => {
		try {
			const options = await fetchFilters();
			filterOptions.set(options);
			await loadData();
		} catch (e) {
			console.error('Failed to initialize:', e);
		} finally {
			loading = false;
		}
	});

	async function loadData() {
		loading = true;
		activitiesLoading = true;
		try {
			const [funnelRes, activitiesRes] = await Promise.all([
				fetchFunnel($filters),
				fetchActivities($filters)
			]);
			funnelData = funnelRes;
			activities = activitiesRes.activities;
		} catch (e) {
			console.error('Failed to load data:', e);
		} finally {
			loading = false;
			activitiesLoading = false;
		}
	}

	function formatPercent(value: number): string {
		return `${value.toFixed(1)}%`;
	}
</script>

<div class="min-h-screen bg-gray-50">
	<header class="bg-white border-b border-gray-200 sticky top-0 z-40">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex items-center justify-between h-16">
				<div class="flex items-center gap-3">
					<div class="w-8 h-8 bg-primary-700 rounded-lg flex items-center justify-center">
						<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
						</svg>
					</div>
					<div>
						<h1 class="text-lg font-semibold text-gray-800">社区活动报名转化分析</h1>
						<p class="text-xs text-gray-500">数据驱动的活动决策支持</p>
					</div>
				</div>
				<div class="flex items-center gap-3">
					<div class="flex items-center gap-2 text-sm text-gray-600">
						<input
							type="date"
							bind:value={$filters.startDate}
							class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
						/>
						<span>至</span>
						<input
							type="date"
							bind:value={$filters.endDate}
							class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
						/>
					</div>
					<button
						class="btn btn-primary flex items-center gap-2"
						on:click={() => (showExportModal = true)}
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
						</svg>
						导出数据
					</button>
				</div>
			</div>
		</div>
	</header>

	<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
		{#if funnelData && funnelData.sampleSize < 30}
			<div class="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 flex items-center gap-3">
				<svg class="w-5 h-5 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
				</svg>
				<div class="text-sm text-yellow-700">
					当前筛选条件下样本量为 <span class="font-mono font-medium">{funnelData.sampleSize}</span>，
					样本量较小，统计结果可能不具备代表性，请谨慎使用。
				</div>
			</div>
		{/if}

		{#if funnelData?.hasMinorData}
			<div class="mb-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center gap-3">
				<svg class="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
				</svg>
				<div class="text-sm text-blue-700">
					🔒 当前数据包含未成年人信息，系统已自动聚合展示，无法导出个人明细数据。
				</div>
			</div>
		{/if}

		<div class="flex gap-6">
			<aside class="w-64 flex-shrink-0">
				<div class="sticky top-24">
					<FilterPanel loading={loading} onApply={loadData} />
				</div>
			</aside>

			<div class="flex-1 space-y-6">
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					<MetricCard
						title="总浏览量"
						value={funnelData?.funnel[0]?.count.toLocaleString() || 0}
						subtitle="预估展示次数"
					/>
					<MetricCard
						title="报名人数"
						value={funnelData?.funnel[1]?.count.toLocaleString() || 0}
						subtitle="报名转化率 {funnelData ? formatPercent(funnelData.funnel[1]?.totalRate || 0) : '0%'}"
					/>
					<MetricCard
						title="签到人数"
						value={funnelData?.funnel[2]?.count.toLocaleString() || 0}
						subtitle="签到率 {funnelData ? formatPercent(funnelData.funnel[2]?.rate || 0) : '0%'}"
					/>
					<MetricCard
						title="取消人数"
						value={funnelData?.funnel[3]?.count.toLocaleString() || 0}
						subtitle="取消率 {funnelData ? formatPercent(funnelData.funnel[3]?.rate || 0) : '0%'}"
					/>
				</div>

				<div class="card p-6">
					<div class="flex items-center justify-between mb-4">
						<h2 class="text-lg font-semibold text-gray-800">转化漏斗</h2>
						<div class="text-sm text-gray-500">
							浏览 → 报名 → 签到 → 取消 → 反馈
						</div>
					</div>
					{#if loading}
						<div class="h-96 flex items-center justify-center">
							<div class="animate-pulse flex flex-col items-center gap-3">
								<div class="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
								<span class="text-sm text-gray-500">加载数据中...</span>
							</div>
						</div>
					{:else if funnelData}
						<FunnelChart data={funnelData.funnel} />
					{/if}
				</div>

				<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{#if funnelData}
						<BarChart data={funnelData.byActivityType} title="各活动类型转化对比" />
					{/if}

					<div class="card p-4">
						<h3 class="font-semibold text-gray-800 mb-4">取消原因分布</h3>
						{#if funnelData?.cancelReasons && funnelData.cancelReasons.length > 0}
							<div class="space-y-3">
								{#each funnelData.cancelReasons as reason}
									<div>
										<div class="flex items-center justify-between text-sm mb-1">
											<span class="text-gray-700">{reason.tag}</span>
											<span class="font-mono text-gray-500">{reason.count}</span>
										</div>
										<div class="w-full bg-gray-100 rounded-full h-2">
											<div
												class="bg-red-500 h-2 rounded-full transition-all duration-500"
												style="width: {Math.min(100, (reason.count / (funnelData?.funnel[3]?.count || 1)) * 100)}%"
											></div>
										</div>
									</div>
								{/each}
							</div>
						{:else}
							<div class="text-center text-gray-400 py-8">暂无取消数据</div>
						{/if}
					</div>
				</div>

				<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<div class="card p-4">
						<h3 class="font-semibold text-gray-800 mb-4">反馈主题分析</h3>
						{#if funnelData?.feedbackTopics && funnelData.feedbackTopics.length > 0}
							<div class="flex flex-wrap gap-2">
								{#each funnelData.feedbackTopics as topic}
									<span
										class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700 border border-blue-100"
										style="font-size: {Math.max(12, Math.min(18, 12 + topic.count * 0.3))}px"
									>
										{topic.topic}
										<span class="ml-1 text-blue-400 text-xs">{topic.count}</span>
									</span>
								{/each}
							</div>
						{:else}
							<div class="text-center text-gray-400 py-8">暂无反馈数据</div>
						{/if}
					</div>

					<div class="card p-4">
						<h3 class="font-semibold text-gray-800 mb-4">候补转正说明</h3>
						<div class="text-sm text-gray-600 space-y-2">
							<p>✅ 候补转正的报名数据从<strong>原始报名时间</strong>开始计算</p>
							<p>✅ 不按确认候补成功的时间重新排序</p>
							<p>✅ 确保报名时序的准确性和公平性</p>
							<p class="text-xs text-gray-400 mt-3">
								数据字段：original_register_time 用于存储候补用户的原始报名时间
							</p>
						</div>
					</div>
				</div>

				<ActivityTable {activities} loading={activitiesLoading} />
			</div>
		</div>
	</main>

	<ExportModal isOpen={showExportModal} onClose={() => (showExportModal = false)} />
</div>
