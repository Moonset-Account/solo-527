<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { filterStore } from '@/lib/stores/filterStore';
	import type {
		DimensionType,
		DimensionDataPoint,
		OverviewMetrics,
		FunnelDataPoint,
		TrendDataPoint,
		Session
	} from '@/lib/types';
	import {
		getOverviewMetrics,
		getFunnelData,
		getDimensionAnalysis,
		getSatisfactionTrend,
		getFailureExamples
	} from '@/lib/utils/queryService';
	import { formatNumber, formatPercent } from '@/lib/utils/format';

	import FilterBar from '@/lib/components/filters/FilterBar.svelte';
	import DimensionSelector from '@/lib/components/filters/DimensionSelector.svelte';
	import KPICard from '@/lib/components/metrics/KPICard.svelte';
	import FunnelChart from '@/lib/components/charts/FunnelChart.svelte';
	import TrendChart from '@/lib/components/charts/TrendChart.svelte';
	import IntentHeatmap from '@/lib/components/charts/IntentHeatmap.svelte';
	import DimensionTable from '@/lib/components/table/DimensionTable.svelte';
	import FailureExamples from '@/lib/components/common/FailureExamples.svelte';
	import DetailModal from '@/lib/components/modals/DetailModal.svelte';
	import NoteEditor from '@/lib/components/modals/NoteEditor.svelte';

	import { Activity, Users, MessageSquareHeart, RotateCcw, BarChart3 } from 'lucide-svelte';

	let selectedDimension: DimensionType = 'intent';
	let overviewMetrics: OverviewMetrics | null = $state(null);
	let funnelData: FunnelDataPoint[] = $state([]);
	let dimensionData: DimensionDataPoint[] = $state([]);
	let trendData: TrendDataPoint[] = $state([]);
	let failureExamples: Session[] = $state([]);

	let showDetailModal = $state(false);
	let showNoteModal = $state(false);
	let detailDimension = $state<DimensionType>('intent');
	let detailDimensionValue = $state('');
	let noteDimension = $state<DimensionType>('intent');
	let noteDimensionValue = $state('');

	let unsubscribe: (() => void) | null = null;

	function loadAllData() {
		const filters = $filterStore;
		overviewMetrics = getOverviewMetrics(filters);
		funnelData = getFunnelData(filters);
		dimensionData = getDimensionAnalysis(selectedDimension, filters);
		trendData = getSatisfactionTrend('day', filters);
		failureExamples = getFailureExamples(filters, 8);
	}

	$effect(() => {
		loadAllData();
	});

	$effect(() => {
		const filters = $filterStore;
		dimensionData = getDimensionAnalysis(selectedDimension, filters);
	});

	function handleDrilldown(e: { dimension: string; value: string }) {
		detailDimension = e.dimension as DimensionType;
		detailDimensionValue = e.value;
		showDetailModal = true;
	}

	function handleAddNote(e: { dimension: string; value: string }) {
		noteDimension = e.dimension as DimensionType;
		noteDimensionValue = e.value;
		showNoteModal = true;
	}

	function handleHeatmapSelect(e: { dimension: string; value: string }) {
		handleDrilldown(e);
	}

	onMount(() => {
		unsubscribe = filterStore.subscribe(() => {
			loadAllData();
		});
	});

	onDestroy(() => {
		unsubscribe?.();
	});
</script>

<div class="min-h-screen bg-slate-50">
	<header class="bg-white border-b border-slate-200 sticky top-0 z-40">
		<div class="max-w-[1600px] mx-auto px-6 py-4">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
						<BarChart3 class="w-6 h-6 text-white" />
					</div>
					<div>
						<h1 class="text-xl font-bold text-slate-900">客服机器人转人工率分析</h1>
						<p class="text-sm text-slate-500">运营复盘工作台</p>
					</div>
				</div>
				<div class="flex items-center gap-3">
					<div class="text-right">
						<p class="text-sm font-medium text-slate-700">数据更新时间</p>
						<p class="text-xs text-slate-400 font-mono">{new Date().toLocaleString('zh-CN')}</p>
					</div>
				</div>
			</div>
		</div>
	</header>

	<main class="max-w-[1600px] mx-auto px-6 py-6">
		<FilterBar />

		{#if overviewMetrics}
			<div class="grid grid-cols-6 gap-4 mb-6">
				<KPICard
					title="总会话量"
					value={formatNumber(overviewMetrics.total_sessions)}
					variant="default"
				>
					<svelte:fragment slot="icon">
						<MessageSquareHeart class="w-8 h-8" />
					</svelte:fragment>
				</KPICard>
				<KPICard
					title="转人工率"
					value={formatPercent(overviewMetrics.transfer_rate)}
					variant={overviewMetrics.transfer_rate > 0.3 ? 'danger' : 'success'}
				/>
				<KPICard
					title="转人工次数"
					value={formatNumber(overviewMetrics.total_transfers)}
					variant="warning"
				>
					<svelte:fragment slot="icon">
						<Users class="w-8 h-8" />
					</svelte:fragment>
				</KPICard>
				<KPICard
					title="机器人解决率"
					value={formatPercent(overviewMetrics.resolved_by_bot / overviewMetrics.total_sessions)}
					variant="success"
				>
					<svelte:fragment slot="icon">
						<Activity class="w-8 h-8" />
					</svelte:fragment>
				</KPICard>
				<KPICard
					title="平均满意度"
					value={overviewMetrics.avg_satisfaction.toFixed(2)}
					variant={overviewMetrics.avg_satisfaction < 3.5 ? 'warning' : 'success'}
				/>
				<KPICard
					title="平均会话轮次"
					value={overviewMetrics.avg_rounds.toFixed(1)}
					variant="default"
				>
					<svelte:fragment slot="icon">
						<RotateCcw class="w-8 h-8" />
					</svelte:fragment>
				</KPICard>
			</div>
		{/if}

		<div class="grid grid-cols-12 gap-6 mb-6">
			<div class="col-span-5">
				<div class="card">
					<FunnelChart data={funnelData} />
				</div>
			</div>

			<div class="col-span-7">
				<div class="card">
					<div class="flex items-center justify-between mb-4">
						<DimensionSelector bind:selected={selectedDimension} />
					</div>
					<DimensionTable
						data={dimensionData}
						on:drilldown={handleDrilldown}
						on:addNote={handleAddNote}
					/>
				</div>
			</div>
		</div>

		<div class="grid grid-cols-12 gap-6">
			<div class="col-span-5">
				<div class="card">
					<IntentHeatmap data={dimensionData} on:select={handleHeatmapSelect} />
				</div>
			</div>

			<div class="col-span-4">
				<div class="card">
					<TrendChart data={trendData} />
				</div>
			</div>

			<div class="col-span-3">
				<FailureExamples data={failureExamples} />
			</div>
		</div>

		<div class="mt-6 card">
			<div class="flex items-center gap-2 mb-4">
				<h3 class="text-base font-semibold text-slate-900">口径说明</h3>
			</div>
			<div class="grid grid-cols-3 gap-6 text-sm text-slate-600">
				<div>
					<h4 class="font-medium text-slate-700 mb-2">转人工率</h4>
					<p>转人工会话数 / 总会话数 × 100%</p>
					<p class="text-slate-400 mt-1">统计周期内，所有触达机器人后转人工的会话占比</p>
				</div>
				<div>
					<h4 class="font-medium text-slate-700 mb-2">满意度</h4>
					<p>用户主动评价的平均分（满分5分）</p>
					<p class="text-slate-400 mt-1">仅统计有满意度评价的会话</p>
				</div>
				<div>
					<h4 class="font-medium text-slate-700 mb-2">低样本判定</h4>
					<p>样本量 < 30 的维度标记为低样本</p>
					<p class="text-slate-400 mt-1">低样本数据的排序结论仅供参考，请结合业务场景判断</p>
				</div>
			</div>
		</div>
	</main>

	{#if showDetailModal}
		<DetailModal
			dimension={detailDimension}
			dimensionValue={detailDimensionValue}
			on:close={() => (showDetailModal = false)}
			on:addNote={(e) => {
				showDetailModal = false;
				noteDimension = e.detail.dimension;
				noteDimensionValue = e.detail.value;
				showNoteModal = true;
			}}
		/>
	{/if}

	{#if showNoteModal}
		<NoteEditor
			dimension={noteDimension}
			dimensionValue={noteDimensionValue}
			on:close={() => (showNoteModal = false)}
		/>
	{/if}
</div>
