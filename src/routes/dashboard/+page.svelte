<script lang="ts">
	import AppLayout from '$lib/components/AppLayout.svelte';
	import KPICard from '$lib/components/KPICard.svelte';
	import AnomalyDurationChart from '$lib/components/charts/AnomalyDurationChart.svelte';
	import ResponsibilityChart from '$lib/components/charts/ResponsibilityChart.svelte';
	import { Truck, AlertTriangle, ThermometerSnowflake, Clock, TrendingUp } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { userStore, showToast } from '$lib/stores';
	import { generateMockData } from '$lib/data/mockData';
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
			const mockData = generateMockData();

			kpiData = {
				totalShipments: mockData.shipments.length,
				activeShipments: mockData.shipments.filter((s) => s.status === 'in_transit').length,
				totalAnomalies: mockData.anomalyRecords.length,
				complianceRate: 92.5,
				averageTemperature: -12.3,
				avgDeliveryDelayMinutes: 18,
				trends: {
					complianceRate: [91.2, 92.8, 90.5, 93.1, 92.5, 91.8, 92.5],
					anomalies: [8, 5, 12, 6, 9, 7, 5]
				}
			};

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

			for (const a of mockData.anomalyRecords) {
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

			responsibilityData = mockData.anomalyRecords.slice(0, 12).map((a) => {
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

			recentAnomalies = mockData.anomalyRecords.slice(0, 8);

			loading = false;
		} catch (e) {
			console.error(e);
			showToast('数据加载失败', 'error');
			loading = false;
		}
	});
</script>

<AppLayout>
	{#if loading}
		<div class="flex items-center justify-center h-64">
			<div class="text-center">
				<div class="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
				<p class="text-slate-600">正在加载数据...</p>
			</div>
		</div>
	{:else}
		<div class="space-y-6">
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				<KPICard
					title="总运单数"
					value={kpiData?.totalShipments || 0}
					icon={Truck}
					trend={3.2}
					trendLabel="较上周"
					color="primary"
				/>
				<KPICard
					title="在途运输"
					value={kpiData?.activeShipments || 0}
					icon={TrendingUp}
					color="green"
				/>
				<KPICard
					title="温控合规率"
					value={`${kpiData?.complianceRate || 0}%`}
					icon={ThermometerSnowflake}
					trend={1.5}
					trendLabel="较上周"
					color="cyan"
					subtitle="目标: ≥95%"
				/>
				<KPICard
					title="异常数量"
					value={kpiData?.totalAnomalies || 0}
					icon={AlertTriangle}
					trend={-8.3}
					trendLabel="较上周"
					color="yellow"
				/>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<AnomalyDurationChart data={anomalyDurationData} />
				<ResponsibilityChart data={responsibilityData} />
			</div>

			<div class="card">
				<div class="card-header flex items-center justify-between">
					<div>
						<h3 class="text-base font-semibold text-slate-800">最近异常</h3>
						<p class="text-sm text-slate-500 mt-1">最新异常事件列表，点击可下钻查看详情</p>
					</div>
					<a href="/anomaly" class="text-sm text-primary-600 hover:text-primary-700">查看全部 →</a>
				</div>
				<div class="overflow-x-auto">
					<table class="table">
						<thead>
							<tr>
								<th>批次号</th>
								<th>异常类型</th>
								<th>严重程度</th>
								<th>责任方</th>
								<th>持续时长</th>
								<th>开始时间</th>
								<th>状态</th>
								<th>操作</th>
							</tr>
						</thead>
						<tbody>
							{#each recentAnomalies as anomaly}
								<tr class="cursor-pointer hover:bg-slate-50" on:click={() => goto(`/anomaly?id=${anomaly.id}`)}>
									<td class="font-medium font-mono text-primary-600">{anomaly.shipmentId}</td>
									<td>{getAnomalyTypeLabel(anomaly.anomalyType)}</td>
									<td>
										<span class="badge {getSeverityColor(anomaly.severity)}">
											{getSeverityLabel(anomaly.severity)}
										</span>
									</td>
									<td>{getResponsiblePartyLabel(anomaly.responsibleParty)}</td>
									<td class="font-mono">{formatDuration(anomaly.durationMinutes)}</td>
									<td>{formatDateTime(anomaly.startTime)}</td>
									<td>
										<span class="badge {anomaly.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : anomaly.status === 'confirmed' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}">
											{anomaly.status === 'pending' ? '待处理' : anomaly.status === 'confirmed' ? '已确认' : '已解决'}
										</span>
									</td>
									<td>
										<button class="text-primary-600 hover:text-primary-700 text-sm">详情</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	{/if}
</AppLayout>
