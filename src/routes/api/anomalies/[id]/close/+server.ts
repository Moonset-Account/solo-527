import { db } from '$lib/server/db';
import { anomalies } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const { closureNote, closedBy } = await request.json();

		const [updated] = await db
			.update(anomalies)
			.set({
				status: 'closed',
				closureNote: closureNote ?? '',
				closedBy: closedBy ?? null,
				closedAt: new Date()
			})
			.where(eq(anomalies.id, params.id))
			.returning();

		if (!updated) {
			return json({ error: 'Anomaly not found' }, { status: 404 });
		}

		return json(updated);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return json({ error: message }, { status: 500 });
	}
};
