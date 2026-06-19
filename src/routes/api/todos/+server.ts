import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { todoItems, todoStatusEnum, todoUrgencyEnum } from '$lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const statusParam = url.searchParams.get('status');
		const urgencyParam = url.searchParams.get('urgency');

		const conditions = [];
		if (statusParam && todoStatusEnum.enumValues.includes(statusParam as typeof todoStatusEnum.enumValues[number])) {
			conditions.push(eq(todoItems.status, statusParam as typeof todoStatusEnum.enumValues[number]));
		}
		if (urgencyParam && todoUrgencyEnum.enumValues.includes(urgencyParam as typeof todoUrgencyEnum.enumValues[number])) {
			conditions.push(eq(todoItems.urgency, urgencyParam as typeof todoUrgencyEnum.enumValues[number]));
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
