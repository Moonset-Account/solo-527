import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateOverviewData, generateAnalysisData } from '$lib/utils/mockData';
import dayjs from 'dayjs';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { date, dimension, lowTempThreshold, minSampleCount, exportTimeRange } = body;

		const overviewData = generateOverviewData(date || dayjs().format('YYYY-MM-DD'));
		const analysisData = generateAnalysisData(dimension || 'deliveryMan', date || dayjs().format('YYYY-MM-DD'));

		const report = {
			exportTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
			statisticalPeriod: date || dayjs().format('YYYY-MM-DD'),
			exportTimeRange: exportTimeRange || '06:00-18:00',
			lowTempThreshold: lowTempThreshold || 60,
			minSampleCount: minSampleCount || 3,
			stats: overviewData.stats,
			lowTempBoxes: overviewData.lowTempBoxes.map((box) => ({
				...box,
				isPendingReview: box.sampleCount < minSampleCount
			})),
			lateBuildings: overviewData.lateBuildings,
			analysisSummary: analysisData.data,
			excludedSamplesNote:
				'已剔除的异常采样点包括：温度超出合理范围（<0°C 或 >100°C）、温度突变（相邻采样点温差>20°C）'
		};

		return json({ success: true, data: report });
	} catch (error) {
		return json(
			{ success: false, error: (error as Error).message },
			{ status: 500 }
		);
	}
};
