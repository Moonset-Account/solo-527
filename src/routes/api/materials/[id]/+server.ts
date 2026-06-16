import { db } from '$lib/server/db';
import { materials, materialTags, tags } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const [material] = await db.select().from(materials).where(eq(materials.id, params.id));
		if (!material) {
			return json({ error: 'Material not found' }, { status: 404 });
		}

		const tagRows = await db
			.select({ tag: tags })
			.from(materialTags)
			.innerJoin(tags, eq(materialTags.tagId, tags.id))
			.where(eq(materialTags.materialId, params.id));

		return json({ ...material, tags: tagRows.map((r) => r.tag) });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return json({ error: message }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const body = await request.json();
		const [updated] = await db
			.update(materials)
			.set(body)
			.where(eq(materials.id, params.id))
			.returning();

		if (!updated) {
			return json({ error: 'Material not found' }, { status: 404 });
		}

		return json(updated);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return json({ error: message }, { status: 500 });
	}
};
