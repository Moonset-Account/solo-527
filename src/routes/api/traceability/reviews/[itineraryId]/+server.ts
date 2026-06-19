import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { touristReviews } from '$lib/db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const reviews = await db
			.select()
			.from(touristReviews)
			.where(eq(touristReviews.itineraryId, params.itineraryId));

		return json({ reviews });
	} catch (error) {
		return json({ error: 'Failed to fetch tourist reviews' }, { status: 500 });
	}
};
