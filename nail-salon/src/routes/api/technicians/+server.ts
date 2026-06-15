import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db/index';
import { technicians } from '$lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url }) => {
  const activeOnly = url.searchParams.get('active') === 'true';

  const whereClause = activeOnly ? eq(technicians.isActive, true) : undefined;

  const data = await db
    .select()
    .from(technicians)
    .where(whereClause)
    .orderBy(desc(technicians.createdAt));

  return json(data);
};

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const [result] = await db
    .insert(technicians)
    .values({
      name: body.name,
      avatar: body.avatar,
      specialty: body.specialty,
      level: body.level,
      bio: body.bio
    })
    .returning();
  return json(result, { status: 201 });
};
