import { db } from '$lib/server/db';
import { anomalies } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const [anomaly] = await db.select().from(anomalies).where(eq(anomalies.id, params.id));
		if (!anomaly) {
			return json({ error: 'Anomaly not found' }, { status: 404 });
		}

		return json(anomaly);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return json({ error: message }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const body = await request.json();
		const [updated] = await db
			.update(anomalies)
			.set(body)
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
