import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { disputeNotes } from '$lib/db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const disputes = await db
			.select()
			.from(disputeNotes)
			.where(eq(disputeNotes.itineraryId, params.itineraryId));

		return json({ disputes });
	} catch (error) {
		return json({ error: 'Failed to fetch dispute notes' }, { status: 500 });
	}
};
