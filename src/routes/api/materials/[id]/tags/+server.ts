import { db } from '$lib/server/db';
import { materialTags, tags } from '$lib/server/schema';
import { eq, and } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const { tagId } = await request.json();
		const materialId = params.id;

		const [existing] = await db
			.select()
			.from(materialTags)
			.where(and(eq(materialTags.materialId, materialId), eq(materialTags.tagId, tagId)));

		if (existing) {
			return json({ error: 'Tag already exists on this material' }, { status: 409 });
		}

		await db.insert(materialTags).values({ materialId, tagId });
		const [tag] = await db.select().from(tags).where(eq(tags.id, tagId));

		return json(tag, { status: 201 });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return json({ error: message }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params, request }) => {
	try {
		const { tagId } = await request.json();
		const materialId = params.id;

		await db
			.delete(materialTags)
			.where(and(eq(materialTags.materialId, materialId), eq(materialTags.tagId, tagId)));

		return json({ success: true });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return json({ error: message }, { status: 500 });
	}
};
