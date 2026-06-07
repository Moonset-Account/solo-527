<script lang="ts">
	import { onMount } from 'svelte';
	import * as echarts from 'echarts';

	let { data }: { data: Array<{ age_bucket: string; batch_no: string; quantity: number }> } = $props();

	let chartContainer: HTMLDivElement;
	let chartInstance: echarts.ECharts | null = null;

	const ageBucketOrder = ['0-30', '30-60', '60-90', '90-180', '180+'];
	const palette = ['#1B2A4A', '#3B5998', '#5B7FCC', '#FF6B35', '#FF9A6C', '#2ECDA7', '#6DD5B3', '#F59E0B', '#EF4444', '#8B5CF6'];

	function getOption(d: typeof data) {
		const batchSet = [...new Set(d.map((item) => item.batch_no))];
		const seriesMap = new Map<string, Map<string, number>>();

		for (const item of d) {
			if (!seriesMap.has(item.batch_no)) {
				seriesMap.set(item.batch_no, new Map());
			}
			seriesMap.get(item.batch_no)!.set(item.age_bucket, item.quantity);
		}

		const series = batchSet.map((batch, idx) => ({
			name: batch,
			type: 'bar' as const,
			stack: 'total',
			emphasis: { focus: 'series' as const },
			itemStyle: {
				color: palette[idx % palette.length],
				borderRadius: idx === batchSet.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]
			},
			data: ageBucketOrder.map((bucket) => seriesMap.get(batch)?.get(bucket) ?? 0)
		}));

		return {
			tooltip: {
				trigger: 'axis',
				axisPointer: { type: 'shadow' },
				backgroundColor: 'rgba(27, 42, 74, 0.92)',
				borderColor: 'rgba(255, 255, 255, 0.08)',
				borderWidth: 1,
				textStyle: { color: '#fff', fontSize: 13 }
			},
			legend: {
				data: batchSet,
				top: 0,
				textStyle: { fontSize: 12, color: '#666' },
				type: 'scroll'
			},
			grid: {
				left: '3%',
				right: '4%',
				bottom: '3%',
				top: 36,
				containLabel: true
			},
			xAxis: {
				type: 'category',
				data: ageBucketOrder.map((b) => `${b}天`),
				axisLabel: { fontSize: 12, color: '#666' },
				axisLine: { lineStyle: { color: '#ddd' } }
			},
			yAxis: {
				type: 'value',
				axisLabel: { fontSize: 12, color: '#666' },
				splitLine: { lineStyle: { color: '#f0f0f0' } }
			},
			series
		};
	}

	function handleResize() {
		chartInstance?.resize();
	}

	$effect(() => {
		if (chartInstance && data.length > 0) {
			chartInstance.setOption(getOption(data), true);
		}
	});

	onMount(() => {
		if (chartContainer) {
			chartInstance = echarts.init(chartContainer);
			if (data.length > 0) {
				chartInstance.setOption(getOption(data));
			}
			window.addEventListener('resize', handleResize);
		}

		return () => {
			window.removeEventListener('resize', handleResize);
			chartInstance?.dispose();
			chartInstance = null;
		};
	});
</script>

<div bind:this={chartContainer} class="w-full" style="min-height: 320px;"></div>
