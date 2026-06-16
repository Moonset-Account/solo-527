import { db } from '$lib/server/db';
import { sourceRecords, sourceRecordReferences } from '$lib/server/schema';
import { eq, inArray } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const records = await db
			.select()
			.from(sourceRecords)
			.where(eq(sourceRecords.topicId, params.topicId));

		if (records.length === 0) {
			return json({ data: [] });
		}

		const recordIds = records.map((r) => r.id);

		const references = await db
			.select()
			.from(sourceRecordReferences)
			.where(inArray(sourceRecordReferences.sourceRecordId, recordIds));

		const refMap = new Map<string, typeof references>();
		for (const ref of references) {
			const list = refMap.get(ref.sourceRecordId) ?? [];
			list.push(ref);
			refMap.set(ref.sourceRecordId, list);
		}

		const data = records.map((record) => ({
			...record,
			references: refMap.get(record.id) ?? []
		}));

		return json({ data });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return json({ error: message }, { status: 500 });
	}
};
