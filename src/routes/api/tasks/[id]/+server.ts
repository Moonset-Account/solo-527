import { db } from '$lib/server/db';
import { tasks, deliverables } from '$lib/server/schema';
import { eq, desc } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const [task] = await db.select().from(tasks).where(eq(tasks.id, params.id));
		if (!task) {
			return json({ error: 'Task not found' }, { status: 404 });
		}

		const deliverableList = await db
			.select()
			.from(deliverables)
			.where(eq(deliverables.taskId, params.id))
			.orderBy(desc(deliverables.submittedAt));

		return json({ ...task, deliverables: deliverableList });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return json({ error: message }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const body = await request.json();
		const [updated] = await db
			.update(tasks)
			.set({ ...body, updatedAt: new Date() })
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
