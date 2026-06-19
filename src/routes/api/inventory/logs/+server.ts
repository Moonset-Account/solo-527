import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { inventoryLogs, tourRoutes } from '$lib/db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const routeId = url.searchParams.get('routeId');

		const conditions = [];
		if (routeId) {
			conditions.push(eq(inventoryLogs.routeId, routeId));
		}

		const result = await db
			.select({
				id: inventoryLogs.id,
				routeId: inventoryLogs.routeId,
				type: inventoryLogs.type,
				beforeValue: inventoryLogs.beforeValue,
				afterValue: inventoryLogs.afterValue,
				quantity: inventoryLogs.quantity,
				reason: inventoryLogs.reason,
				operatorId: inventoryLogs.operatorId,
				operatorName: inventoryLogs.operatorName,
				createdAt: inventoryLogs.createdAt,
				routeName: tourRoutes.name
			})
			.from(inventoryLogs)
			.leftJoin(tourRoutes, eq(inventoryLogs.routeId, tourRoutes.id))
			.where(conditions.length > 0 ? and(...conditions) : undefined)
			.orderBy(desc(inventoryLogs.createdAt));

		return json({ logs: result });
	} catch (error) {
		return json({ error: 'Failed to fetch inventory logs' }, { status: 500 });
	}
};
