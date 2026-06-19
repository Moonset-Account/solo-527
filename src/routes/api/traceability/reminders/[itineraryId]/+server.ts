import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { assemblyReminders } from '$lib/db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const reminders = await db
			.select()
			.from(assemblyReminders)
			.where(eq(assemblyReminders.itineraryId, params.itineraryId));

		return json({ reminders });
	} catch (error) {
		return json({ error: 'Failed to fetch assembly reminders' }, { status: 500 });
	}
};
