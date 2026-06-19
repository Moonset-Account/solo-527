import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { driverVehicleAssignments } from '$lib/db/schema';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { itineraryId, driverName, vehiclePlate, assignedBy, assignedByName, changeReason } = body;

		const [assignment] = await db
			.insert(driverVehicleAssignments)
			.values({
				itineraryId,
				driverName,
				vehiclePlate,
				assignedBy,
				assignedByName,
				changeReason
			})
			.returning();

		return json({ assignment });
	} catch (error) {
		return json({ error: 'Failed to create assignment' }, { status: 500 });
	}
};
