<script lang="ts">
	import AppLayout from '$lib/components/AppLayout.svelte';
	import FilterBar from '$lib/components/FilterBar.svelte';
	import AnomalyDurationChart from '$lib/components/charts/AnomalyDurationChart.svelte';
	import ResponsibilityChart from '$lib/components/charts/ResponsibilityChart.svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { userStore, showToast } from '$lib/stores';
	import { generateMockData } from '$lib/data/mockData';
	import type { AnomalyRecord, AnomalyDurationStats, ResponsibilitySegment } from '$lib/types';
	import {
		getSeverityColor,
		getSeverityLabel,
		getAnomalyTypeLabel,
		getResponsiblePartyLabel,
		formatDateTime,
		formatDuration,
		downloadCSV
	} from '$lib/utils/format';
	import { Download, Check, X, MessageSquare } from 'lucide-svelte';

	let loading = true;
	let anomalies: AnomalyRecord[] = [];
	let filteredAnomalies: AnomalyRecord[] = [];
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

	const vehicleOptions = [
		{ id: 'v001', label: '京A·12345' },
		{ id: 'v002', label: '京B·67890' },
		{ id: 'v003', label: '沪A·54321' }
	];
	const customerOptions = [
		{ id: 'c001', label: '鲜优生鲜' },
		{ id: 'c002', label: '康泰医药' }
	];
	const routeOptions = [
		{ id: 'r001', label: '北京-上海' },
		{ id: 'r002', label: '北京-广州' }
	];

	onMount(async () => {
		if (!$userStore) {
			goto('/login');
			return;
		}

		try {
			const mockData = generateMockData();
			anomalies = mockData.anomalyRecords;
			filteredAnomalies = anomalies;

			const typeStats = new Map<string, AnomalyDurationStats>();
			const typeLabels: Record<string, string> = {
				over_temp: '温度超标',
				under_temp: '温度过低',
				door_open: '开门超时',
				probe_error: '探头故障',
				delay: '到货延迟'
			};
			const typeColors: Record<string, string> = {
				over_temp: '#F44336',
				under_temp: '#2196F3',
				door_open: '#FF9800',
				probe_error: '#9C27B0',
				delay: '#FFC107'
			};

			for (const a of anomalies) {
				if (!typeStats.has(a.anomalyType)) {
					typeStats.set(a.anomalyType, {
						type: a.anomalyType,
						label: typeLabels[a.anomalyType] || a.anomalyType,
						totalMinutes: 0,
						count: 0,
						color: typeColors[a.anomalyType] || '#999',
						children: []
					});
				}
				const stat = typeStats.get(a.anomalyType)!;
				stat.totalMinutes += a.durationMinutes;
				stat.count += 1;
			}
			anomalyDurationData = Array.from(typeStats.values());

			const partyColors: Record<string, string> = {
				carrier: '#0F4C81',
				warehouse: '#4CAF50',
				customer: '#FF9800',
				equipment: '#9C27B0',
				unknown: '#9E9E9E'
			};
			const partyLabels: Record<string, string> = {
				carrier: '承运商',
				warehouse: '仓库',
				customer: '客户',
				equipment: '设备',
				unknown: '待确认'
			};

			responsibilityData = anomalies.slice(0, 15).map((a) => {
				const shipment = mockData.shipments.find((s) => s.id === a.shipmentId);
				return {
					id: a.id,
					shipmentId: a.shipmentId,
					batchNo: shipment?.batchNo || 'N/A',
					party: a.responsibleParty as any,
					partyLabel: partyLabels[a.responsibleParty] || a.responsibleParty,
					startTime: new Date(a.startTime),
					endTime: new Date(a.endTime),
					durationMinutes: a.durationMinutes,
					anomalyType: a.anomalyType,
					color: partyColors[a.responsibleParty] || '#999'
				};
			});

			loading = false;
		} catch (e) {
			showToast('数据加载失败', 'error');
			loading = false;
		}
	});

	function handleAnnotate() {
		if (!selectedAnomaly) return;

		selectedAnomaly.annotation = annotationText;
		selectedAnomaly.responsibleParty = selectedResponsibleParty as any;
		selectedAnomaly.status = 'confirmed';

		showToast('异常标注已保存', 'success');
		selectedAnomaly = null;
		annotationText = '';
	}

	function handleExport() {
		const exportData = filteredAnomalies.map((a) => ({
			id: a.id,
			shipmentId: a.shipmentId,
			异常类型: getAnomalyTypeLabel(a.anomalyType),
			严重程度: getSeverityLabel(a.severity),
			责任方: getResponsiblePartyLabel(a.responsibleParty),
			开始时间: formatDateTime(a.startTime),
			结束时间: formatDateTime(a.endTime),
			持续分钟: a.durationMinutes,
			状态: a.status,
			备注: a.annotation || ''
		}));
		downloadCSV(exportData, '异常记录');
		showToast('导出成功', 'success');
	}
</script>

<AppLayout>
	{#if loading}
		<div class="flex items-center justify-center h-64">
			<div class="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full mx-auto" />
		</div>
	{:else}
		<div class="space-y-6">
			<FilterBar
				vehicles={vehicleOptions}
				customers={customerOptions}
				routes={routeOptions}
				anomalyTypes={anomalyTypes}
				severityLevels={severityLevels}
			/>

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<AnomalyDurationChart data={anomalyDurationData} />
				<ResponsibilityChart data={responsibilityData} />
			</div>

			<div class="card">
				<div class="card-header flex items-center justify-between">
					<div>
						<h3 class="text-base font-semibold text-slate-800">异常记录列表</h3>
						<p class="text-sm text-slate-500 mt-1">共 {filteredAnomalies.length} 条异常记录</p>
					</div>
					<button on:click={handleExport} class="btn btn-secondary flex items-center gap-2">
						<Download class="w-4 h-4" />
						导出 CSV
					</button>
				</div>
				<div class="overflow-x-auto">
					<table class="table">
						<thead>
							<tr>
								<th>运单ID</th>
								<th>异常类型</th>
								<th>严重程度</th>
								<th>责任方</th>
								<th>开始时间</th>
								<th>持续时长</th>
								<th>状态</th>
								<th>操作</th>
							</tr>
						</thead>
						<tbody>
							{#each filteredAnomalies as anomaly}
								<tr>
									<td class="font-mono font-medium text-primary-600 cursor-pointer" on:click={() => goto(`/transport/${anomaly.shipmentId}`)}>
										{anomaly.shipmentId}
									</td>
									<td>{getAnomalyTypeLabel(anomaly.anomalyType)}</td>
									<td>
										<span class="badge {getSeverityColor(anomaly.severity)}">
											{getSeverityLabel(anomaly.severity)}
										</span>
									</td>
									<td>{getResponsiblePartyLabel(anomaly.responsibleParty)}</td>
									<td>{formatDateTime(anomaly.startTime)}</td>
									<td class="font-mono">{formatDuration(anomaly.durationMinutes)}</td>
									<td>
										<span
											class="badge {anomaly.status === 'pending'
												? 'bg-yellow-100 text-yellow-800'
												: anomaly.status === 'confirmed'
													? 'bg-blue-100 text-blue-800'
													: 'bg-green-100 text-green-800'}"
										>
											{anomaly.status === 'pending'
												? '待处理'
												: anomaly.status === 'confirmed'
													? '已确认'
													: '已解决'}
										</span>
									</td>
									<td>
										<button
											on:click={() => {
												selectedAnomaly = anomaly;
												annotationText = anomaly.annotation || '';
												selectedResponsibleParty = anomaly.responsibleParty;
											}}
											class="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1"
										>
											<MessageSquare class="w-4 h-4" />
											标注
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	{/if}

	{#if selectedAnomaly}
		<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" on:click={() => (selectedAnomaly = null)}>
			<div class="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl" on:click|stopPropagation>
				<h3 class="text-lg font-semibold text-slate-800 mb-4">异常标注处理</h3>

				<div class="space-y-4 mb-6">
					<div class="p-3 bg-slate-50 rounded-lg">
						<div class="grid grid-cols-2 gap-4 text-sm">
							<div>
								<span class="text-slate-500">运单ID:</span>
								<span class="font-mono ml-2">{selectedAnomaly.shipmentId}</span>
							</div>
							<div>
								<span class="text-slate-500">异常类型:</span>
								<span class="ml-2">{getAnomalyTypeLabel(selectedAnomaly.anomalyType)}</span>
							</div>
							<div>
								<span class="text-slate-500">严重程度:</span>
								<span class="ml-2">{getSeverityLabel(selectedAnomaly.severity)}</span>
							</div>
							<div>
								<span class="text-slate-500">持续时长:</span>
								<span class="font-mono ml-2">{formatDuration(selectedAnomaly.durationMinutes)}</span>
							</div>
						</div>
					</div>

					<div>
						<label class="block text-sm font-medium text-slate-700 mb-2">责任方判定</label>
						<select class="select" bind:value={selectedResponsibleParty}>
							{#each responsibleParties as party}
								<option value={party.key}>{party.label}</option>
							{/each}
						</select>
					</div>

					<div>
						<label class="block text-sm font-medium text-slate-700 mb-2">异常说明/备注</label>
						<textarea
							class="input h-24 resize-none"
							placeholder="请输入异常原因分析和处理意见..."
							bind:value={annotationText}
						/>
					</div>
				</div>

				<div class="flex justify-end gap-2">
					<button class="btn btn-secondary" on:click={() => (selectedAnomaly = null)}>取消</button>
					<button class="btn btn-primary flex items-center gap-2" on:click={handleAnnotate}>
						<Check class="w-4 h-4" />
						确认标注
					</button>
				</div>
			</div>
		</div>
	{/if}
</AppLayout>
