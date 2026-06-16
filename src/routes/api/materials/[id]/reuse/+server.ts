import { db } from '$lib/server/db';
import { materialReuse, users } from '$lib/server/schema';
import { eq, desc } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const records = await db
			.select({
				reuse: materialReuse,
				user: { id: users.id, name: users.name, email: users.email }
			})
			.from(materialReuse)
			.innerJoin(users, eq(materialReuse.usedBy, users.id))
			.where(eq(materialReuse.materialId, params.id))
			.orderBy(desc(materialReuse.usedAt));

		const data = records.map((r) => ({
			...r.reuse,
			usedByUser: r.user
		}));

		return json({ data });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return json({ error: message }, { status: 500 });
	}
};
