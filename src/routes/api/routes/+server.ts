import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { tourRoutes, inventories } from '$lib/db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';

export const GET: RequestHandler = async () => {
	try {
		const routes = await db
			.select({
				id: tourRoutes.id,
				name: tourRoutes.name,
				city: tourRoutes.city,
				description: tourRoutes.description,
				status: tourRoutes.status,
				meetingPoint: tourRoutes.meetingPoint,
				duration: tourRoutes.duration,
				createdAt: tourRoutes.createdAt,
				updatedAt: tourRoutes.updatedAt,
				inventoryAvailable: inventories.available,
				inventorySold: inventories.sold,
				inventoryReserved: inventories.reserved,
				inventoryTotal: inventories.total
			})
			.from(tourRoutes)
			.leftJoin(inventories, eq(tourRoutes.id, inventories.routeId));

		return json({ routes });
	} catch (error) {
		return json({ error: 'Failed to fetch tour routes' }, { status: 500 });
	}
};
