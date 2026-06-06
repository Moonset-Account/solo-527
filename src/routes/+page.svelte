<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import dayjs from 'dayjs';
	import type { OverviewData, LowTempBox, LateBuilding, RefundRequest, PendingVisit } from '$lib/types';
	import ECharts from '$lib/components/ECharts.svelte';
	import { settings } from '$lib/stores/settings';

	let loading = true;
	let selectedDate = dayjs().format('YYYY-MM-DD');
	let data: OverviewData | null = null;
	let error: string | null = null;

	async function fetchData() {
		loading = true;
		error = null;
		try {
			const res = await fetch(`/api/overview?date=${selectedDate}`);
			const result = await res.json();
			if (result.success) {
				data = result.data;
			} else {
				error = result.error;
			}
		} catch (e) {
			error = (e as Error).message;
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		fetchData();
	});

	$: $settings, selectedDate, fetchData();

	function navigateToDetail(boxId: string) {
		goto(`/detail/${boxId}?date=${selectedDate}`);
	}

	function getBuildingChartOption(buildings: LateBuilding[]) {
		return {
			tooltip: {
				trigger: 'axis',
				axisPointer: { type: 'shadow' }
			},
			grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
			xAxis: {
				type: 'value',
				name: '晚签收次数'
			},
			yAxis: {
				type: 'category',
				data: buildings.map((b) => b.buildingName),
				axisLabel: { fontSize: 12 }
			},
			series: [
				{
					name: '晚签收次数',
					type: 'bar',
					data: buildings.map((b) => b.lateCount),
					itemStyle: {
						color: '#FF9800',
						borderRadius: [0, 4, 4, 0]
					},
					label: {
						show: true,
						position: 'right',
						fontSize: 12
					}
				}
			]
		};
	}

	const statCards = [
		{
			label: '低温箱数',
			value: 0,
			icon: '❄️',
			color: 'from-blue-400 to-blue-600',
			bg: 'bg-blue-50'
		},
		{
			label: '晚签收数',
			value: 0,
			icon: '⏰',
			color: 'from-orange-400 to-orange-600',
			bg: 'bg-orange-50'
		},
		{
			label: '退款申请',
			value: 0,
			icon: '💰',
			color: 'from-red-400 to-red-600',
			bg: 'bg-red-50'
		},
		{
			label: '待回访',
			value: 0,
			icon: '📞',
			color: 'from-purple-400 to-purple-600',
			bg: 'bg-purple-50'
		}
	];
</script>

<div class="space-y-6 animate-fade-in">
	<!-- 页面标题和筛选 -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-slate-800">异常概览</h1>
			<p class="text-sm text-slate-500 mt-1">实时监控配送温度与准时率异常</p>
		</div>
		<div class="flex items-center gap-4">
			<div class="flex items-center gap-2">
				<label class="text-sm text-slate-600">选择日期：</label>
				<input
					type="date"
					bind:value={selectedDate}
					class="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
				/>
			</div>
			<button class="btn-primary" on:click={() => goto('/export')}>
				📥 导出日报
			</button>
		</div>
	</div>

	{#if loading}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
			{#each Array(4) as _}
				<div class="card h-28 animate-pulse bg-slate-100" />
			{/each}
		</div>
	{:else if error}
		<div class="card p-8 text-center text-red-500">
			<p>加载失败：{error}</p>
			<button class="btn-primary mt-4" on:click={fetchData}>重新加载</button>
		</div>
	{:else if data}
		<!-- 核心指标卡片 -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
			<div
				class="card p-6 {statCards[0].bg} border-0 relative overflow-hidden"
				style="animation-delay: 0.1s"
			>
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-slate-600">{statCards[0].label}</p>
						<p class="text-3xl font-bold text-slate-800 mt-2">{data.stats.lowTempBoxCount}</p>
						<p class="text-xs text-slate-500 mt-1">已确认低温</p>
					</div>
					<span class="text-5xl opacity-30">{statCards[0].icon}</span>
				</div>
			</div>

			<div
				class="card p-6 {statCards[1].bg} border-0 relative overflow-hidden"
				style="animation-delay: 0.2s"
			>
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-slate-600">{statCards[1].label}</p>
						<p class="text-3xl font-bold text-slate-800 mt-2">{data.stats.lateDeliveryCount}</p>
						<p class="text-xs text-slate-500 mt-1">累计晚签收</p>
					</div>
					<span class="text-5xl opacity-30">{statCards[1].icon}</span>
				</div>
			</div>

			<div
				class="card p-6 {statCards[2].bg} border-0 relative overflow-hidden"
				style="animation-delay: 0.3s"
			>
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-slate-600">{statCards[2].label}</p>
						<p class="text-3xl font-bold text-slate-800 mt-2">{data.stats.refundRequestCount}</p>
						<p class="text-xs text-slate-500 mt-1">待处理申请</p>
					</div>
					<span class="text-5xl opacity-30">{statCards[2].icon}</span>
				</div>
			</div>

			<div
				class="card p-6 {statCards[3].bg} border-0 relative overflow-hidden"
				style="animation-delay: 0.4s"
			>
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-slate-600">{statCards[3].label}</p>
						<p class="text-3xl font-bold text-slate-800 mt-2">{data.stats.pendingVisitCount}</p>
						<p class="text-xs text-slate-500 mt-1">待回访用户</p>
					</div>
					<span class="text-5xl opacity-30">{statCards[3].icon}</span>
				</div>
			</div>
		</div>

		<!-- 低温箱号和晚签收楼栋 -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- 低温箱号列表 -->
			<div class="card p-6">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-lg font-semibold text-slate-800">低温箱号</h2>
					<div class="text-xs text-slate-500 flex items-center gap-1">
						<span class="w-2 h-2 rounded-full bg-orange-400"></span>
						采样<{$settings.minSampleCount}次为待复核
					</div>
				</div>
				<div class="overflow-x-auto scrollbar-thin">
					<table class="w-full text-sm">
						<thead>
							<tr class="text-left text-slate-500 border-b border-slate-100">
								<th class="pb-3 font-medium">箱号</th>
								<th class="pb-3 font-medium">最低温度</th>
								<th class="pb-3 font-medium">采样次数</th>
								<th class="pb-3 font-medium">配送员</th>
								<th class="pb-3 font-medium">状态</th>
								<th class="pb-3 font-medium text-right">操作</th>
							</tr>
						</thead>
						<tbody>
							{#each data.lowTempBoxes as box}
								<tr class="table-row border-b border-slate-50" on:click={() => navigateToDetail(box.boxId)}>
									<td class="py-3 font-medium text-slate-700">{box.boxId}</td>
									<td class="py-3">
										<span class="text-red-500 font-semibold">{box.minTemperature}°C</span>
									</td>
									<td class="py-3 text-slate-600">{box.sampleCount} 次</td>
									<td class="py-3 text-slate-600">{box.deliveryMan}</td>
									<td class="py-3">
										{#if box.sampleCount < $settings.minSampleCount}
											<span class="status-pending">待复核</span>
										{:else if box.status === 'confirmed'}
											<span class="status-confirmed">已确认</span>
										{:else}
											<span class="status-pending">待处理</span>
										{/if}
									</td>
									<td class="py-3 text-right">
										<span class="text-primary-500 hover:text-primary-600 cursor-pointer font-medium">
											详情 →
										</span>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>

			<!-- 晚签收楼栋排行 -->
			<div class="card p-6">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-lg font-semibold text-slate-800">晚签收楼栋排行</h2>
					<button class="text-sm text-primary-500 hover:text-primary-600" on:click={() => goto('/analysis?dimension=building')}>
						查看全部 →
					</button>
				</div>
				<ECharts option={getBuildingChartOption(data.lateBuildings)} height="320px" />
			</div>
		</div>

		<!-- 退款申请和未完成回访 -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- 退款申请 -->
			<div class="card p-6">
				<h2 class="text-lg font-semibold text-slate-800 mb-4">退款申请</h2>
				<div class="space-y-3">
					{#each data.refundRequests as request}
						<div
							class="p-4 rounded-lg border border-slate-100 hover:border-primary-200 hover:bg-slate-50 transition-all duration-200 cursor-pointer"
						>
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-3">
									<div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-lg">
										💰
									</div>
									<div>
										<p class="font-medium text-slate-700">{request.applicant}</p>
										<p class="text-sm text-slate-500">{request.reason}</p>
									</div>
								</div>
								<div class="text-right">
									<p class="font-bold text-slate-800">¥{request.amount.toFixed(2)}</p>
									{#if request.status === 'pending'}
										<span class="status-pending">待处理</span>
									{:else if request.status === 'approved'}
										<span class="status-confirmed">已通过</span>
									{:else}
										<span class="status-danger">已拒绝</span>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- 未完成回访 -->
			<div class="card p-6">
				<h2 class="text-lg font-semibold text-slate-800 mb-4">未完成回访</h2>
				<div class="space-y-3">
					{#each data.pendingVisits as visit}
						<div
							class="p-4 rounded-lg border border-slate-100 hover:border-primary-200 hover:bg-slate-50 transition-all duration-200 cursor-pointer"
						>
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-3">
									<div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-lg">
										👴
									</div>
									<div>
										<p class="font-medium text-slate-700">{visit.userName}</p>
										<p class="text-sm text-slate-500">配送日期：{visit.deliveryDate}</p>
									</div>
								</div>
								<div>
									{#if visit.status === 'pending'}
										<span class="status-pending">待回访</span>
									{:else}
										<span class="status-confirmed">已完成</span>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>
