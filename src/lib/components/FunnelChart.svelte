<script lang="ts">
	import { onMount } from 'svelte';
	import * as echarts from 'echarts';

	let { data }: { data: { total_inbound: number; current_inventory: number; effective_turnover: number; fast_turnover: number } | null } = $props();

	let chartContainer: HTMLDivElement;
	let chartInstance: echarts.ECharts | null = null;

	function getOption(d: NonNullable<typeof data>) {
		const stages = [
			{ name: '总入库', value: d.total_inbound },
			{ name: '当前库存', value: d.current_inventory },
			{ name: '有效周转', value: d.effective_turnover },
			{ name: '快速周转', value: d.fast_turnover }
		];

		const colors = ['#1B2A4A', '#3B5998', '#FF6B35', '#2ECDA7'];

		return {
			tooltip: {
				trigger: 'item',
				backgroundColor: 'rgba(27, 42, 74, 0.92)',
				borderColor: 'rgba(255, 255, 255, 0.08)',
				borderWidth: 1,
				textStyle: { color: '#fff', fontSize: 13 },
				formatter: (params: { name: string; value: number; dataIndex: number; percent: number }) => {
					const idx = params.dataIndex;
					const current = params.value;
					const next = idx < stages.length - 1 ? stages[idx + 1].value : null;
					let rateStr = '';
					if (next !== null && current > 0) {
						rateStr = `<br/>转化率: ${((next / current) * 100).toFixed(1)}%`;
					}
					return `<strong>${params.name}</strong><br/>数量: ${current.toLocaleString()}${rateStr}`;
				}
			},
			series: [
				{
					name: '库存流转',
					type: 'funnel',
					left: '10%',
					top: 20,
					bottom: 20,
					width: '80%',
					min: 0,
					max: d.total_inbound,
					minSize: '0%',
					maxSize: '100%',
					sort: 'descending',
					gap: 4,
					label: {
						show: true,
						position: 'inside',
						formatter: (params: { name: string; value: number }) => {
							return `${params.name}\n${params.value.toLocaleString()}`;
						},
						fontSize: 13,
						fontWeight: 600,
						color: '#fff'
					},
					labelLine: {
						show: false
					},
					itemStyle: {
						borderColor: 'rgba(255,255,255,0.15)',
						borderWidth: 1
					},
					emphasis: {
						label: {
							fontSize: 15
						}
					},
					data: stages.map((s, i) => ({
						name: s.name,
						value: s.value,
						itemStyle: { color: colors[i] }
					}))
				}
			]
		};
	}

	function handleResize() {
		chartInstance?.resize();
	}

	$effect(() => {
		if (chartInstance && data) {
			chartInstance.setOption(getOption(data), true);
		}
	});

	onMount(() => {
		if (chartContainer) {
			chartInstance = echarts.init(chartContainer);
			if (data) {
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
