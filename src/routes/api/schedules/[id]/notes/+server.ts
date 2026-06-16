import { db } from '$lib/server/db';
import { schedules } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const { supplementaryNotes } = await request.json();

		const [updated] = await db
			.update(schedules)
			.set({ supplementaryNotes })
			.where(eq(schedules.id, params.id))
			.returning();

		if (!updated) {
			return json({ error: 'Schedule not found' }, { status: 404 });
		}

		return json(updated);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return json({ error: message }, { status: 500 });
	}
};
