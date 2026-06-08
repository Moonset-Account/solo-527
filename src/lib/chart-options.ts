import type { PathFlowNode, PathFlowLink, BottleneckData, HeatmapData, VersionCompareData } from './types';

export function sankeyOption(nodes: PathFlowNode[], links: PathFlowLink[]) {
	return {
		title: { text: '学习路径流向', left: 'center', textStyle: { fontSize: 14 } },
		tooltip: {
			trigger: 'item',
			triggerOn: 'mousemove',
			formatter: (params: any) => {
				if (params.dataType === 'edge') {
					return `${params.data.source} → ${params.data.target}<br/>人数: ${params.data.value}`;
				}
				return `${params.name}<br/>总量: ${params.value}`;
			}
		},
		series: [
			{
				type: 'sankey',
				data: nodes,
				links: links,
				left: 20,
				right: 160,
				top: 40,
				bottom: 20,
				nodeWidth: 20,
				nodeGap: 8,
				layoutIterations: 32,
				orient: 'horizontal',
				label: { position: 'right', fontSize: 11 },
				lineStyle: { color: 'gradient', curveness: 0.5 },
				emphasis: { focus: 'adjacency' }
			}
		]
	};
}

export function bottleneckOption(data: BottleneckData[]) {
	const sorted = [...data].sort((a, b) => b.dropoff_rate - a.dropoff_rate).slice(0, 10);
	return {
		title: { text: '卡点章节 TOP10', left: 'center', textStyle: { fontSize: 14 } },
		tooltip: {
			trigger: 'axis',
			axisPointer: { type: 'shadow' },
			formatter: (params: any) => {
				const d = sorted[params[0].dataIndex];
				const tag = d.is_transition ? ' ⚠过渡样本' : '';
				return `${d.chapter_id}${tag}<br/>流失率: ${(d.dropoff_rate * 100).toFixed(1)}%<br/>完成率: ${(d.avg_completion * 100).toFixed(1)}%<br/>平均分: ${d.avg_score.toFixed(2)}<br/>样本量: ${d.sample_size}`;
			}
		},
		grid: { left: 120, right: 40, top: 50, bottom: 30 },
		xAxis: { type: 'value', axisLabel: { formatter: (v: number) => `${(v * 100).toFixed(0)}%` } },
		yAxis: {
			type: 'category',
			data: sorted.map((d) => {
				const tag = d.is_transition ? ' ⚠' : '';
				return d.chapter_id + tag;
			}),
			axisLabel: { fontSize: 10 }
		},
		series: [
			{
				type: 'bar',
				data: sorted.map((d) => ({
					value: d.dropoff_rate,
					itemStyle: { color: d.is_transition ? '#faad14' : '#ee6666' }
				})),
				barWidth: '60%'
			}
		]
	};
}

export function heatmapOption(data: HeatmapData[], chapters: string[]) {
	const questions = [...new Set(data.map((d) => d.question_id))].sort();
	const maxVal = Math.max(...data.map((d) => d.wrong_count), 1);

	return {
		title: { text: '错题热力图', left: 'center', textStyle: { fontSize: 14 } },
		tooltip: {
			formatter: (params: any) => {
				return `${chapters[params.value[1]] || ''}<br/>${questions[params.value[0]] || ''}<br/>错误次数: ${params.value[2]}`;
			}
		},
		grid: { left: 120, right: 60, top: 50, bottom: 80 },
		xAxis: {
			type: 'category',
			data: questions,
			axisLabel: { rotate: 45, fontSize: 9 }
		},
		yAxis: {
			type: 'category',
			data: chapters,
			axisLabel: { fontSize: 10 }
		},
		visualMap: {
			min: 0,
			max: maxVal,
			orient: 'horizontal',
			left: 'center',
			bottom: 0,
			inRange: { color: ['#fff7e6', '#ffd591', '#ff7a45', '#cf1322'] }
		},
		series: [
			{
				type: 'heatmap',
				data: data.map((d) => [
					questions.indexOf(d.question_id),
					chapters.indexOf(d.chapter_id),
					d.wrong_count
				]),
				label: { show: true, fontSize: 9 },
				emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.5)' } }
			}
		]
	};
}

export function versionCompareOption(data: VersionCompareData[]) {
	const chapters = [...new Set(data.map((d) => d.chapter_id))];
	const versions = [...new Set(data.map((d) => d.version))].sort();
	const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de'];

	return {
		title: { text: '版本对比', left: 'center', textStyle: { fontSize: 14 } },
		tooltip: {
			trigger: 'axis',
			axisPointer: { type: 'shadow' },
			formatter: (params: any) => {
				let tip = params[0].axisValue + '<br/>';
				params.forEach((p: any) => {
					const d = data.find(
						(r) =>
							r.chapter_id === chapters[p.dataIndex] &&
							r.version === versions[p.seriesIndex] &&
							r.metric === '完成率'
					);
					const n = d ? `(n=${d.sample_size})` : '';
					tip += `${p.marker} ${p.seriesName}: ${(p.value * 100).toFixed(1)}% ${n}<br/>`;
				});
				return tip;
			}
		},
		legend: { data: versions.map((v) => `v${v}`), top: 25 },
		grid: { left: 120, right: 40, top: 60, bottom: 30 },
		xAxis: { type: 'value', axisLabel: { formatter: (v: number) => `${(v * 100).toFixed(0)}%` } },
		yAxis: { type: 'category', data: chapters, axisLabel: { fontSize: 10 } },
		series: versions.map((ver, i) => ({
			name: `v${ver}`,
			type: 'bar',
			data: chapters.map((ch) => {
				const rec = data.find((r) => r.chapter_id === ch && r.version === ver && r.metric === '完成率');
				return rec ? rec.value : 0;
			}),
			itemStyle: { color: colors[i % colors.length] }
		}))
	};
}
