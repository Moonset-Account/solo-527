import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { todoItems } from '$lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export const PATCH: RequestHandler = async ({ params, request }) => {
	try {
		const body = await request.json();
		const { status, result, evidence, operatorId, operatorName } = body;

		const [existing] = await db
			.select()
			.from(todoItems)
			.where(eq(todoItems.id, params.id));

		if (!existing) {
			return json({ error: 'Todo not found' }, { status: 404 });
		}

		const updateData: Record<string, unknown> = {};
		if (status !== undefined) updateData.status = status;
		if (result !== undefined) updateData.result = result;
		if (evidence !== undefined) updateData.evidence = evidence;
		if (operatorId !== undefined) updateData.operatorId = operatorId;
		if (operatorName !== undefined) updateData.operatorName = operatorName;

		if (status === 'completed') {
			updateData.completedAt = sql`now()`;
		}

		const [todo] = await db
			.update(todoItems)
			.set(updateData)
			.where(eq(todoItems.id, params.id))
			.returning();

		return json({ todo });
	} catch (error) {
		return json({ error: 'Failed to update todo' }, { status: 500 });
	}
};
