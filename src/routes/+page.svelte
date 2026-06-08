<script lang="ts">
	import { onMount } from 'svelte';
	import { filterStore, globalLoading } from '$lib/store';
	import {
		initDB,
		isDuckDBActive,
		queryPathFlow,
		queryBottleneck,
		queryHeatmap,
		queryVersionCompare,
		queryDiscussions,
		queryRefunds,
		getSampleSize
	} from '$lib/db';
	import type {
		PathFlowNode,
		PathFlowLink,
		BottleneckData,
		HeatmapData,
		VersionCompareData,
		DiscussionRecord,
		RefundRecord,
		FilterState
	} from '$lib/types';
	import FilterSidebar from '$lib/components/FilterSidebar.svelte';
	import PathFlow from '$lib/components/PathFlow.svelte';
	import BottleneckChart from '$lib/components/BottleneckChart.svelte';
	import HeatmapChart from '$lib/components/HeatmapChart.svelte';
	import VersionCompare from '$lib/components/VersionCompare.svelte';
	import DiscussionPanel from '$lib/components/DiscussionPanel.svelte';
	import RefundPanel from '$lib/components/RefundPanel.svelte';
	import ReportExport from '$lib/components/ReportExport.svelte';

	let dbReady = $state(false);
	let duckdbStatus = $state('');
	let currentSampleSize = $state(0);
	let pathNodes = $state<PathFlowNode[]>([]);
	let pathLinks = $state<PathFlowLink[]>([]);
	let bottlenecks = $state<BottleneckData[]>([]);
	let heatmapData = $state<HeatmapData[]>([]);
	let versionData = $state<VersionCompareData[]>([]);
	let discussions = $state<DiscussionRecord[]>([]);
	let refunds = $state<RefundRecord[]>([]);
	let loading = $state(false);

	async function refreshAll(filter?: FilterState) {
		const f = filter || filterStore.getCurrent();
		loading = true;
		try {
			currentSampleSize = getSampleSize(f);
			const [pf, bn, hm, vc, disc, ref] = await Promise.all([
				queryPathFlow(f),
				queryBottleneck(f),
				queryHeatmap(f),
				queryVersionCompare(f),
				queryDiscussions(f),
				queryRefunds(f)
			]);
			pathNodes = pf.nodes;
			pathLinks = pf.links;
			bottlenecks = bn;
			heatmapData = hm;
			versionData = vc;
			discussions = disc;
			refunds = ref;
		} finally {
			loading = false;
		}
	}

	onMount(async () => {
		const duckDBReady = await initDB();
		duckdbStatus = duckDBReady ? 'DuckDB-WASM' : '内存聚合';
		dbReady = true;
		await refreshAll();
	});

	let lastFilterStr = '';

	$effect(() => {
		const unsub = filterStore.subscribe((f) => {
			const fStr = JSON.stringify(f);
			if (dbReady && fStr !== lastFilterStr) {
				lastFilterStr = fStr;
				refreshAll(f);
			}
		});
		return unsub;
	});
</script>

<div class="dashboard">
	{#if !dbReady}
		<div class="loading">
			<div class="spinner"></div>
			<p>正在初始化数据引擎...</p>
		</div>
	{:else}
		<aside class="sidebar">
			<FilterSidebar onfilterchange={(f: FilterState) => refreshAll(f)} />
		</aside>
		<main class="content">
			<header class="top-bar">
				<h1>网课学习路径分析</h1>
				<div class="top-right">
					<span class="engine-badge">{duckdbStatus}</span>
					<span class="sample-badge">样本量: {currentSampleSize}</span>
					{#if loading}
						<span class="loading-indicator">刷新中...</span>
					{/if}
				</div>
			</header>

			<ReportExport
				{pathNodes}
				{pathLinks}
				{bottlenecks}
				{heatmapData}
				{versionData}
				{discussions}
				{refunds}
				sampleSize={currentSampleSize}
			/>

			<div class="chart-grid">
				<div class="chart-row full">
					<PathFlow bind:nodes={pathNodes} bind:links={pathLinks} {loading} />
				</div>
				<div class="chart-row">
					<BottleneckChart bind:data={bottlenecks} {loading} />
					<VersionCompare bind:data={versionData} {loading} />
				</div>
				<div class="chart-row">
					<HeatmapChart bind:data={heatmapData} {loading} />
				</div>
				<div class="chart-row">
					<DiscussionPanel {discussions} />
					<RefundPanel {refunds} />
				</div>
			</div>
		</main>
	{/if}
</div>

<style>
	.dashboard {
		display: flex;
		height: 100vh;
		overflow: hidden;
		background: #f0f2f5;
	}

	.sidebar {
		width: 260px;
		flex-shrink: 0;
		overflow-y: auto;
	}

	.content {
		flex: 1;
		overflow-y: auto;
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.top-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.top-bar h1 {
		margin: 0;
		font-size: 18px;
		font-weight: 700;
		color: #1a1a1a;
	}

	.top-right {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.engine-badge {
		font-size: 11px;
		color: #52c41a;
		background: #f6ffed;
		border: 1px solid #b7eb8f;
		padding: 2px 8px;
		border-radius: 3px;
	}

	.sample-badge {
		font-size: 11px;
		color: #1890ff;
		background: #e6f7ff;
		border: 1px solid #91d5ff;
		padding: 2px 8px;
		border-radius: 3px;
	}

	.loading-indicator {
		font-size: 12px;
		color: #1890ff;
		animation: pulse 1s infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.4; }
	}

	.chart-grid {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.chart-row {
		display: flex;
		gap: 16px;
	}

	.chart-row.full {
		width: 100%;
	}

	:global(.chart-row > *) {
		flex: 1;
		min-width: 0;
	}

	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100vh;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 3px solid #e8e8e8;
		border-top-color: #1890ff;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.loading p {
		margin-top: 16px;
		color: #666;
		font-size: 14px;
	}
</style>
