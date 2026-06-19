import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { reminderRules } from '$lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const body = await request.json();
		const { name, condition, action, operatorId, operatorName } = body;

		const [existing] = await db
			.select()
			.from(reminderRules)
			.where(eq(reminderRules.id, params.id));

		if (!existing) {
			return json({ error: 'Rule not found' }, { status: 404 });
		}

		const [rule] = await db
			.update(reminderRules)
			.set({
				name,
				condition,
				action,
				operatorId,
				operatorName,
				updatedAt: sql`now()`
			})
			.where(eq(reminderRules.id, params.id))
			.returning();

		return json({ rule });
	} catch (error) {
		return json({ error: 'Failed to update rule' }, { status: 500 });
	}
};
