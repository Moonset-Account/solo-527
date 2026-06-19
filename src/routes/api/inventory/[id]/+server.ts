import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { inventories, inventoryLogs, reminderRules, todoItems, tourRoutes } from '$lib/db/schema';
import { eq, sql, and } from 'drizzle-orm';

async function checkRulesAndCreateTodos(
	routeId: string,
	available: number,
	total: number,
	operatorId: string,
	operatorName: string
) {
	const rules = await db
		.select()
		.from(reminderRules)
		.where(eq(reminderRules.enabled, true));

	const [route] = await db
		.select({ name: tourRoutes.name })
		.from(tourRoutes)
		.where(eq(tourRoutes.id, routeId));

	for (const rule of rules) {
		const cond = rule.condition as Record<string, unknown>;
		let shouldCreate = false;

		if ('availableLessThan' in cond && typeof cond.availableLessThan === 'number') {
			if (available < cond.availableLessThan) {
				shouldCreate = true;
			}
		}

		if ('availableEquals' in cond && typeof cond.availableEquals === 'number') {
			if (available === cond.availableEquals) {
				shouldCreate = true;
			}
		}

		if (shouldCreate) {
			const action = rule.action as Record<string, unknown>;
			const urgency = (action.urgency as string) || 'high';

			await db.insert(todoItems).values({
				source: 'escalation',
				sourceRuleId: rule.id,
				itineraryId: null,
				routeId: routeId,
				urgency: urgency as 'high' | 'medium' | 'low',
				description: `路线「${route?.name || routeId}」库存不足：当前可用 ${available} 个名额（总量 ${total}），触发规则「${rule.name}」`,
				status: 'pending',
				result: null,
				evidence: `库存快照: 可用=${available}, 已售=${total - available}, 总量=${total}。触发规则: ${rule.name}`,
				operatorId: operatorId,
				operatorName: operatorName
			});
		}
	}
}

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

		await checkRulesAndCreateTodos(
			current.routeId,
			newAvailable,
			newTotal,
			operatorId,
			operatorName
		);

		return json({ inventory: updatedInventory, log });
	} catch (error) {
		return json({ error: 'Failed to adjust inventory' }, { status: 500 });
	}
};
