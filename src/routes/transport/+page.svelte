<script lang="ts">
	import AppLayout from '$lib/components/AppLayout.svelte';
	import FilterBar from '$lib/components/FilterBar.svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { userStore, showToast } from '$lib/stores';
	import { generateMockData } from '$lib/data/mockData';
	import type { Shipment } from '$lib/types';
	import {
		getShipmentStatusLabel,
		getShipmentStatusColor,
		formatDateTime,
		formatDuration
	} from '$lib/utils/format';
	import { Eye, Search } from 'lucide-svelte';

	let loading = true;
	let shipments: Shipment[] = [];
	let filteredShipments: Shipment[] = [];
	let searchQuery = '';

	const vehicleOptions = [
		{ id: 'v001', label: '京A·12345' },
		{ id: 'v002', label: '京B·67890' },
		{ id: 'v003', label: '沪A·54321' }
	];

	const customerOptions = [
		{ id: 'c001', label: '鲜优生鲜' },
		{ id: 'c002', label: '康泰医药' },
		{ id: 'c003', label: '麦好甜品' }
	];

	const routeOptions = [
		{ id: 'r001', label: '北京-上海' },
		{ id: 'r002', label: '北京-广州' },
		{ id: 'r003', label: '上海-杭州' }
	];

	onMount(async () => {
		if (!$userStore) {
			goto('/login');
			return;
		}

		try {
			const mockData = generateMockData();
			shipments = mockData.shipments;
			filteredShipments = shipments;
			loading = false;
		} catch (e) {
			showToast('数据加载失败', 'error');
			loading = false;
		}
	});

	$: filteredShipments = shipments.filter((s) => {
		if (!searchQuery) return true;
		const query = searchQuery.toLowerCase();
		return (
			s.batchNo.toLowerCase().includes(query) ||
			s.id.toLowerCase().includes(query)
		);
	});
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
				anomalyTypes={[]}
				severityLevels={[]}
			/>

			<div class="card">
				<div class="card-header flex items-center justify-between">
					<div>
						<h3 class="text-base font-semibold text-slate-800">运输运单列表</h3>
						<p class="text-sm text-slate-500 mt-1">共 {filteredShipments.length} 条运单记录</p>
					</div>
					<div class="relative">
						<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
						<input
							type="text"
							class="input pl-9 w-64"
							placeholder="搜索批次号..."
							bind:value={searchQuery}
						/>
					</div>
				</div>
				<div class="overflow-x-auto">
					<table class="table">
						<thead>
							<tr>
								<th>批次号</th>
								<th>车辆</th>
								<th>路线</th>
								<th>发货时间</th>
								<th>预计到达</th>
								<th>实际到达</th>
								<th>运输时长</th>
								<th>状态</th>
								<th>操作</th>
							</tr>
						</thead>
						<tbody>
							{#each filteredShipments as shipment}
								<tr class="cursor-pointer" on:click={() => goto(`/transport/${shipment.id}`)}>
									<td class="font-mono font-medium text-primary-600">{shipment.batchNo}</td>
									<td>
										{vehicleOptions.find((v) => v.id === shipment.vehicleId)?.label || shipment.vehicleId}
									</td>
									<td>
										{routeOptions.find((r) => r.id === shipment.routeId)?.label || shipment.routeId}
									</td>
									<td>{formatDateTime(shipment.departureTime)}</td>
									<td>{formatDateTime(shipment.plannedArrivalTime)}</td>
									<td>{formatDateTime(shipment.arrivalTime)}</td>
									<td class="font-mono">
										{shipment.arrivalTime
											? formatDuration(
													(new Date(shipment.arrivalTime).getTime() - new Date(shipment.departureTime).getTime()) /
														(1000 * 60)
												)
											: '-'}
									</td>
									<td>
										<span class="badge {getShipmentStatusColor(shipment.status)}">
											{getShipmentStatusLabel(shipment.status)}
										</span>
									</td>
									<td>
										<button
											class="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700"
											on:click|stopPropagation={() => goto(`/transport/${shipment.id}`)}
										>
											<Eye class="w-4 h-4" />
											详情
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
</AppLayout>
