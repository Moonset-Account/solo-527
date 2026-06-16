import { db } from '$lib/server/db';
import { topics } from '$lib/server/schema';
import { eq, and, like, desc, count } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const status = url.searchParams.get('status');
		const keyword = url.searchParams.get('keyword');
		const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
		const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize')) || 20));
		const offset = (page - 1) * pageSize;

		const conditions = [];
		if (status) conditions.push(eq(topics.status, status as 'draft' | 'pending_approval' | 'approved' | 'in_production' | 'published' | 'archived'));
		if (keyword) conditions.push(like(topics.title, `%${keyword}%`));

		const [totalResult] = await db
			.select({ count: count() })
			.from(topics)
			.where(conditions.length > 0 ? and(...conditions) : undefined);

		let query = db.select().from(topics);
		if (conditions.length > 0) {
			query = query.where(and(...conditions)) as typeof query;
		}

		const data = await query.orderBy(desc(topics.createdAt)).limit(pageSize).offset(offset);

		return json({ data, total: totalResult.count, page, pageSize });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return json({ error: message }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { title, description, createdBy } = body;

		const [topic] = await db
			.insert(topics)
			.values({ title, description: description ?? '', createdBy })
			.returning();

		return json(topic, { status: 201 });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return json({ error: message }, { status: 500 });
	}
};
