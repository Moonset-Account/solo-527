<script lang="ts">
	import EChart from './EChart.svelte';
	import MetricDefinition from '$components/MetricDefinition.svelte';
	import type { SankeyData } from '$types';

	export let data: SankeyData;
	export let title = '流程瓶颈分析';
	export let height = '500px';

	let option: any;
	$: option = {
		title: {
			text: title,
			left: 'center',
			textStyle: {
				fontSize: 16,
				fontWeight: 600,
				color: '#1f2937'
			}
		},
		tooltip: {
			trigger: 'item',
			triggerOn: 'mousemove',
			formatter: (params: any) => {
				if (params.dataType === 'edge') {
					return `${params.data.source} → ${params.data.target}<br/>
							患者数量: <b>${params.data.value}</b><br/>
							平均等待: <b>${params.data.waitTime} 分钟</b>`;
				}
				return `${params.name}`;
			}
		},
		series: [
			{
				type: 'sankey',
				layout: 'none',
				emphasis: {
					focus: 'adjacency'
				},
				data: data.nodes.map((n) => ({
					...n,
					itemStyle: {
						color: getNodeColor(n.name)
					}
				})),
				links: data.links.map((l) => ({
					...l,
					lineStyle: {
						color: 'gradient',
						curveness: 0.5,
						opacity: 0.6
					}
				})),
				lineStyle: {
					curveness: 0.5
				},
				label: {
					show: true,
					fontSize: 13,
					color: '#374151'
				}
			}
		]
	};

	function getNodeColor(name: string): string {
		const colors: Record<string, string> = {
			挂号: '#165DFF',
			签到: '#00B42A',
			分诊: '#FF7D00',
			叫号: '#F53F3F',
			缴费: '#722ED1',
			取药: '#14C9C9'
		};
		return colors[name] || '#86909C';
	}
</script>

<div class="card">
	<EChart {option} {height} />
	<div class="mt-4">
		<MetricDefinition
			title="桑基图口径说明"
			customDefinition={{
				key: 'sankey',
				name: '流程桑基图',
				definition:
					'展示患者在门诊各流程节点间的流转情况，连线宽度表示患者数量，颜色深浅表示平均等待时间长短。',
				calculation:
					'基于各环节时间戳计算患者流转路径和等待时长，统计所有有效记录的流转情况。',
				limitations: [
					'仅统计时间戳完整的记录',
					'部分患者可能跳过某些环节',
					'连线宽度与患者数量成正比'
				]
			}}
		/>
	</div>
</div>
