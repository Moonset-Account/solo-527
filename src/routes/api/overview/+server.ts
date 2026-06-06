import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateOverviewData } from '$lib/utils/mockData';
import dayjs from 'dayjs';

let cachedSettings = {
	lowTempThreshold: 60,
	minSampleCount: 3,
	lateDeliveryThreshold: 15,
	exportTimeRange: '06:00-18:00'
};

export const GET: RequestHandler = async ({ url, fetch }) => {
	const date = url.searchParams.get('date') || dayjs().format('YYYY-MM-DD');

	try {
		const settingsRes = await fetch('/api/settings');
		if (settingsRes.ok) {
			const settingsResult = await settingsRes.json();
			if (settingsResult.success) {
				cachedSettings = settingsResult.data;
			}
		}

		const data = generateOverviewData(date, cachedSettings.minSampleCount);

		data.lowTempBoxes = data.lowTempBoxes.map((box) => {
			if (box.sampleCount < cachedSettings.minSampleCount) {
				return { ...box, status: 'pending' as const };
			}
			return box;
		});

		data.stats.lowTempBoxCount = data.lowTempBoxes.filter(
			(b) => b.status === 'confirmed' && b.sampleCount >= cachedSettings.minSampleCount
		).length;

		return json({ success: true, data });
	} catch (error) {
		return json(
			{ success: false, error: (error as Error).message },
			{ status: 500 }
		);
	}
};
