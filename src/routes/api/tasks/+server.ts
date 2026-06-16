import { db } from '$lib/server/db';
import { tasks } from '$lib/server/schema';
import { eq, and, like, desc, count } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const type = url.searchParams.get('type');
		const status = url.searchParams.get('status');
		const assignee = url.searchParams.get('assignee');
		const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
		const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize')) || 20));
		const offset = (page - 1) * pageSize;

		const conditions = [];
		if (type) conditions.push(eq(tasks.type, type as 'shooting' | 'editing'));
		if (status) conditions.push(eq(tasks.status, status as 'assigned' | 'in_progress' | 'submitted' | 'reviewing' | 'completed'));
		if (assignee) conditions.push(eq(tasks.assigneeId, assignee));

		const [totalResult] = await db
			.select({ count: count() })
			.from(tasks)
			.where(conditions.length > 0 ? and(...conditions) : undefined);

		let query = db.select().from(tasks);
		if (conditions.length > 0) {
			query = query.where(and(...conditions)) as typeof query;
		}

		const data = await query.orderBy(desc(tasks.createdAt)).limit(pageSize).offset(offset);

		return json({ data, total: totalResult.count, page, pageSize });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return json({ error: message }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { topicId, type, title, description, assigneeId, deadline, createdBy } = body;

		const [task] = await db
			.insert(tasks)
			.values({ topicId, type, title, description: description ?? '', assigneeId, deadline, createdBy })
			.returning();

		return json(task, { status: 201 });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return json({ error: message }, { status: 500 });
	}
};
