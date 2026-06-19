import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { driverVehicleAssignments } from '$lib/db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const assignments = await db
			.select()
			.from(driverVehicleAssignments)
			.where(eq(driverVehicleAssignments.itineraryId, params.itineraryId));

		return json({ assignments });
	} catch (error) {
		return json({ error: 'Failed to fetch driver vehicle assignments' }, { status: 500 });
	}
};
