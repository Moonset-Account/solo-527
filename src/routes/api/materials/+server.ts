import { db } from '$lib/server/db';
import { materials, materialTags, tags } from '$lib/server/schema';
import { eq, and, like, desc, count } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const type = url.searchParams.get('type');
		const tag = url.searchParams.get('tag');
		const keyword = url.searchParams.get('keyword');
		const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
		const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize')) || 20));
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

		if (tag) {
			const tagRows = await db.select().from(tags).where(eq(tags.name, tag));
			if (tagRows.length > 0) {
				const taggedMaterialIds = await db
					.select({ materialId: materialTags.materialId })
					.from(materialTags)
					.where(eq(materialTags.tagId, tagRows[0].id));
				const idSet = new Set(taggedMaterialIds.map((r) => r.materialId));
				const filtered = data.filter((m) => idSet.has(m.id));
				return json({ data: filtered, total: totalResult.count, page, pageSize });
			}
		}

		return json({ data, total: totalResult.count, page, pageSize });
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
