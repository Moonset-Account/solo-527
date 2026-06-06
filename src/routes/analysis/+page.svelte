<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import dayjs from 'dayjs';
	import type { AnalysisData, AnalysisItem } from '$lib/types';
	import ECharts from '$lib/components/ECharts.svelte';
	import type { EChartsOption } from 'echarts';

	let loading = true;
	let selectedDate = dayjs().format('YYYY-MM-DD');
	let selectedDimension: 'deliveryMan' | 'mealType' | 'timeSlot' | 'building' = 'deliveryMan';
	let data: AnalysisData | null = null;

	const dimensions = [
		{ key: 'deliveryMan', label: '配送员维度', icon: '👨‍🍳' },
		{ key: 'mealType', label: '餐品维度', icon: '🍱' },
		{ key: 'timeSlot', label: '时段维度', icon: '⏰' },
		{ key: 'building', label: '楼栋维度', icon: '🏢' }
	] as const;

	async function fetchData() {
		loading = true;
		try {
			const res = await fetch(`/api/analysis?dimension=${selectedDimension}&date=${selectedDate}`);
			const result = await res.json();
			if (result.success) {
				data = result.data;
			}
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		const urlParams = new URLSearchParams($page.url.search);
		const dim = urlParams.get('dimension');
		if (dim && ['deliveryMan', 'mealType', 'timeSlot', 'building'].includes(dim)) {
			selectedDimension = dim as any;
		}
		fetchData();
	});

	$: selectedDimension, selectedDate, fetchData();

	function getChartOption(items: AnalysisItem[]): EChartsOption {
		return {
			tooltip: {
				trigger: 'axis',
				axisPointer: { type: 'shadow' },
				formatter: (params: any) => {
					const item = params[0];
					const data = items[item.dataIndex];
					return `
						<div style="font-weight: 600; margin-bottom: 8px;">${item.name}</div>
						<div>准时率：${data.onTimeRate.toFixed(1)}%</div>
						<div>低温次数：${data.lowTempCount} 次</div>
						<div>总单量：${data.totalOrders} 单</div>
						<div>平均温度：${data.avgTemperature.toFixed(1)}°C</div>
					`;
				}
			},
			legend: {
				data: ['准时率', '低温次数', '总单量'],
				top: 0
			},
			grid: { left: '3%', right: '4%', bottom: '3%', top: 50, containLabel: true },
			xAxis: {
				type: 'category',
				data: items.map((i) => i.name),
				axisLabel: {
					rotate: selectedDimension === 'building' ? 30 : 0,
					fontSize: 11
				}
			},
			yAxis: [
				{
					type: 'value',
					name: '百分比/次数',
					position: 'left'
				},
				{
					type: 'value',
					name: '温度(°C)',
					position: 'right'
				}
			],
			series: [
				{
					name: '准时率',
					type: 'bar',
					data: items.map((i) => i.onTimeRate),
					itemStyle: {
						color: '#1E88E5',
						borderRadius: [4, 4, 0, 0]
					}
				},
				{
					name: '低温次数',
					type: 'bar',
					data: items.map((i) => i.lowTempCount),
					itemStyle: {
						color: '#FF9800',
						borderRadius: [4, 4, 0, 0]
					}
				},
				{
					name: '平均温度',
					type: 'line',
					yAxisIndex: 1,
					data: items.map((i) => i.avgTemperature),
					itemStyle: { color: '#F44336' },
					lineStyle: { width: 2 },
					symbol: 'circle',
					symbolSize: 8
				}
			]
		};
	}

	function getHeatmapOption(): EChartsOption {
		return {
			title: {
				text: '楼栋配送热力分布',
				left: 'center',
				textStyle: { fontSize: 14, fontWeight: 500 }
			},
			tooltip: {
				formatter: (params: any) => {
					return `${params.data.name}<br/>异常值：${params.data.value}`;
				}
			},
			visualMap: {
				min: 0,
				max: 10,
				calculable: true,
				orient: 'horizontal',
				left: 'center',
				bottom: 10,
				inRange: {
					color: ['#E3F2FD', '#90CAF9', '#42A5F5', '#1976D2', '#0D47A1']
				}
			},
			geo: {
				map: 'none',
				roam: true
			},
			series: [
				{
					type: 'scatter',
					coordinateSystem: 'geo',
					symbolSize: (val: number) => val * 5 + 10,
					data: data?.buildingHeatmap?.map((b) => ({
						name: b.buildingName,
						value: [b.lng, b.lat, b.value]
					})),
					itemStyle: {
						color: '#1E88E5',
						shadowBlur: 10,
						shadowColor: 'rgba(30, 136, 229, 0.5)'
					},
					label: {
						show: true,
						formatter: '{b}',
						position: 'top',
						fontSize: 10
					}
				}
			]
		};
	}
</script>

<div class="space-y-6 animate-fade-in">
	<!-- 页面标题和筛选 -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-slate-800">多维度分析</h1>
			<p class="text-sm text-slate-500 mt-1">从不同维度分析配送质量数据</p>
		</div>
		<div class="flex items-center gap-2">
			<label class="text-sm text-slate-600">选择日期：</label>
			<input
				type="date"
				bind:value={selectedDate}
				class="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
			/>
		</div>
	</div>

	<!-- 维度切换标签 -->
	<div class="card p-2">
		<div class="flex gap-1">
			{#each dimensions as dim}
				<button
					on:click={() => (selectedDimension = dim.key)}
					class="flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-200 {
						selectedDimension === dim.key
							? 'bg-primary-500 text-white shadow-md'
							: 'text-slate-600 hover:bg-slate-100'
					}"
				>
					<span class="text-lg">{dim.icon}</span>
					<span class="font-medium">{dim.label}</span>
				</button>
			{/each}
		</div>
	</div>

	{#if loading}
		<div class="card h-96 flex items-center justify-center">
			<div class="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full" />
		</div>
	{:else if data}
		<!-- 统计卡片 -->
		<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
			<div class="card p-4 text-center">
				<p class="text-sm text-slate-500">平均准时率</p>
				<p class="text-2xl font-bold text-primary-600 mt-2">
					{data.data.length > 0
						? (data.data.reduce((s, i) => s + i.onTimeRate, 0) / data.data.length).toFixed(1)
						: 0}%
				</p>
			</div>
			<div class="card p-4 text-center">
				<p class="text-sm text-slate-500">低温总次数</p>
				<p class="text-2xl font-bold text-orange-500 mt-2">
					{data.data.reduce((s, i) => s + i.lowTempCount, 0)}
				</p>
			</div>
			<div class="card p-4 text-center">
				<p class="text-sm text-slate-500">总配送单量</p>
				<p class="text-2xl font-bold text-slate-700 mt-2">
					{data.data.reduce((s, i) => s + i.totalOrders, 0)}
				</p>
			</div>
			<div class="card p-4 text-center">
				<p class="text-sm text-slate-500">平均温度</p>
				<p class="text-2xl font-bold text-green-600 mt-2">
					{data.data.length > 0
						? (data.data.reduce((s, i) => s + i.avgTemperature, 0) / data.data.length).toFixed(1)
						: 0}°C
				</p>
			</div>
		</div>

		<!-- 图表区域 -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<div class="card p-6 lg:col-span-2">
				<h2 class="text-lg font-semibold text-slate-800 mb-4">
					{dimensions.find((d) => d.key === selectedDimension)?.label}对比
				</h2>
				<ECharts option={getChartOption(data.data)} height="400px" />
			</div>

			<!-- 排名列表 -->
			<div class="card p-6">
				<h2 class="text-lg font-semibold text-slate-800 mb-4">准时率排名</h2>
				<div class="space-y-3 max-h-96 overflow-y-auto scrollbar-thin">
					{#each [...data.data].sort((a, b) => b.onTimeRate - a.onTimeRate) as item, index}
						<div
							class="flex items-center gap-3 p-3 rounded-lg {index < 3
								? 'bg-gradient-to-r from-primary-50 to-transparent'
								: 'bg-slate-50'} transition-all hover:shadow-sm"
						>
							<div
								class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm {index === 0
									? 'bg-yellow-400 text-white'
									: index === 1
										? 'bg-gray-300 text-white'
										: index === 2
											? 'bg-orange-400 text-white'
											: 'bg-slate-200 text-slate-600'}"
							>
								{index + 1}
							</div>
							<div class="flex-1 min-w-0">
								<p class="font-medium text-slate-700 truncate">{item.name}</p>
								<div class="flex items-center gap-2 mt-1">
									<div class="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
										<div
											class="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full"
											style="width: {item.onTimeRate}%"
										/>
									</div>
									<span class="text-xs font-medium text-slate-600">{item.onTimeRate.toFixed(1)}%</span>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- 楼栋热力图 -->
		{#if selectedDimension === 'building' && data.buildingHeatmap}
			<div class="card p-6">
				<ECharts option={getHeatmapOption()} height="400px" />
			</div>
		{/if}

		<!-- 数据详情表格 -->
		<div class="card p-6">
			<h2 class="text-lg font-semibold text-slate-800 mb-4">详细数据</h2>
			<div class="overflow-x-auto scrollbar-thin">
				<table class="w-full text-sm">
					<thead>
						<tr class="text-left text-slate-500 border-b border-slate-100">
							<th class="pb-3 font-medium">名称</th>
							<th class="pb-3 font-medium">准时率</th>
							<th class="pb-3 font-medium">低温次数</th>
							<th class="pb-3 font-medium">总单量</th>
							<th class="pb-3 font-medium">平均温度</th>
							<th class="pb-3 font-medium">状态</th>
						</tr>
					</thead>
					<tbody>
						{#each data.data as item}
							<tr class="table-row border-b border-slate-50">
								<td class="py-3 font-medium text-slate-700">{item.name}</td>
								<td class="py-3">
									<span
										class="font-semibold {item.onTimeRate >= 95
											? 'text-green-600'
											: item.onTimeRate >= 85
												? 'text-primary-600'
												: 'text-orange-500'}"
									>
										{item.onTimeRate.toFixed(1)}%
									</span>
								</td>
								<td class="py-3">
									<span class={item.lowTempCount > 0 ? 'text-red-500 font-medium' : 'text-slate-400'}>
										{item.lowTempCount} 次
									</span>
								</td>
								<td class="py-3 text-slate-600">{item.totalOrders} 单</td>
								<td class="py-3 text-slate-600">{item.avgTemperature.toFixed(1)}°C</td>
								<td class="py-3">
									{#if item.onTimeRate >= 95 && item.lowTempCount === 0}
										<span class="status-confirmed">优秀</span>
									{:else if item.onTimeRate >= 85}
										<span class="status-pending">良好</span>
									{:else}
										<span class="status-danger">需改进</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>
