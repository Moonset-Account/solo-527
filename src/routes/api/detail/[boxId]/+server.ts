import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateDetailData } from '$lib/utils/mockData';
import dayjs from 'dayjs';

export const GET: RequestHandler = async ({ params, url, fetch }) => {
	const boxId = params.boxId;
	const date = url.searchParams.get('date') || dayjs().format('YYYY-MM-DD');

	try {
		const settingsRes = await fetch('/api/settings');
		let lowTempThreshold = 60;
		if (settingsRes.ok) {
			const settingsResult = await settingsRes.json();
			if (settingsResult.success) {
				lowTempThreshold = settingsResult.data.lowTempThreshold;
			}
		}

		const data = generateDetailData(boxId, date);

		const cleanedTemperatures: typeof data.temperatureCurve = [];
		const excludedSamples: typeof data.excludedSamples = [];

		for (let i = 0; i < data.temperatureCurve.length; i++) {
			const point = data.temperatureCurve[i];
			let excludeReason: string | null = null;

			if (point.temperature < 0 || point.temperature > 100) {
				excludeReason = '温度超出合理范围（0°C-100°C）';
			} else if (
				i > 0 &&
				Math.abs(point.temperature - data.temperatureCurve[i - 1].temperature) > 20
			) {
				excludeReason = '传感器数据异常波动（相邻采样温差>20°C）';
			}

			if (excludeReason) {
				excludedSamples.push({
					time: point.time,
					temperature: point.temperature,
					reason: excludeReason
				});
			} else {
				cleanedTemperatures.push(point);
			}
		}

		if (excludedSamples.length > 0) {
			data.excludedSamples = [...excludedSamples, ...data.excludedSamples];
		}

		data.temperatureCurve = cleanedTemperatures;

		return json({ success: true, data, lowTempThreshold });
	} catch (error) {
		return json(
			{ success: false, error: (error as Error).message },
			{ status: 500 }
		);
	}
};
