import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db/index';
import { services } from '$lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url }) => {
  const category = url.searchParams.get('category');
  const activeOnly = url.searchParams.get('active') === 'true';

  const conditions = [];
  if (category) conditions.push(eq(services.category, category));
  if (activeOnly) conditions.push(eq(services.isActive, true));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const data = await db
    .select()
    .from(services)
    .where(whereClause)
    .orderBy(desc(services.createdAt));

  return json(data);
};

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const [result] = await db
    .insert(services)
    .values({
      name: body.name,
      category: body.category,
      duration: body.duration,
      price: body.price,
      description: body.description,
      image: body.image
    })
    .returning();
  return json(result, { status: 201 });
};
