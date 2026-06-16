import { db } from '$lib/server/db';
import { anomalies } from '$lib/server/schema';
import { eq, and, desc, count } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const status = url.searchParams.get('status');
		const severity = url.searchParams.get('severity');
		const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
		const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize')) || 20));
		const offset = (page - 1) * pageSize;

		const conditions = [];
		if (status) conditions.push(eq(anomalies.status, status as 'open' | 'investigating' | 'resolving' | 'closed'));
		if (severity) conditions.push(eq(anomalies.severity, severity as 'low' | 'medium' | 'high'));

		const [totalResult] = await db
			.select({ count: count() })
			.from(anomalies)
			.where(conditions.length > 0 ? and(...conditions) : undefined);

		let query = db.select().from(anomalies);
		if (conditions.length > 0) {
			query = query.where(and(...conditions)) as typeof query;
		}

		const data = await query.orderBy(desc(anomalies.createdAt)).limit(pageSize).offset(offset);

		return json({ data, total: totalResult.count, page, pageSize });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return json({ error: message }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { topicId, type, severity, description, createdBy } = body;

		const [anomaly] = await db
			.insert(anomalies)
			.values({
				topicId,
				type: type ?? 'version_conflict',
				severity: severity ?? 'medium',
				description,
				createdBy
			})
			.returning();

		return json(anomaly, { status: 201 });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return json({ error: message }, { status: 500 });
	}
};
