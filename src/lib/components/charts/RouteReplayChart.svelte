<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as echarts from 'echarts';
	import type { LocationRecord, TemperatureRecord } from '$lib/types';
	import { formatDateTime, formatTemperature } from '$lib/utils/format';
	import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-svelte';

	export let locationRecords: LocationRecord[] = [];
	export let temperatureRecords: TemperatureRecord[] = [];

	let chartContainer: HTMLDivElement;
	let chart: echarts.ECharts | null = null;
	let isPlaying = false;
	let currentIndex = 0;
	let playSpeed = 1;
	let playTimer: number | null = null;

	$: tempMap = new Map(
		temperatureRecords.map((r) => [new Date(r.timestamp).getTime(), r.temperature])
	);

	$: chartOption = buildChartOption();

	function buildChartOption() {
		if (locationRecords.length === 0) return {};

		const coords = locationRecords.map((r) => [r.longitude, r.latitude]);
		const minLng = Math.min(...coords.map((c) => c[0]));
		const maxLng = Math.max(...coords.map((c) => c[0]));
		const minLat = Math.min(...coords.map((c) => c[1]));
		const maxLat = Math.max(...coords.map((c) => c[1]));

		return {
			tooltip: {
				trigger: 'item',
				backgroundColor: 'rgba(255, 255, 255, 0.98)',
				borderColor: '#e2e8f0',
				borderWidth: 1,
				textStyle: { color: '#334155' },
				formatter: function (params: any) {
					if (params.data && params.data.length >= 3) {
						const idx = params.data[2];
						const loc = locationRecords[idx];
						if (!loc) return '';
						const time = new Date(loc.timestamp).getTime();
						const temp = getClosestTemperature(time);

						return `<div style="font-weight: 600; margin-bottom: 4px;">点位 #${idx + 1}</div>
							<div style="margin-bottom: 2px;">时间: ${formatDateTime(loc.timestamp)}</div>
							<div style="margin-bottom: 2px;">经度: ${loc.longitude.toFixed(4)}</div>
							<div style="margin-bottom: 2px;">纬度: ${loc.latitude.toFixed(4)}</div>
							<div style="margin-bottom: 2px;">速度: ${loc.speed ? loc.speed.toFixed(1) + ' km/h' : '-'}</div>
							${temp !== null ? `<div>温度: <strong>${formatTemperature(temp)}</strong></div>` : ''}`;
					}
					return '';
				}
			},
			grid: {
				left: 0,
				right: 0,
				top: 0,
				bottom: 0
			},
			xAxis: {
				type: 'value',
				min: minLng - 0.05,
				max: maxLng + 0.05,
				show: false
			},
			yAxis: {
				type: 'value',
				min: minLat - 0.05,
				max: maxLat + 0.05,
				show: false
			},
			series: [
				{
					name: '行驶轨迹',
					type: 'line',
					data: coords.map((c, i) => [c[0], c[1], i]),
					smooth: true,
					symbol: 'none',
					lineStyle: {
						width: 4,
						color: {
							type: 'linear',
							x: 0,
							y: 0,
							x2: 1,
							y2: 0,
							colorStops: [
								{ offset: 0, color: '#22c55e' },
								{ offset: 0.5, color: '#eab308' },
								{ offset: 1, color: '#ef4444' }
							]
						}
					}
				},
				{
					name: '当前位置',
					type: 'scatter',
					data: currentIndex < coords.length ? [[coords[currentIndex][0], coords[currentIndex][1], currentIndex]] : [],
					symbol: 'circle',
					symbolSize: 12,
					itemStyle: {
						color: '#0F4C81',
						borderColor: '#fff',
						borderWidth: 2,
						shadowBlur: 10,
						shadowColor: 'rgba(15, 76, 129, 0.5)'
					},
					zlevel: 10
				}
			]
		};
	}

	function getClosestTemperature(time: number): number | null {
		let closest = null;
		let minDiff = Infinity;
		for (const [t, temp] of tempMap) {
			const diff = Math.abs(t - time);
			if (diff < minDiff) {
				minDiff = diff;
				closest = temp;
			}
		}
		return closest;
	}

	function togglePlay() {
		isPlaying = !isPlaying;
		if (isPlaying) {
			startPlayback();
		} else {
			stopPlayback();
		}
	}

	function startPlayback() {
		if (playTimer) clearInterval(playTimer);
		playTimer = window.setInterval(() => {
			if (currentIndex < locationRecords.length - 1) {
				currentIndex++;
			} else {
				stopPlayback();
				isPlaying = false;
			}
		}, 500 / playSpeed);
	}

	function stopPlayback() {
		if (playTimer) {
			clearInterval(playTimer);
			playTimer = null;
		}
	}

	function resetPlayback() {
		stopPlayback();
		currentIndex = 0;
		isPlaying = false;
	}

	function stepBackward() {
		if (currentIndex > 0) {
			currentIndex--;
		}
	}

	function stepForward() {
		if (currentIndex < locationRecords.length - 1) {
			currentIndex++;
		}
	}

	onMount(() => {
		if (chartContainer) {
			chart = echarts.init(chartContainer);
			chart.setOption(chartOption);
		}
		window.addEventListener('resize', handleResize);
	});

	onDestroy(() => {
		stopPlayback();
		window.removeEventListener('resize', handleResize);
		chart?.dispose();
	});

	function handleResize() {
		chart?.resize();
	}

	$: if (chart) {
		chart.setOption(chartOption, true);
	}
</script>

<div class="card">
	<div class="card-header flex items-center justify-between">
		<div>
			<h3 class="text-base font-semibold text-slate-800">运输路线回放</h3>
			<p class="text-sm text-slate-500 mt-1">动态回放车辆行驶轨迹，关联温度数据</p>
		</div>
	</div>
	<div class="card-body">
		{#if locationRecords.length === 0}
			<div class="empty-state">
				<svg class="w-16 h-16 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
				</svg>
				<p class="text-sm font-medium">暂无轨迹数据</p>
				<p class="text-xs text-slate-400 mt-1">请选择运单查看路线轨迹</p>
			</div>
		{:else}
			<div bind:this={chartContainer} class="w-full" style="height: 320px;" />

			<div class="mt-4 p-4 bg-slate-50 rounded-lg">
				<div class="flex items-center justify-between mb-4">
					<div class="text-sm">
						<span class="text-slate-500">进度: </span>
						<span class="font-medium text-slate-800">{currentIndex + 1} / {locationRecords.length}</span>
						{#if currentIndex < locationRecords.length}
							<span class="text-slate-400 ml-2">
								{formatDateTime(locationRecords[currentIndex].timestamp)}
							</span>
						{/if}
					</div>
					<div class="flex items-center gap-2">
						<span class="text-xs text-slate-500">速度:</span>
						<select
							class="text-xs border border-slate-300 rounded px-2 py-1"
							bind:value={playSpeed}
						>
							<option value={0.5}>0.5x</option>
							<option value={1}>1x</option>
							<option value={2}>2x</option>
							<option value={4}>4x</option>
						</select>
					</div>
				</div>

				<div class="flex items-center justify-center gap-3">
					<button
						on:click={resetPlayback}
						class="p-2 rounded-full hover:bg-slate-200 transition-colors"
						title="重置"
					>
						<RotateCcw class="w-5 h-5 text-slate-600" />
					</button>
					<button
						on:click={stepBackward}
						class="p-2 rounded-full hover:bg-slate-200 transition-colors"
						title="后退"
					>
						<ChevronLeft class="w-5 h-5 text-slate-600" />
					</button>
					<button
						on:click={togglePlay}
						class="p-3 rounded-full bg-primary-500 hover:bg-primary-600 text-white transition-colors"
					>
						{#if isPlaying}
							<Pause class="w-6 h-6" />
						{:else}
							<Play class="w-6 h-6 ml-0.5" />
						{/if}
					</button>
					<button
						on:click={stepForward}
						class="p-2 rounded-full hover:bg-slate-200 transition-colors"
						title="前进"
					>
						<ChevronRight class="w-5 h-5 text-slate-600" />
					</button>
				</div>

				<input
					type="range"
					min="0"
					max={locationRecords.length - 1}
					bind:value={currentIndex}
					class="w-full mt-4"
				/>
			</div>
		{/if}
	</div>
</div>
