import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { touristReviews } from '$lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const body = await request.json();
		const { reply, processingNote, operatorId, operatorName } = body;

		const [existing] = await db
			.select()
			.from(touristReviews)
			.where(eq(touristReviews.id, params.id));

		if (!existing) {
			return json({ error: 'Review not found' }, { status: 404 });
		}

		const [review] = await db
			.update(touristReviews)
			.set({
				reply,
				processingNote,
				operatorId,
				operatorName
			})
			.where(eq(touristReviews.id, params.id))
			.returning();

		return json({ review });
	} catch (error) {
		return json({ error: 'Failed to reply to review' }, { status: 500 });
	}
};
