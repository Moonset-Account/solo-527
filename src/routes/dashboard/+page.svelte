<script lang="ts">
	import AppLayout from '$lib/components/AppLayout.svelte';
	import KPICard from '$lib/components/KPICard.svelte';
	import AnomalyDurationChart from '$lib/components/charts/AnomalyDurationChart.svelte';
	import ResponsibilityChart from '$lib/components/charts/ResponsibilityChart.svelte';
	import { Truck, AlertTriangle, ThermometerSnowflake, Clock, TrendingUp } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { userStore, showToast, filteredAnomalies } from '$lib/stores';
	import { get } from 'svelte/store';
	import {
		getKPISummary,
		getAnomalyDurationStats,
		getResponsibilitySegments
	} from '$lib/data/dataService';
	import type { KPISummary, AnomalyDurationStats, ResponsibilitySegment, AnomalyRecord } from '$lib/types';
	import { getSeverityColor, getSeverityLabel, getAnomalyTypeLabel, getResponsiblePartyLabel, formatDateTime, formatDuration } from '$lib/utils/format';

	let loading = true;
	let kpiData: KPISummary | null = null;
	let anomalyDurationData: AnomalyDurationStats[] = [];
	let responsibilityData: ResponsibilitySegment[] = [];
	let recentAnomalies: AnomalyRecord[] = [];

	onMount(async () => {
		if (!$userStore) {
			goto('/login');
			return;
		}

		try {
			kpiData = getKPISummary();
			anomalyDurationData = getAnomalyDurationStats();
			responsibilityData = getResponsibilitySegments();
			recentAnomalies = get(filteredAnomalies).slice(0, 5);
			loading = false;
		} catch (e) {
			showToast('数据加载失败', 'error');
			loading = false;
		}
	});
</script>

<AppLayout>
	{#if loading}
		<div class="flex items-center justify-center h-64">
			<div class="text-center">
				<div class="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
				<p class="text-slate-600">正在加载数据...</p>
			</div>
		</div>
	{:else}
		<div class="space-y-6">
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				<KPICard
					title="运单总数"
					value={kpiData?.totalShipments || 0}
					icon={Truck}
					trend={3.2}
					trendLabel="较上周"
				/>
				<KPICard
					title="在途运单"
					value={kpiData?.activeShipments || 0}
					icon={TrendingUp}
					color="green"
					trendLabel="实时"
				/>
				<KPICard
					title="温控合规率"
					value={`${kpiData?.complianceRate || 0}%`}
					icon={ThermometerSnowflake}
					trend={1.5}
					trendLabel="较上周"
					subtitle={`平均温度 ${kpiData?.averageTemperature || 0}°C`}
				/>
				<KPICard
					title="异常事件"
					value={kpiData?.totalAnomalies || 0}
					icon={AlertTriangle}
					color="red"
					trend={-8.3}
					trendLabel="较上周"
					subtitle={`平均延误 ${kpiData?.avgDeliveryDelayMinutes || 0} 分钟`}
				/>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div class="card">
					<div class="card-header flex items-center justify-between">
						<h3 class="text-base font-semibold text-slate-800">异常时长统计</h3>
						<span class="text-xs text-slate-500">按责任方分类</span>
					</div>
					<div class="card-body">
						<AnomalyDurationChart data={anomalyDurationData} />
					</div>
				</div>

				<div class="card">
					<div class="card-header flex items-center justify-between">
						<h3 class="text-base font-semibold text-slate-800">责任段定位</h3>
						<span class="text-xs text-slate-500">异常责任归属</span>
					</div>
					<div class="card-body">
						<ResponsibilityChart data={responsibilityData} />
					</div>
				</div>
			</div>

			<div class="card">
				<div class="card-header flex items-center justify-between">
					<h3 class="text-base font-semibold text-slate-800">最近异常</h3>
					<button on:click={() => goto('/anomaly')} class="text-sm text-primary-600 hover:text-primary-700">
						查看全部
					</button>
				</div>
				<div class="card-body p-0">
					<div class="overflow-x-auto">
						<table class="table">
							<thead>
								<tr>
									<th>运单ID</th>
									<th>批次号</th>
									<th>异常类型</th>
									<th>严重程度</th>
									<th>责任方</th>
									<th>持续时间</th>
									<th>发生时间</th>
									<th>状态</th>
								</tr>
							</thead>
							<tbody>
								{#each recentAnomalies as anomaly}
									<tr class="cursor-pointer hover:bg-slate-50" on:click={() => goto(`/transport/${anomaly.shipmentId}`)}>
										<td class="font-mono text-sm">{anomaly.shipmentId}</td>
										<td class="text-sm">{anomaly.batchNo}</td>
										<td>
											<span class="inline-flex items-center gap-1">
												<AlertTriangle class="w-4 h-4 {getSeverityColor(anomaly.severity).replace('bg-', 'text-')}" />
												{getAnomalyTypeLabel(anomaly.anomalyType)}
											</span>
										</td>
										<td>
											<span class="badge {getSeverityColor(anomaly.severity)}">
												{getSeverityLabel(anomaly.severity)}
											</span>
										</td>
										<td class="text-sm">{getResponsiblePartyLabel(anomaly.responsibleParty || 'unknown')}</td>
										<td class="text-sm font-mono">{formatDuration(anomaly.durationMinutes)}</td>
										<td class="text-sm text-slate-500">{formatDateTime(anomaly.startTime)}</td>
										<td>
											<span class="badge {anomaly.resolved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}">
												{anomaly.resolved ? '已处理' : '待处理'}
											</span>
										</td>
									</tr>
								{:else}
									<tr>
										<td colspan="8" class="text-center py-8 text-slate-500">
											<AlertTriangle class="w-12 h-12 mx-auto mb-2 text-slate-300" />
											<p>暂无异常数据</p>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	{/if}
</AppLayout>
