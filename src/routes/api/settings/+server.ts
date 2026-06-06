import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const defaultSettings = {
	lowTempThreshold: 60,
	minSampleCount: 3,
	lateDeliveryThreshold: 15,
	exportTimeRange: '06:00-18:00'
};

let currentSettings = { ...defaultSettings };

export const GET: RequestHandler = async () => {
	return json({ success: true, data: currentSettings });
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		currentSettings = { ...currentSettings, ...body };
		return json({ success: true, data: currentSettings });
	} catch (error) {
		return json(
			{ success: false, error: (error as Error).message },
			{ status: 400 }
		);
	}
};
