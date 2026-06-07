<script lang="ts">
	import AppLayout from '$lib/components/AppLayout.svelte';
	import FilterBar from '$lib/components/FilterBar.svelte';
	import AnomalyDurationChart from '$lib/components/charts/AnomalyDurationChart.svelte';
	import ResponsibilityChart from '$lib/components/charts/ResponsibilityChart.svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { userStore, showToast, filteredAnomalies as filteredAnomaliesStore } from '$lib/stores';
	import { get } from 'svelte/store';
	import {
		getAnomalyDurationStats,
		getResponsibilitySegments,
		getVehicleOptions,
		getCustomerOptions,
		getRouteOptions,
		exportAnomaliesCSV
	} from '$lib/data/dataService';
	import type { AnomalyRecord, AnomalyDurationStats, ResponsibilitySegment } from '$lib/types';
	import {
		getSeverityColor,
		getSeverityLabel,
		getAnomalyTypeLabel,
		getResponsiblePartyLabel,
		formatDateTime,
		formatDuration
	} from '$lib/utils/format';
	import { Download, Check, X, MessageSquare, AlertTriangle } from 'lucide-svelte';

	let loading = true;
	let anomalies: AnomalyRecord[] = [];
	let anomalyDurationData: AnomalyDurationStats[] = [];
	let responsibilityData: ResponsibilitySegment[] = [];
	let selectedAnomaly: AnomalyRecord | null = null;
	let annotationText = '';
	let selectedResponsibleParty = 'unknown';

	const anomalyTypes = [
		{ key: 'over_temp', label: '温度超标' },
		{ key: 'under_temp', label: '温度过低' },
		{ key: 'door_open', label: '开门超时' },
		{ key: 'probe_error', label: '探头故障' },
		{ key: 'delay', label: '到货延迟' }
	];

	const severityLevels = [
		{ key: 'low', label: '低' },
		{ key: 'medium', label: '中' },
		{ key: 'high', label: '高' },
		{ key: 'critical', label: '严重' }
	];

	const responsibleParties = [
		{ key: 'carrier', label: '承运商' },
		{ key: 'warehouse', label: '仓库' },
		{ key: 'customer', label: '客户' },
		{ key: 'equipment', label: '设备' },
		{ key: 'unknown', label: '待确认' }
	];

	let vehicleOptions: { id: string; label: string }[] = [];
	let customerOptions: { id: string; label: string }[] = [];
	let routeOptions: { id: string; label: string }[] = [];

	onMount(async () => {
		if (!$userStore) {
			goto('/login');
			return;
		}

		try {
			vehicleOptions = await getVehicleOptions();
			customerOptions = await getCustomerOptions();
			routeOptions = await getRouteOptions();
			anomalies = get(filteredAnomaliesStore);
			anomalyDurationData = getAnomalyDurationStats();
			responsibilityData = getResponsibilitySegments();
			loading = false;
		} catch (e) {
			showToast('数据加载失败', 'error');
			loading = false;
		}
	});

	function handleFilterChange(filters: any) {
		anomalies = get(filteredAnomaliesStore);
	}

	function handleExport() {
		try {
			exportAnomaliesCSV(anomalies);
			showToast('导出成功', 'success');
		} catch (e) {
			showToast('导出失败', 'error');
		}
	}

	function resolveAnomaly(anomaly: AnomalyRecord | null) {
		if (!anomaly) return;
		anomaly.resolved = true;
		anomaly.resolvedAt = new Date().toISOString();
		showToast('异常已标记为处理', 'success');
		selectedAnomaly = null;
	}

	function saveAnnotation() {
		if (selectedAnomaly && annotationText) {
			if (!selectedAnomaly.annotations) {
				selectedAnomaly.annotations = [];
			}
			selectedAnomaly.annotations.push({
				id: `ann_${Date.now()}`,
				text: annotationText,
				createdAt: new Date().toISOString(),
				createdBy: $userStore?.fullName || $userStore?.username || '未知用户'
			});
			annotationText = '';
			showToast('备注已保存', 'success');
		}
	}

	function updateResponsibleParty() {
		if (selectedAnomaly) {
			selectedAnomaly.responsibleParty = selectedResponsibleParty as any;
			showToast('责任方已更新', 'success');
		}
	}
</script>

<AppLayout>
	{#if loading}
		<div class="flex items-center justify-center h-64">
			<div class="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
		</div>
	{:else}
		<div class="space-y-6">
			<FilterBar
				vehicles={vehicleOptions}
				customers={customerOptions}
				routes={routeOptions}
				anomalyTypes={anomalyTypes}
				severityLevels={severityLevels}
				on:filter-change={handleFilterChange}
				on:export={handleExport}
			/>

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div class="card">
					<div class="card-header flex items-center justify-between">
						<h3 class="text-base font-semibold text-slate-800">异常时长分布</h3>
					</div>
					<div class="card-body">
						<AnomalyDurationChart data={anomalyDurationData} />
					</div>
				</div>

				<div class="card">
					<div class="card-header flex items-center justify-between">
						<h3 class="text-base font-semibold text-slate-800">责任方分布</h3>
					</div>
					<div class="card-body">
						<ResponsibilityChart data={responsibilityData} />
					</div>
				</div>
			</div>

			<div class="card">
				<div class="card-header flex items-center justify-between">
					<h3 class="text-base font-semibold text-slate-800">异常列表</h3>
					<span class="text-sm text-slate-500">共 {anomalies.length} 条记录</span>
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
									<th>操作</th>
								</tr>
							</thead>
							<tbody>
								{#each anomalies as anomaly}
									<tr class="cursor-pointer hover:bg-slate-50" on:click={() => (selectedAnomaly = anomaly)}>
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
										<td>
											<div class="flex gap-2">
												{#if !anomaly.resolved}
													<button
														on:click|stopPropagation={() => resolveAnomaly(anomaly)}
														class="text-green-600 hover:text-green-700 p-1"
														title="标记处理"
													>
														<Check class="w-4 h-4" />
													</button>
												{/if}
												<button
													on:click|stopPropagation={() => goto(`/transport/${anomaly.shipmentId}`)}
													class="text-primary-600 hover:text-primary-700 p-1"
													title="查看详情"
												>
													<MessageSquare class="w-4 h-4" />
												</button>
											</div>
										</td>
									</tr>
								{:else}
									<tr>
										<td colspan="9" class="text-center py-8 text-slate-500">
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

	{#if selectedAnomaly}
		<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<div class="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
				<div class="p-6 border-b border-slate-200 flex items-center justify-between">
					<h3 class="text-lg font-semibold text-slate-800">异常详情</h3>
					<button on:click={() => (selectedAnomaly = null)} class="text-slate-400 hover:text-slate-600">
						<X class="w-5 h-5" />
					</button>
				</div>
				<div class="p-6 space-y-4">
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="text-sm text-slate-500">运单ID</label>
							<p class="font-mono">{selectedAnomaly.shipmentId}</p>
						</div>
						<div>
							<label class="text-sm text-slate-500">批次号</label>
							<p>{selectedAnomaly.batchNo}</p>
						</div>
						<div>
							<label class="text-sm text-slate-500">异常类型</label>
							<p>{getAnomalyTypeLabel(selectedAnomaly.anomalyType)}</p>
						</div>
						<div>
							<label class="text-sm text-slate-500">严重程度</label>
							<span class="badge {getSeverityColor(selectedAnomaly.severity)}">
								{getSeverityLabel(selectedAnomaly.severity)}
							</span>
						</div>
						<div>
							<label class="text-sm text-slate-500">持续时间</label>
							<p class="font-mono">{formatDuration(selectedAnomaly.durationMinutes)}</p>
						</div>
						<div>
							<label class="text-sm text-slate-500">探头校准</label>
							<p>{selectedAnomaly.probeCalibrated ? '已校准' : '未校准'}</p>
						</div>
					</div>

					<div>
						<label class="text-sm text-slate-500">责任方</label>
						<div class="flex gap-2 mt-1">
							<select
								bind:value={selectedResponsibleParty}
								on:change={updateResponsibleParty}
								class="input flex-1"
							>
								{#each responsibleParties as party}
									<option value={party.key}>{party.label}</option>
								{/each}
							</select>
						</div>
					</div>

					<div>
						<label class="text-sm text-slate-500">描述</label>
						<p class="text-slate-700 mt-1">{selectedAnomaly.description}</p>
					</div>

					{#if selectedAnomaly.annotations?.length}
						<div>
							<label class="text-sm text-slate-500">备注历史</label>
							<div class="mt-2 space-y-2">
								{#each selectedAnomaly.annotations as ann}
									<div class="bg-slate-50 p-3 rounded text-sm">
										<div class="flex justify-between text-xs text-slate-500 mb-1">
											<span>{ann.createdBy}</span>
											<span>{formatDateTime(ann.createdAt)}</span>
										</div>
										<p class="text-slate-700">{ann.text}</p>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<div>
						<label class="text-sm text-slate-500">添加备注</label>
						<textarea bind:value={annotationText} class="input mt-1" rows="3" placeholder="输入备注内容..." />
						<button
							on:click={saveAnnotation}
							disabled={!annotationText.trim()}
							class="btn btn-primary mt-2 disabled:opacity-50"
						>
							保存备注
						</button>
					</div>

					{#if !selectedAnomaly.resolved}
						<div class="pt-4 border-t border-slate-200">
							<button
								on:click={() => resolveAnomaly(selectedAnomaly)}
								class="btn btn-success w-full"
							>
								<Check class="w-4 h-4 mr-2" />
								标记为已处理
							</button>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</AppLayout>
