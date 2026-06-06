import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateAnalysisData } from '$lib/utils/mockData';
import dayjs from 'dayjs';

export const GET: RequestHandler = async ({ url }) => {
	const dimension = (url.searchParams.get('dimension') as any) || 'deliveryMan';
	const date = url.searchParams.get('date') || dayjs().format('YYYY-MM-DD');

	try {
		const data = generateAnalysisData(dimension, date);
		return json({ success: true, data });
	} catch (error) {
		return json(
			{ success: false, error: (error as Error).message },
			{ status: 500 }
		);
	}
};
