import { db } from '$lib/server/db';
import { tasks } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const { status } = await request.json();

		const [updated] = await db
			.update(tasks)
			.set({ status, updatedAt: new Date() })
			.where(eq(tasks.id, params.id))
			.returning();

		if (!updated) {
			return json({ error: 'Task not found' }, { status: 404 });
		}

		return json(updated);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return json({ error: message }, { status: 500 });
	}
};
