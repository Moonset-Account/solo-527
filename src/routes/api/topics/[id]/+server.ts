import { db } from '$lib/server/db';
import { topics, topicMaterials, materials, scripts, materialTags, tags } from '$lib/server/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const [topic] = await db.select().from(topics).where(eq(topics.id, params.id));
		if (!topic) {
			return json({ error: 'Topic not found' }, { status: 404 });
		}

		const materialRows = await db
			.select({ material: materials })
			.from(topicMaterials)
			.innerJoin(materials, eq(topicMaterials.materialId, materials.id))
			.where(eq(topicMaterials.topicId, params.id));

		const scriptRows = await db
			.select()
			.from(scripts)
			.where(eq(scripts.topicId, params.id))
			.orderBy(desc(scripts.version));

		const materialsWithTags = materialRows.map((r) => r.material);
		if (materialsWithTags.length > 0) {
			const materialIds = materialsWithTags.map((m) => m.id);
			const tagJoinRows = await db
				.select({ materialId: materialTags.materialId, tag: tags })
				.from(materialTags)
				.innerJoin(tags, eq(materialTags.tagId, tags.id))
				.where(inArray(materialTags.materialId, materialIds));

			const tagMap = new Map<string, typeof tagJoinRows>();
			for (const row of tagJoinRows) {
				const list = tagMap.get(row.materialId) ?? [];
				list.push(row);
				tagMap.set(row.materialId, list);
			}

			for (const m of materialsWithTags as any[]) {
				m.tags = (tagMap.get(m.id) ?? []).map((r: any) => r.tag);
			}
		}

		return json({ ...topic, materials: materialsWithTags, scripts: scriptRows });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return json({ error: message }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const body = await request.json();
		const [updated] = await db
			.update(topics)
			.set({ ...body, updatedAt: new Date() })
			.where(eq(topics.id, params.id))
			.returning();

		if (!updated) {
			return json({ error: 'Topic not found' }, { status: 404 });
		}

		return json(updated);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return json({ error: message }, { status: 500 });
	}
};
