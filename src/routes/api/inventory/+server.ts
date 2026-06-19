import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { inventories, tourRoutes } from '$lib/db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';

export const GET: RequestHandler = async () => {
	try {
		const result = await db
			.select({
				id: inventories.id,
				routeId: inventories.routeId,
				available: inventories.available,
				sold: inventories.sold,
				reserved: inventories.reserved,
				total: inventories.total,
				updatedAt: inventories.updatedAt,
				routeName: tourRoutes.name
			})
			.from(inventories)
			.leftJoin(tourRoutes, eq(inventories.routeId, tourRoutes.id));

		return json({ inventories: result });
	} catch (error) {
		return json({ error: 'Failed to fetch inventories' }, { status: 500 });
	}
};
