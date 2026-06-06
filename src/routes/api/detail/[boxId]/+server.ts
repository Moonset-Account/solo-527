import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateDetailData } from '$lib/utils/mockData';
import dayjs from 'dayjs';

export const GET: RequestHandler = async ({ params, url }) => {
	const boxId = params.boxId;
	const date = url.searchParams.get('date') || dayjs().format('YYYY-MM-DD');

	try {
		const data = generateDetailData(boxId, date);
		return json({ success: true, data });
	} catch (error) {
		return json(
			{ success: false, error: (error as Error).message },
			{ status: 500 }
		);
	}
};
