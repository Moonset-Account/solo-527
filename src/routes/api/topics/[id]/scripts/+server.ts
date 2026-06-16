import { db } from '$lib/server/db';
import { scripts } from '$lib/server/schema';
import { eq, desc } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const data = await db
			.select()
			.from(scripts)
			.where(eq(scripts.topicId, params.id))
			.orderBy(desc(scripts.version));

		return json({ data });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return json({ error: message }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const { content, createdBy } = await request.json();
		const topicId = params.id;

		const latestScripts = await db
			.select({ version: scripts.version })
			.from(scripts)
			.where(eq(scripts.topicId, topicId))
			.orderBy(desc(scripts.version))
			.limit(1);

		const nextVersion = latestScripts.length > 0 ? latestScripts[0].version + 1 : 1;

		const [script] = await db
			.insert(scripts)
			.values({ topicId, content, version: nextVersion, createdBy })
			.returning();

		return json(script, { status: 201 });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return json({ error: message }, { status: 500 });
	}
};
