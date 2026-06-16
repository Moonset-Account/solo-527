import { db } from '$lib/server/db';
import { deliverables } from '$lib/server/schema';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const { fileUrl, fileType, note } = await request.json();
		const taskId = params.id;

		const [deliverable] = await db
			.insert(deliverables)
			.values({ taskId, fileUrl, fileType, note: note ?? '' })
			.returning();

		return json(deliverable, { status: 201 });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return json({ error: message }, { status: 500 });
	}
};
