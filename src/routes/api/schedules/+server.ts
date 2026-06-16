import { db } from '$lib/server/db';
import { schedules } from '$lib/server/schema';
import { eq, and, like, count } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const month = url.searchParams.get('month');
		const platform = url.searchParams.get('platform');
		const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
		const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize')) || 20));
		const offset = (page - 1) * pageSize;

		const conditions = [];
		if (month) conditions.push(like(schedules.publishDate, `${month}%`));
		if (platform) conditions.push(eq(schedules.platform, platform));

		const [totalResult] = await db
			.select({ count: count() })
			.from(schedules)
			.where(conditions.length > 0 ? and(...conditions) : undefined);

		let query = db.select().from(schedules);
		if (conditions.length > 0) {
			query = query.where(and(...conditions)) as typeof query;
		}

		const data = await query.orderBy(schedules.publishDate, schedules.publishTime).limit(pageSize).offset(offset);

		return json({ data, total: totalResult.count, page, pageSize });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return json({ error: message }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { topicId, platform, accountName, publishDate, publishTime, supplementaryNotes, createdBy } = body;

		const [schedule] = await db
			.insert(schedules)
			.values({
				topicId,
				platform,
				accountName,
				publishDate,
				publishTime: publishTime ?? '09:00',
				supplementaryNotes: supplementaryNotes ?? '',
				createdBy
			})
			.returning();

		return json(schedule, { status: 201 });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return json({ error: message }, { status: 500 });
	}
};
