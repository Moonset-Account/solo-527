import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { disputeNotes } from '$lib/db/schema';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { itineraryId, category, content, evidence, operatorId, operatorName } = body;

		const [dispute] = await db
			.insert(disputeNotes)
			.values({
				itineraryId,
				category,
				content,
				evidence,
				operatorId,
				operatorName
			})
			.returning();

		return json({ dispute });
	} catch (error) {
		return json({ error: 'Failed to create dispute note' }, { status: 500 });
	}
};
