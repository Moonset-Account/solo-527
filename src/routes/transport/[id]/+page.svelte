<script lang="ts">
	import AppLayout from '$lib/components/AppLayout.svelte';
	import TemperatureChart from '$lib/components/charts/TemperatureChart.svelte';
	import RouteReplayChart from '$lib/components/charts/RouteReplayChart.svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { userStore, showToast } from '$lib/stores';
	import { generateMockData } from '$lib/data/mockData';
	import type { Shipment, TemperatureRecord, LocationRecord, DoorEvent, AnomalyRecord } from '$lib/types';
	import {
		formatDateTime,
		formatDuration,
		getShipmentStatusLabel,
		getShipmentStatusColor,
		getAnomalyTypeLabel,
		getSeverityLabel,
		getSeverityColor,
		getCalibrationStatus
	} from '$lib/utils/format';
	import { ArrowLeft, Thermometer, MapPin, Package, Clock, AlertTriangle } from 'lucide-svelte';

	let loading = true;
	let shipment: Shipment | null = null;
	let temperatureRecords: TemperatureRecord[] = [];
	let locationRecords: LocationRecord[] = [];
	let doorEvents: DoorEvent[] = [];
	let anomalies: AnomalyRecord[] = [];
	let shipmentId = '';

	const vehicleOptions = [
		{ id: 'v001', label: '京A·12345 - 张师傅' },
		{ id: 'v002', label: '京B·67890 - 李师傅' },
		{ id: 'v003', label: '沪A·54321 - 王师傅' }
	];

	const routeOptions = [
		{ id: 'r001', label: '北京-上海' },
		{ id: 'r002', label: '北京-广州' },
		{ id: 'r003', label: '上海-杭州' }
	];

	$: shipmentId = $page.params.id;

	onMount(async () => {
		if (!$userStore) {
			goto('/login');
			return;
		}

		try {
			const mockData = generateMockData();
			shipment = mockData.shipments.find((s) => s.id === shipmentId) || mockData.shipments[0];

			if (shipment) {
				temperatureRecords = mockData.temperatureRecords.filter(
					(r) => r.shipmentId === shipment!.id
				);
				locationRecords = mockData.locationRecords.filter(
					(r) => r.shipmentId === shipment!.id
				);
				doorEvents = mockData.doorEvents.filter((e) => e.shipmentId === shipment!.id);
				anomalies = mockData.anomalyRecords.filter((a) => a.shipmentId === shipment!.id);
			}

			loading = false;
		} catch (e) {
			showToast('数据加载失败', 'error');
			loading = false;
		}
	});

	$: calibrationSummary = (() => {
		if (temperatureRecords.length === 0) return { calibrated: 0, uncalibrated: 0 };
		const calibrated = temperatureRecords.filter((r) => r.probeCalibrated).length;
		return {
			calibrated,
			uncalibrated: temperatureRecords.length - calibrated
		};
	})();
</script>

<AppLayout>
	{#if loading || !shipment}
		<div class="flex items-center justify-center h-64">
			<div class="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full mx-auto" />
		</div>
	{:else}
		<div class="space-y-6">
			<div class="flex items-center gap-4">
				<button
					on:click={() => history.back()}
					class="p-2 rounded-lg hover:bg-slate-100 transition-colors"
				>
					<ArrowLeft class="w-5 h-5 text-slate-600" />
				</button>
				<div>
					<h2 class="text-xl font-bold text-slate-800">运单详情</h2>
					<p class="text-sm text-slate-500">批次号: <span class="font-mono font-medium">{shipment.batchNo}</span></p>
				</div>
				<span class="badge {getShipmentStatusColor(shipment.status)} ml-auto">
					{getShipmentStatusLabel(shipment.status)}
				</span>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
				<div class="card p-4">
					<div class="flex items-center gap-3">
						<div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
							<Package class="w-5 h-5 text-blue-600" />
						</div>
						<div>
							<p class="text-xs text-slate-500">温控箱</p>
							<p class="font-medium text-slate-800">{shipment.containerId}</p>
						</div>
					</div>
				</div>
				<div class="card p-4">
					<div class="flex items-center gap-3">
						<div class="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
							<Thermometer class="w-5 h-5 text-green-600" />
						</div>
						<div>
							<p class="text-xs text-slate-500">平均温度</p>
							<p class="font-medium text-slate-800 font-mono">
								{temperatureRecords.length > 0
									? (
											temperatureRecords.reduce((sum, r) => sum + r.temperature, 0) /
											temperatureRecords.length
										).toFixed(1) + '°C'
									: '-'}
							</p>
						</div>
					</div>
				</div>
				<div class="card p-4">
					<div class="flex items-center gap-3">
						<div class="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
							<MapPin class="w-5 h-5 text-purple-600" />
						</div>
						<div>
							<p class="text-xs text-slate-500">路线</p>
							<p class="font-medium text-slate-800">
								{routeOptions.find((r) => r.id === shipment.routeId)?.label || shipment.routeId}
							</p>
						</div>
					</div>
				</div>
				<div class="card p-4">
					<div class="flex items-center gap-3">
						<div class="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
							<Clock class="w-5 h-5 text-orange-600" />
						</div>
						<div>
							<p class="text-xs text-slate-500">运输时长</p>
							<p class="font-medium text-slate-800 font-mono">
								{shipment.arrivalTime
									? formatDuration(
											(new Date(shipment.arrivalTime).getTime() - new Date(shipment.departureTime).getTime()) /
												(1000 * 60)
										)
									: '运输中'}
							</p>
						</div>
					</div>
				</div>
			</div>

			<div class="card">
				<div class="card-header">
					<h3 class="text-base font-semibold text-slate-800">运单信息</h3>
				</div>
				<div class="card-body">
					<div class="grid grid-cols-2 md:grid-cols-4 gap-6">
						<div>
							<p class="text-xs text-slate-500 mb-1">车辆</p>
							<p class="text-sm font-medium text-slate-800">
								{vehicleOptions.find((v) => v.id === shipment.vehicleId)?.label || shipment.vehicleId}
							</p>
						</div>
						<div>
							<p class="text-xs text-slate-500 mb-1">发货时间</p>
							<p class="text-sm font-medium text-slate-800">{formatDateTime(shipment.departureTime)}</p>
						</div>
						<div>
							<p class="text-xs text-slate-500 mb-1">预计到达</p>
							<p class="text-sm font-medium text-slate-800">{formatDateTime(shipment.plannedArrivalTime)}</p>
						</div>
						<div>
							<p class="text-xs text-slate-500 mb-1">实际到达</p>
							<p class="text-sm font-medium text-slate-800">{formatDateTime(shipment.arrivalTime)}</p>
						</div>
					</div>

					<div class="mt-6 pt-6 border-t border-slate-100">
						<div class="flex items-center justify-between">
							<h4 class="text-sm font-medium text-slate-700">探头校准状态</h4>
							<span class="text-xs text-slate-500">
								共 {temperatureRecords.length} 条记录
							</span>
						</div>
						<div class="flex items-center gap-6 mt-3">
							<div class="flex items-center gap-2">
								<div class="w-3 h-3 rounded-full bg-cyan-500" />
								<span class="text-sm text-slate-600">
									已校准: <strong>{calibrationSummary.calibrated}</strong> 条
								</span>
							</div>
							<div class="flex items-center gap-2">
								<div class="w-3 h-3 rounded-full bg-yellow-500" />
								<span class="text-sm text-slate-600">
									待校准: <strong>{calibrationSummary.uncalibrated}</strong> 条
								</span>
							</div>
							{#if calibrationSummary.uncalibrated > 0}
								<span class="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
									<AlertTriangle class="w-3 h-3 inline mr-1" />
									部分数据探头未校准，结果仅供参考
								</span>
							{/if}
						</div>
					</div>
				</div>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<TemperatureChart
					temperatureRecords={temperatureRecords}
					doorEvents={doorEvents}
				/>
				<RouteReplayChart
					locationRecords={locationRecords}
					temperatureRecords={temperatureRecords}
				/>
			</div>

			{#if anomalies.length > 0}
				<div class="card">
					<div class="card-header">
						<h3 class="text-base font-semibold text-slate-800">异常事件 ({anomalies.length})</h3>
					</div>
					<div class="overflow-x-auto">
						<table class="table">
							<thead>
								<tr>
									<th>异常类型</th>
									<th>严重程度</th>
									<th>责任方</th>
									<th>开始时间</th>
									<th>结束时间</th>
									<th>持续时长</th>
									<th>状态</th>
								</tr>
							</thead>
							<tbody>
								{#each anomalies as anomaly}
									<tr>
										<td>{getAnomalyTypeLabel(anomaly.anomalyType)}</td>
										<td>
											<span class="badge {getSeverityColor(anomaly.severity)}">
												{getSeverityLabel(anomaly.severity)}
											</span>
										</td>
										<td>{anomaly.responsibleParty}</td>
										<td>{formatDateTime(anomaly.startTime)}</td>
										<td>{formatDateTime(anomaly.endTime)}</td>
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
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</AppLayout>
