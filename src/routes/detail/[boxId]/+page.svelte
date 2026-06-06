<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import dayjs from 'dayjs';
	import type { DetailData } from '$lib/types';
	import ECharts from '$lib/components/ECharts.svelte';
	import type { EChartsOption } from 'echarts';
	import { settings } from '$lib/stores/settings';

	let loading = true;
	let data: DetailData | null = null;
	let selectedPhotoIndex = 0;
	let showPhotoModal = false;

	async function fetchData() {
		loading = true;
		try {
			const boxId = $page.params.boxId;
			const date = $page.url.searchParams.get('date') || dayjs().format('YYYY-MM-DD');
			const res = await fetch(`/api/detail/${boxId}?date=${date}`);
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
		fetchData();
	});

	function getTemperatureChartOption(): EChartsOption {
		if (!data) return {};

		const times = data.temperatureCurve.map((p) => dayjs(p.time).format('HH:mm'));
		const temps = data.temperatureCurve.map((p) => p.temperature);

		return {
			tooltip: {
				trigger: 'axis',
				formatter: (params: any) => {
					const p = params[0];
					return `时间：${p.name}<br/>温度：${p.value}°C`;
				}
			},
			grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
			xAxis: {
				type: 'category',
				data: times,
				axisLabel: { rotate: 45, fontSize: 10 }
			},
			yAxis: {
				type: 'value',
				name: '温度(°C)',
				min: 30,
				max: 90
			},
			series: [
				{
					name: '温度',
					type: 'line',
					data: temps,
					smooth: true,
					areaStyle: {
						color: {
							type: 'linear',
							x: 0,
							y: 0,
							x2: 0,
							y2: 1,
							colorStops: [
								{ offset: 0, color: 'rgba(30, 136, 229, 0.3)' },
								{ offset: 1, color: 'rgba(30, 136, 229, 0.05)' }
							]
						}
					},
					lineStyle: {
						color: '#1E88E5',
						width: 3
					},
					itemStyle: {
						color: (params: any) => {
							return params.value < $settings.lowTempThreshold ? '#F44336' : '#1E88E5';
						}
					},
					markLine: {
						silent: true,
						data: [
							{
								yAxis: $settings.lowTempThreshold,
								lineStyle: { color: '#F44336', type: 'dashed' },
								label: { formatter: `低温阈值 ${$settings.lowTempThreshold}°C`, position: 'end' }
							}
						]
					}
				}
			]
		};
	}

	function openPhotoModal(index: number) {
		selectedPhotoIndex = index;
		showPhotoModal = true;
	}

	function closePhotoModal() {
		showPhotoModal = false;
	}

	function prevPhoto() {
		if (data && selectedPhotoIndex > 0) {
			selectedPhotoIndex--;
		}
	}

	function nextPhoto() {
		if (data && selectedPhotoIndex < data.photos.length - 1) {
			selectedPhotoIndex++;
		}
	}
</script>

<div class="space-y-6 animate-fade-in">
	<!-- 页面头部 -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<button
				on:click={() => goto('/')}
				class="flex items-center gap-2 text-slate-600 hover:text-primary-600 transition-colors"
			>
				<span class="text-xl">←</span>
				<span>返回概览</span>
			</button>
			<div class="h-6 w-px bg-slate-200" />
			<h1 class="text-2xl font-bold text-slate-800">异常详情 - {data?.boxId || '加载中...'}</h1>
		</div>
	</div>

	{#if loading}
		<div class="card h-96 flex items-center justify-center">
			<div class="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full" />
		</div>
	{:else if data}
		<!-- 基本信息卡片 -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			<div class="card p-4">
				<p class="text-sm text-slate-500">配送员</p>
				<p class="text-lg font-semibold text-slate-700 mt-1">👨‍🍳 {data.deliveryMan}</p>
			</div>
			<div class="card p-4">
				<p class="text-sm text-slate-500">餐品类型</p>
				<p class="text-lg font-semibold text-slate-700 mt-1">🍱 {data.mealType}</p>
			</div>
			<div class="card p-4">
				<p class="text-sm text-slate-500">配送日期</p>
				<p class="text-lg font-semibold text-slate-700 mt-1">📅 {data.deliveryDate}</p>
			</div>
			<div class="card p-4">
				<p class="text-sm text-slate-500">送达楼栋</p>
				<p class="text-lg font-semibold text-slate-700 mt-1">🏢 {data.building}</p>
			</div>
		</div>

		<!-- 温度曲线 -->
		<div class="card p-6">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-lg font-semibold text-slate-800">🌡️ 温度曲线</h2>
				<div class="flex items-center gap-2 text-sm">
					<span class="w-3 h-3 rounded-full bg-red-500" />
					<span class="text-slate-500">低于阈值 {$settings.lowTempThreshold}°C</span>
				</div>
			</div>
			<ECharts option={getTemperatureChartOption()} height="350px" />
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- 配送路线 -->
			<div class="card p-6">
				<h2 class="text-lg font-semibold text-slate-800 mb-4">📍 配送路线</h2>
				<div class="relative">
					{#each data.route as point, index}
						<div class="flex gap-4 pb-6 last:pb-0">
							<div class="relative flex flex-col items-center">
								<div
									class="w-4 h-4 rounded-full border-2 z-10 {index === 0
										? 'bg-green-500 border-green-500'
										: index === data.route.length - 1
											? 'bg-red-500 border-red-500'
											: 'bg-white border-primary-500'}"
								/>
								{#if index < data.route.length - 1}
									<div class="w-0.5 h-full bg-slate-200 absolute top-4" />
								{/if}
							</div>
							<div class="flex-1 pb-2">
								<div class="flex items-center justify-between">
									<p class="font-medium text-slate-700">{point.address}</p>
									<p class="text-sm text-slate-500">{dayjs(point.time).format('HH:mm')}</p>
								</div>
								<p class="text-xs text-slate-400 mt-1">
									{point.location.lat.toFixed(4)}, {point.location.lng.toFixed(4)}
								</p>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- 签收照片 -->
			<div class="card p-6">
				<h2 class="text-lg font-semibold text-slate-800 mb-4">📷 签收照片</h2>
				<div class="grid grid-cols-3 gap-3">
					{#each data.photos as photo, index}
						<div
							class="aspect-video rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
							on:click={() => openPhotoModal(index)}
						>
							<img
								src={photo.thumbnail}
								alt="签收照片"
								class="w-full h-full object-cover"
							/>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- 被剔除的异常采样 -->
		{#if data.excludedSamples.length > 0}
			<div class="card p-6 border-l-4 border-l-yellow-400">
				<h2 class="text-lg font-semibold text-slate-800 mb-4">⚠️ 被剔除的异常采样点</h2>
				<p class="text-sm text-slate-500 mb-4">
					以下采样点因数据异常已被剔除，不计入温度统计：
				</p>
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="text-left text-slate-500 border-b border-slate-100">
								<th class="pb-3 font-medium">采样时间</th>
								<th class="pb-3 font-medium">温度值</th>
								<th class="pb-3 font-medium">剔除原因</th>
							</tr>
						</thead>
						<tbody>
							{#each data.excludedSamples as sample}
								<tr class="border-b border-slate-50">
									<td class="py-3 text-slate-600">{dayjs(sample.time).format('YYYY-MM-DD HH:mm')}</td>
									<td class="py-3">
										<span class="text-red-500 font-medium">{sample.temperature}°C</span>
									</td>
									<td class="py-3 text-slate-600">{sample.reason}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	{/if}

	<!-- 照片预览模态框 -->
	{#if showPhotoModal && data}
		<div
			class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
			on:click={closePhotoModal}
		>
			<button
				class="absolute top-4 right-4 text-white text-3xl hover:text-slate-300"
				on:click={closePhotoModal}
			>
				×
			</button>
			{#if selectedPhotoIndex > 0}
				<button
					class="absolute left-4 top-1/2 -translate-y-1/2 text-white text-5xl hover:text-slate-300"
					on:click|stopPropagation={prevPhoto}
				>
					‹
				</button>
			{/if}
			<img
				src={data.photos[selectedPhotoIndex].url}
				alt="签收照片大图"
				class="max-w-5xl max-h-[80vh] rounded-lg"
				on:click|stopPropagation
			/>
			{#if selectedPhotoIndex < data.photos.length - 1}
				<button
					class="absolute right-4 top-1/2 -translate-y-1/2 text-white text-5xl hover:text-slate-300"
					on:click|stopPropagation={nextPhoto}
				>
					›
				</button>
			{/if}
			<p class="absolute bottom-4 text-white text-sm">
				{selectedPhotoIndex + 1} / {data.photos.length} · {dayjs(data.photos[selectedPhotoIndex].uploadTime).format('YYYY-MM-DD HH:mm')}
			</p>
		</div>
	{/if}
</div>
