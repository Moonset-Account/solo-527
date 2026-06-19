import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { tourRoutes, inventories } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const [route] = await db
			.select()
			.from(tourRoutes)
			.where(eq(tourRoutes.id, params.id));

		if (!route) {
			return json({ error: 'Route not found' }, { status: 404 });
		}

		const [inventory] = await db
			.select()
			.from(inventories)
			.where(eq(inventories.routeId, params.id));

		return json({ route, inventory: inventory || null });
	} catch (error) {
		return json({ error: 'Failed to fetch route detail' }, { status: 500 });
	}
};
