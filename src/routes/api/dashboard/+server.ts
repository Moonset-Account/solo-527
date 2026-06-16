import { db } from '$lib/server/db';
import { topics, tasks, anomalies, schedules } from '$lib/server/schema';
import { eq, ne, count } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	try {
		const topicStatuses = ['draft', 'pending_approval', 'approved', 'in_production', 'published', 'archived'] as const;
		const taskStatuses = ['assigned', 'in_progress', 'submitted', 'reviewing', 'completed'] as const;

		const topicsByStatus: Record<string, number> = {};
		for (const status of topicStatuses) {
			const [result] = await db.select({ count: count() }).from(topics).where(eq(topics.status, status));
			topicsByStatus[status] = result.count;
		}

		const tasksByStatus: Record<string, number> = {};
		for (const status of taskStatuses) {
			const [result] = await db.select({ count: count() }).from(tasks).where(eq(tasks.status, status));
			tasksByStatus[status] = result.count;
		}

		const [openAnomaliesResult] = await db
			.select({ count: count() })
			.from(anomalies)
			.where(ne(anomalies.status, 'closed'));

		const upcomingSchedules = await db
			.select()
			.from(schedules)
			.where(eq(schedules.status, 'scheduled'))
			.orderBy(schedules.publishDate)
			.limit(10);

		return json({
			topicsByStatus,
			tasksByStatus,
			openAnomalies: openAnomaliesResult.count,
			upcomingSchedules
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return json({ error: message }, { status: 500 });
	}
};
