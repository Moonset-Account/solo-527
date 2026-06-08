import type {
	ExportMetadata,
	FilterState,
	BottleneckData,
	HeatmapData,
	VersionCompareData,
	PathFlowNode,
	PathFlowLink,
	DiscussionRecord,
	RefundRecord
} from './types';
import { maskRefundFeedback, getExportDiscussionText } from './privacy';

export function generateReport(
	metadata: ExportMetadata,
	pathNodes: PathFlowNode[],
	pathLinks: PathFlowLink[],
	bottlenecks: BottleneckData[],
	heatmap: HeatmapData[],
	versionData: VersionCompareData[],
	discussions: DiscussionRecord[],
	refunds: RefundRecord[],
	isInternal: boolean
): string {
	const lines: string[] = [];

	lines.push('=== 网课学习路径分析报告 ===');
	lines.push('');
	lines.push(`生成时间: ${metadata.generatedAt}`);
	lines.push(`时间窗口: ${metadata.timeWindow[0]} ~ ${metadata.timeWindow[1]}`);
	lines.push(`样本量: ${metadata.sampleSize}`);
	lines.push('');
	lines.push('--- 筛选口径 ---');
	lines.push(`课程: ${metadata.filterCriteria.course}`);
	lines.push(
		`章节: ${metadata.filterCriteria.chapters.length > 0 ? metadata.filterCriteria.chapters.join(', ') : '全部'}`
	);
	lines.push(
		`版本: ${metadata.filterCriteria.versions.length > 0 ? metadata.filterCriteria.versions.join(', ') : '全部'}`
	);
	lines.push('');

	lines.push('--- 路径流向 ---');
	pathLinks.forEach((link) => {
		lines.push(`  ${link.source} → ${link.target}: ${link.value} 人`);
	});
	lines.push('');

	lines.push('--- 卡点章节 ---');
	bottlenecks.forEach((b) => {
		const tag = b.is_transition ? ' [过渡样本]' : '';
		lines.push(
			`  ${b.chapter_id}${tag}: 流失率 ${(b.dropoff_rate * 100).toFixed(1)}%, 完成率 ${(b.avg_completion * 100).toFixed(1)}%, 平均分 ${b.avg_score.toFixed(1)}, 样本量 ${b.sample_size}`
		);
	});
	lines.push('');

	lines.push('--- 错题热力 TOP10 ---');
	const sorted = [...heatmap].sort((a, b) => b.wrong_count - a.wrong_count).slice(0, 10);
	sorted.forEach((h) => {
		lines.push(`  ${h.chapter_id} / ${h.question_id}: ${h.wrong_count} 次`);
	});
	lines.push('');

	lines.push('--- 版本对比 ---');
	const grouped = new Map<string, VersionCompareData[]>();
	versionData.forEach((v) => {
		const key = `${v.chapter_id}|${v.metric}`;
		if (!grouped.has(key)) grouped.set(key, []);
		grouped.get(key)!.push(v);
	});
	grouped.forEach((items, key) => {
		const [ch, metric] = key.split('|');
		lines.push(`  ${ch} - ${metric}:`);
		items.forEach((it) => {
			lines.push(`    v${it.version}: ${it.value.toFixed(2)} (n=${it.sample_size})`);
		});
	});
	lines.push('');

	lines.push('--- 讨论摘要 ---');
	discussions.slice(0, 20).forEach((d) => {
		const text = getExportDiscussionText(d, isInternal);
		lines.push(`  [${d.chapter_id}] ${text}`);
	});
	lines.push('');

	lines.push('--- 退款反馈(脱敏) ---');
	refunds.slice(0, 20).forEach((r) => {
		const masked = maskRefundFeedback(r);
		lines.push(`  [${masked.chapter_id}] ${masked.reason}: ${masked.feedback}`);
	});

	return lines.join('\n');
}

export function downloadReport(content: string, filename?: string) {
	const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename || `学习路径分析报告_${new Date().toISOString().slice(0, 10)}.txt`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}
