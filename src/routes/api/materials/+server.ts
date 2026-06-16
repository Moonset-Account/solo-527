import { db } from '$lib/server/db';
import { materials, materialTags, tags } from '$lib/server/schema';
import { eq, and, like, desc, count, inArray } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const type = url.searchParams.get('type');
		const tag = url.searchParams.get('tag');
		const keyword = url.searchParams.get('keyword');
		const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
		const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize')) || 100));
		const offset = (page - 1) * pageSize;

		const conditions = [];
		if (type) conditions.push(eq(materials.type, type as 'image' | 'video' | 'document' | 'audio'));
		if (keyword) conditions.push(like(materials.title, `%${keyword}%`));

		let query = db.select().from(materials);
		if (conditions.length > 0) {
			query = query.where(and(...conditions)) as typeof query;
		}

		const [totalResult] = await db
			.select({ count: count() })
			.from(materials)
			.where(conditions.length > 0 ? and(...conditions) : undefined);

		const data = await query.orderBy(desc(materials.createdAt)).limit(pageSize).offset(offset);

		let filteredIds = data.map((m) => m.id);

		if (tag) {
			const tagRows = await db.select().from(tags).where(eq(tags.name, tag));
			if (tagRows.length > 0) {
				const taggedMaterialIds = await db
					.select({ materialId: materialTags.materialId })
					.from(materialTags)
					.where(eq(materialTags.tagId, tagRows[0].id));
				const idSet = new Set(taggedMaterialIds.map((r) => r.materialId));
				filteredIds = filteredIds.filter((id) => idSet.has(id));
			}
		}

		const finalData = data.filter((m) => filteredIds.includes(m.id));

		const allTagLinks = filteredIds.length
			? await db
					.select({ materialId: materialTags.materialId, tag: tags })
					.from(materialTags)
					.innerJoin(tags, eq(materialTags.tagId, tags.id))
					.where(inArray(materialTags.materialId, filteredIds))
			: [];

		const tagsByMaterial: Record<string, typeof tags.$inferSelect[]> = {};
		for (const link of allTagLinks) {
			if (!tagsByMaterial[link.materialId]) tagsByMaterial[link.materialId] = [];
			tagsByMaterial[link.materialId].push(link.tag);
		}

		const enriched = finalData.map((m) => ({
			...m,
			tags: tagsByMaterial[m.id] ?? [],
			reuseCount: 0
		}));

		return json({ data: enriched, total: totalResult.count, page, pageSize });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return json({ error: message }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { title, type, fileUrl, fileSize, uploadedBy } = body;

		const [material] = await db
			.insert(materials)
			.values({ title, type, fileUrl, fileSize: fileSize ?? 0, uploadedBy })
			.returning();

		return json(material, { status: 201 });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return json({ error: message }, { status: 500 });
	}
};
