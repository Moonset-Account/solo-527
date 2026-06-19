import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { todoItems } from '$lib/db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const status = url.searchParams.get('status');
		const urgency = url.searchParams.get('urgency');

		const conditions = [];
		if (status) {
			conditions.push(eq(todoItems.status, status));
		}
		if (urgency) {
			conditions.push(eq(todoItems.urgency, urgency));
		}

		const todos = await db
			.select()
			.from(todoItems)
			.where(conditions.length > 0 ? and(...conditions) : undefined)
			.orderBy(desc(todoItems.urgency), desc(todoItems.createdAt));

		return json({ todos });
	} catch (error) {
		return json({ error: 'Failed to fetch todos' }, { status: 500 });
	}
};
