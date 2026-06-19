import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { reminderRules } from '$lib/db/schema';

export const GET: RequestHandler = async () => {
	try {
		const rules = await db.select().from(reminderRules);
		return json({ rules });
	} catch (error) {
		return json({ error: 'Failed to fetch rules' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { name, condition, action, operatorId, operatorName } = body;

		const [rule] = await db
			.insert(reminderRules)
			.values({
				name,
				condition,
				action,
				operatorId,
				operatorName
			})
			.returning();

		return json({ rule });
	} catch (error) {
		return json({ error: 'Failed to create rule' }, { status: 500 });
	}
};
