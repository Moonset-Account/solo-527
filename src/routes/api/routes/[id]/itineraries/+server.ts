import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { itineraries } from '$lib/db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const result = await db
			.select()
			.from(itineraries)
			.where(eq(itineraries.routeId, params.id))
			.orderBy(desc(itineraries.version));

		return json({ itineraries: result });
	} catch (error) {
		return json({ error: 'Failed to fetch itineraries' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const body = await request.json();
		const { departureTime, guide, content, changeReason, operatorId, operatorName } = body;

		const [maxVersionResult] = await db
			.select({ maxVersion: sql<number>`coalesce(max(${itineraries.version}), 0)` })
			.from(itineraries)
			.where(eq(itineraries.routeId, params.id));

		const nextVersion = (maxVersionResult?.maxVersion ?? 0) + 1;

		const [itinerary] = await db
			.insert(itineraries)
			.values({
				routeId: params.id,
				version: nextVersion,
				departureTime,
				guide,
				content,
				changeReason,
				operatorId,
				operatorName
			})
			.returning();

		return json({ itinerary });
	} catch (error) {
		return json({ error: 'Failed to create itinerary' }, { status: 500 });
	}
};
