import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db/index';
import { customers } from '$lib/db/schema';
import { eq, desc, or, ilike } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url }) => {
  const search = url.searchParams.get('search');

  const whereClause = search
    ? or(
        ilike(customers.name, `%${search}%`),
        ilike(customers.phone, `%${search}%`)
      )
    : undefined;

  const data = await db
    .select()
    .from(customers)
    .where(whereClause)
    .orderBy(desc(customers.createdAt));

  return json(data);
};

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const [result] = await db
    .insert(customers)
    .values({
      name: body.name,
      phone: body.phone,
      gender: body.gender,
      birthday: body.birthday,
      source: body.source,
      remark: body.remark
    })
    .returning();
  return json(result, { status: 201 });
};
