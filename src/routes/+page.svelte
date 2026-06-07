<script lang="ts">
	import {
		getFilter,
		setFilter,
		resetFilter
	} from '$lib/stores/index.svelte';
	import {
		computeFunnelData,
		computeTurnoverRanking,
		computeAgeDistribution,
		computeReplenishment,
		computeNearExpiryAlerts,
		detectAnomalies
	} from '$lib/utils/analytics';
	import {
		allSkuIds,
		allSupplierIds,
		allWarehousePositions,
		allBatchNos
	} from '$lib/data/mock-data';
	import { onMount } from 'svelte';
	import type {
		FunnelData,
		TurnoverRanking,
		ReplenishmentSuggestion,
		NearExpiryAlert,
		AnomalyPoint,
		FilterState
	} from '$lib/types';
	import FilterPanel from '$lib/components/FilterPanel.svelte';
	import FunnelChart from '$lib/components/FunnelChart.svelte';
	import AgeDistributionChart from '$lib/components/AgeDistributionChart.svelte';
	import TurnoverRankingChart from '$lib/components/TurnoverRankingChart.svelte';
	import ReplenishmentTable from '$lib/components/ReplenishmentTable.svelte';
	import NearExpiryAlerts from '$lib/components/NearExpiryAlerts.svelte';
	import AnomalyPanel from '$lib/components/AnomalyPanel.svelte';

	let funnelData = $state<FunnelData | null>(null);
	let turnoverRanking = $state<TurnoverRanking[]>([]);
	let ageDistribution = $state<Array<{ age_bucket: string; batch_no: string; quantity: number }>>([]);
	let replenishment = $state<ReplenishmentSuggestion[]>([]);
	let nearExpiryAlerts = $state<NearExpiryAlert[]>([]);
	let anomalies = $state<AnomalyPoint[]>([]);
	let loading = $state(true);
	let mounted = $state(false);

	const ageBucketOptions = ['0-30', '30-60', '60-90', '90-180', '180+'];

	const summaryStats = $derived.by(() => {
		if (!funnelData) return null;
		return {
			totalInbound: funnelData.total_inbound,
			currentInventory: funnelData.current_inventory,
			effectiveTurnover: (funnelData.effective_turnover * 100).toFixed(1) + '%',
			fastTurnover: (funnelData.fast_turnover * 100).toFixed(1) + '%'
		};
	});

	function refreshData(filters: Partial<FilterState>) {
		loading = true;
		funnelData = computeFunnelData(filters);
		turnoverRanking = computeTurnoverRanking(filters);
		ageDistribution = computeAgeDistribution(filters);
		replenishment = computeReplenishment(filters);
		nearExpiryAlerts = computeNearExpiryAlerts(filters);
		anomalies = detectAnomalies(filters);
		loading = false;
	}

	function handleFilterChange(filter: {
		sku_ids: string[];
		warehouse_positions: string[];
		supplier_ids: string[];
		batch_nos: string[];
		age_buckets: string[];
		date_range: { start: string; end: string };
	}) {
		setFilter(filter as FilterState);
		refreshData(filter);
	}

	function handleReset() {
		resetFilter();
		refreshData({});
	}

	onMount(() => {
		mounted = true;
		const filter = getFilter();
		refreshData(filter);
	});
</script>

<div class="dashboard">
	{#if !mounted}
		<div class="loading-state">
			<div class="spinner"></div>
			<span>数据加载中...</span>
		</div>
	{:else}
	<section class="filter-section">
		<div class="card filter-card">
			<div class="card-header">
				<h3>筛选条件</h3>
				<button type="button" class="btn-reset-filter" onclick={handleReset}>重置筛选</button>
			</div>
			<div class="card-body">
				<FilterPanel
					skuOptions={allSkuIds}
					warehouseOptions={allWarehousePositions}
					supplierOptions={allSupplierIds}
					batchOptions={allBatchNos}
					ageBucketOptions={ageBucketOptions}
					onFilterChange={handleFilterChange}
				/>
			</div>
		</div>
	</section>

	{#if loading}
		<div class="loading-state">
			<div class="spinner"></div>
			<span>数据加载中...</span>
		</div>
	{:else}
		<div id="dashboard-content">
			<section class="summary-row">
				{#if summaryStats}
					<div class="stat-card">
						<div class="stat-icon" style="background-color: rgba(59, 89, 152, 0.1);">
							<svg viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" width="22" height="22">
								<path d="M12 5v14M5 12h14" />
							</svg>
						</div>
						<div class="stat-info">
							<span class="stat-label">入库总量</span>
							<span class="stat-value">{summaryStats.totalInbound.toLocaleString()}</span>
						</div>
					</div>
					<div class="stat-card">
						<div class="stat-icon" style="background-color: rgba(46, 205, 167, 0.1);">
							<svg viewBox="0 0 24 24" fill="none" stroke="var(--color-secondary)" stroke-width="2" width="22" height="22">
								<rect x="3" y="3" width="18" height="18" rx="2" />
								<path d="M3 9h18" />
							</svg>
						</div>
						<div class="stat-info">
							<span class="stat-label">当前库存</span>
							<span class="stat-value">{summaryStats.currentInventory.toLocaleString()}</span>
						</div>
					</div>
					<div class="stat-card">
						<div class="stat-icon" style="background-color: rgba(255, 107, 53, 0.1);">
							<svg viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" stroke-width="2" width="22" height="22">
								<polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
							</svg>
						</div>
						<div class="stat-info">
							<span class="stat-label">有效周转率</span>
							<span class="stat-value accent">{summaryStats.effectiveTurnover}</span>
						</div>
					</div>
					<div class="stat-card">
						<div class="stat-icon" style="background-color: rgba(46, 205, 167, 0.1);">
							<svg viewBox="0 0 24 24" fill="none" stroke="var(--color-secondary)" stroke-width="2" width="22" height="22">
								<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
							</svg>
						</div>
						<div class="stat-info">
							<span class="stat-label">快速周转率</span>
							<span class="stat-value secondary">{summaryStats.fastTurnover}</span>
						</div>
					</div>
				{/if}
			</section>

			<section class="dashboard-grid">
				<div class="grid-row">
					<div class="card">
						<div class="card-header">
							<h3>库存漏斗分析</h3>
						</div>
						<div class="card-body">
							<FunnelChart data={funnelData} />
						</div>
					</div>

					<div class="card">
						<div class="card-header">
							<h3>周转率排名</h3>
						</div>
						<div class="card-body">
							<TurnoverRankingChart data={turnoverRanking} />
						</div>
					</div>
				</div>

				<div class="grid-row">
					<div class="card">
						<div class="card-header">
							<h3>库龄分布</h3>
						</div>
						<div class="card-body">
							<AgeDistributionChart data={ageDistribution} />
						</div>
					</div>

					<div class="card">
						<div class="card-header">
							<h3>补货建议</h3>
							{#if replenishment.length > 0}
								<span class="badge accent">{replenishment.length} 条建议</span>
							{/if}
						</div>
						<div class="card-body">
							<ReplenishmentTable data={replenishment} />
						</div>
					</div>
				</div>

				<div class="grid-full">
					<div class="card">
						<div class="card-header">
							<h3>临期预警</h3>
							{#if nearExpiryAlerts.length > 0}
								<span class="badge warning">{nearExpiryAlerts.length} 条预警</span>
							{/if}
						</div>
						<div class="card-body">
							<NearExpiryAlerts data={nearExpiryAlerts} />
						</div>
					</div>
				</div>

				<div class="grid-full">
					<div class="card">
						<div class="card-header">
							<h3>异常检测</h3>
							{#if anomalies.length > 0}
								<span class="badge danger">{anomalies.length} 条异常</span>
							{/if}
						</div>
						<div class="card-body">
							<AnomalyPanel data={anomalies} />
						</div>
					</div>
				</div>
			</section>
		</div>
	{/if}
	{/if}
</div>

<style>
	.dashboard {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.filter-card .card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.btn-reset-filter {
		font-size: 12px;
		padding: 4px 14px;
		border-radius: 6px;
		border: 1px solid var(--color-surface-dark);
		background-color: var(--color-surface);
		color: var(--color-primary);
		cursor: pointer;
		font-family: var(--font-body);
		transition: all 0.15s ease;
	}

	.btn-reset-filter:hover {
		background-color: var(--color-surface-dark);
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 80px 0;
		gap: 16px;
		font-size: 15px;
		color: var(--color-primary);
	}

	.spinner {
		width: 36px;
		height: 36px;
		border: 3px solid var(--color-surface-dark);
		border-top-color: var(--color-accent);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.summary-row {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 16px;
	}

	.stat-card {
		display: flex;
		align-items: center;
		gap: 14px;
		background-color: var(--color-card);
		border-radius: 12px;
		padding: 18px 20px;
		box-shadow: 0 1px 3px rgba(27, 42, 74, 0.06), 0 1px 2px rgba(27, 42, 74, 0.04);
		transition: box-shadow 0.2s ease;
	}

	.stat-card:hover {
		box-shadow: 0 4px 12px rgba(27, 42, 74, 0.1), 0 2px 4px rgba(27, 42, 74, 0.06);
	}

	.stat-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		border-radius: 10px;
		flex-shrink: 0;
	}

	.stat-info {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.stat-label {
		font-size: 12px;
		color: var(--color-primary-light);
		font-family: var(--font-body);
	}

	.stat-value {
		font-family: var(--font-heading);
		font-size: 22px;
		font-weight: 700;
		color: var(--color-primary);
		line-height: 1.2;
	}

	.stat-value.accent {
		color: var(--color-accent);
	}

	.stat-value.secondary {
		color: var(--color-secondary);
	}

	.card {
		background-color: var(--color-card);
		border-radius: 12px;
		box-shadow: 0 1px 3px rgba(27, 42, 74, 0.06), 0 1px 2px rgba(27, 42, 74, 0.04);
		overflow: hidden;
	}

	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 20px;
		border-bottom: 1px solid var(--color-surface-dark);
	}

	.card-header h3 {
		font-family: var(--font-heading);
		font-size: 15px;
		font-weight: 600;
		color: var(--color-primary);
		margin: 0;
	}

	.card-body {
		padding: 20px;
	}

	.badge {
		font-size: 12px;
		padding: 2px 10px;
		border-radius: 999px;
		font-weight: 500;
	}

	.badge.accent {
		background-color: rgba(255, 107, 53, 0.12);
		color: var(--color-accent);
	}

	.badge.warning {
		background-color: rgba(245, 158, 11, 0.12);
		color: var(--color-warning);
	}

	.badge.danger {
		background-color: rgba(239, 68, 68, 0.12);
		color: var(--color-danger);
	}

	.dashboard-grid {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.grid-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 20px;
	}

	.grid-full {
		width: 100%;
	}

	@media (max-width: 1023px) {
		.summary-row {
			grid-template-columns: repeat(2, 1fr);
		}

		.grid-row {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 639px) {
		.summary-row {
			grid-template-columns: 1fr;
		}
	}
</style>
