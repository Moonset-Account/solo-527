import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { inventories, inventoryLogs } from '$lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const body = await request.json();
		const { type, quantity, reason, operatorId, operatorName } = body;

		const [current] = await db
			.select()
			.from(inventories)
			.where(eq(inventories.id, params.id));

		if (!current) {
			return json({ error: 'Inventory not found' }, { status: 404 });
		}

		let newTotal = current.total;
		let newSold = current.sold;
		let newReserved = current.reserved;

		switch (type) {
			case 'manual_adjust':
				newTotal = current.total + quantity;
				break;
			case 'order_deduct':
				newSold = current.sold + quantity;
				break;
			case 'reserve_release':
				newReserved = current.reserved - quantity;
				break;
			case 'reserve_hold':
				newReserved = current.reserved + quantity;
				break;
		}

		const newAvailable = newTotal - newSold - newReserved;

		const beforeValue = type === 'manual_adjust' ? current.total
			: type === 'order_deduct' ? current.sold
			: type === 'reserve_release' ? current.reserved
			: current.reserved;

		const afterValue = type === 'manual_adjust' ? newTotal
			: type === 'order_deduct' ? newSold
			: type === 'reserve_release' ? newReserved
			: newReserved;

		const [updatedInventory] = await db
			.update(inventories)
			.set({
				total: newTotal,
				sold: newSold,
				reserved: newReserved,
				available: newAvailable,
				updatedAt: sql`now()`
			})
			.where(eq(inventories.id, params.id))
			.returning();

		const [log] = await db
			.insert(inventoryLogs)
			.values({
				routeId: current.routeId,
				type,
				beforeValue,
				afterValue,
				quantity,
				reason,
				operatorId,
				operatorName
			})
			.returning();

		return json({ inventory: updatedInventory, log });
	} catch (error) {
		return json({ error: 'Failed to adjust inventory' }, { status: 500 });
	}
};
