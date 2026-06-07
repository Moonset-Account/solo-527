<script lang="ts">
	import { onMount } from 'svelte';
	import * as echarts from 'echarts';

	let { data }: { data: Array<{ sku_id: string; sku_name: string; batch_no: string; turnover_rate: number; avg_age_days: number; current_qty: number; rank_type: 'top' | 'bottom' }> } = $props();

	let activeTab = $state<'top' | 'bottom'>('top');
	let chartContainer: HTMLDivElement;
	let chartInstance: echarts.ECharts | null = null;

	const filteredData = $derived.by(() => {
		const items = data.filter((d) => d.rank_type === activeTab);
		const sorted = items.sort((a, b) => {
			return activeTab === 'top' ? b.turnover_rate - a.turnover_rate : a.turnover_rate - b.turnover_rate;
		});
		return sorted.slice(0, 10);
	});

	function getOption(d: typeof filteredData) {
		if (d.length === 0) return {};

		const barColor = activeTab === 'top' ? '#FF6B35' : '#EF4444';
		const labels = d.map((item) => `${item.sku_name} (${item.batch_no})`);
		const values = d.map((item) => item.turnover_rate);

		return {
			tooltip: {
				trigger: 'axis',
				axisPointer: { type: 'shadow' },
				backgroundColor: 'rgba(27, 42, 74, 0.92)',
				borderColor: 'rgba(255, 255, 255, 0.08)',
				borderWidth: 1,
				textStyle: { color: '#fff', fontSize: 13 },
				formatter: (params: Array<{ dataIndex: number }>) => {
					const idx = params[0].dataIndex;
					const item = d[idx];
					return `<strong>${item.sku_name}</strong><br/>批次: ${item.batch_no}<br/>周转率: ${item.turnover_rate.toFixed(2)}<br/>平均库龄: ${item.avg_age_days}天<br/>当前库存: ${item.current_qty.toLocaleString()}`;
				}
			},
			grid: {
				left: '3%',
				right: '8%',
				bottom: '3%',
				top: 8,
				containLabel: true
			},
			xAxis: {
				type: 'value',
				axisLabel: { fontSize: 12, color: '#666' },
				splitLine: { lineStyle: { color: '#f0f0f0' } }
			},
			yAxis: {
				type: 'category',
				data: labels,
				axisLabel: {
					fontSize: 12,
					color: '#333',
					width: 140,
					overflow: 'truncate',
					ellipsis: '...'
				},
				axisLine: { lineStyle: { color: '#ddd' } },
				inverse: false
			},
			series: [
				{
					type: 'bar',
					data: values,
					itemStyle: {
						color: barColor,
						borderRadius: [0, 4, 4, 0]
					},
					barMaxWidth: 24,
					label: {
						show: true,
						position: 'right',
						formatter: (params: { value: number }) => params.value.toFixed(2),
						fontSize: 11,
						color: '#666'
					}
				}
			]
		};
	}

	function handleResize() {
		chartInstance?.resize();
	}

	$effect(() => {
		if (chartInstance) {
			chartInstance.setOption(getOption(filteredData), true);
		}
	});

	onMount(() => {
		if (chartContainer) {
			chartInstance = echarts.init(chartContainer);
			if (filteredData.length > 0) {
				chartInstance.setOption(getOption(filteredData));
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

<div class="flex flex-col w-full">
	<div class="flex gap-2 mb-3">
		<button
			class="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
			class:bg-[#FF6B35]={activeTab === 'top'}
			class:text-white={activeTab === 'top'}
			class:bg-gray-100={activeTab !== 'top'}
			class:text-gray-600={activeTab !== 'top'}
			onclick={() => (activeTab = 'top')}
		>
			周转最快 TOP 10
		</button>
		<button
			class="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
			class:bg-[#EF4444]={activeTab === 'bottom'}
			class:text-white={activeTab === 'bottom'}
			class:bg-gray-100={activeTab !== 'bottom'}
			class:text-gray-600={activeTab !== 'bottom'}
			onclick={() => (activeTab = 'bottom')}
		>
			周转最慢 BOTTOM 10
		</button>
	</div>
	<div bind:this={chartContainer} style="min-height: 360px;"></div>
</div>
