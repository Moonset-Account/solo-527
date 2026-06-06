import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateOverviewData, generateAnalysisData } from '$lib/utils/mockData';
import dayjs from 'dayjs';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { date, dimension, lowTempThreshold, minSampleCount, exportTimeRange } = body;

		const effectiveMinSampleCount = minSampleCount || 3;
		const effectiveLowTempThreshold = lowTempThreshold || 60;
		const effectiveDate = date || dayjs().format('YYYY-MM-DD');

		const overviewData = generateOverviewData(effectiveDate, effectiveMinSampleCount);

		overviewData.lowTempBoxes = overviewData.lowTempBoxes.map((box) => {
			if (box.sampleCount < effectiveMinSampleCount) {
				return { ...box, status: 'pending' as const };
			}
			return box;
		});

		overviewData.stats.lowTempBoxCount = overviewData.lowTempBoxes.filter(
			(b) => b.status === 'confirmed' && b.sampleCount >= effectiveMinSampleCount
		).length;

		const analysisData = generateAnalysisData(
			dimension || 'deliveryMan',
			effectiveDate
		);

		const report = {
			exportTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
			statisticalPeriod: effectiveDate,
			exportTimeRange: exportTimeRange || '06:00-18:00',
			lowTempThreshold: effectiveLowTempThreshold,
			minSampleCount: effectiveMinSampleCount,
			stats: overviewData.stats,
			lowTempBoxes: overviewData.lowTempBoxes.map((box) => ({
				...box,
				isPendingReview: box.sampleCount < effectiveMinSampleCount,
				rankEligible: box.sampleCount >= effectiveMinSampleCount && box.status === 'confirmed'
			})),
			lateBuildings: overviewData.lateBuildings,
			analysisSummary: analysisData.data,
			excludedSamplesNote:
				'数据清洗规则说明：\n' +
				'1. 温度超出合理范围（<0°C 或 >100°C）的采样点已剔除\n' +
				'2. 相邻采样点温差 > 20°C 的异常波动数据已剔除\n' +
				'3. 采样次数不足 ' + effectiveMinSampleCount + ' 次的低温箱号仅标记为"待复核"，不进入排行榜统计\n' +
				'4. 低温阈值设定为 ' + effectiveLowTempThreshold + '°C，低于此温度的餐品标记为低温异常',
			dataCleaningSummary: {
				totalExcludedRules: 2,
				minSampleRequirement: effectiveMinSampleCount,
				lowTempThreshold: effectiveLowTempThreshold
			}
		};

		return json({ success: true, data: report });
	} catch (error) {
		return json(
			{ success: false, error: (error as Error).message },
			{ status: 500 }
		);
	}
};
