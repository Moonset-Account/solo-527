import { db } from '$lib/server/db';
import { topicMaterials } from '$lib/server/schema';
import { eq, and } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const { materialId } = await request.json();
		const topicId = params.id;

		const [existing] = await db
			.select()
			.from(topicMaterials)
			.where(and(eq(topicMaterials.topicId, topicId), eq(topicMaterials.materialId, materialId)));

		if (existing) {
			return json({ error: 'Material already associated with this topic' }, { status: 409 });
		}

		await db.insert(topicMaterials).values({ topicId, materialId });

		return json({ success: true }, { status: 201 });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return json({ error: message }, { status: 500 });
	}
};
