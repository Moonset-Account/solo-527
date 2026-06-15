import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db/index';
import { comments, works, customers } from '$lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url }) => {
  const status = url.searchParams.get('status');
  const workId = url.searchParams.get('workId');

  const conditions = [];
  if (status) conditions.push(eq(comments.status, status));
  if (workId) conditions.push(eq(comments.workId, workId));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const data = await db
    .select({
      comment: comments,
      work: { id: works.id, title: works.title },
      customer: { id: customers.id, name: customers.name }
    })
    .from(comments)
    .leftJoin(works, eq(comments.workId, works.id))
    .leftJoin(customers, eq(comments.customerId, customers.id))
    .where(whereClause)
    .orderBy(desc(comments.createdAt));

  return json(data);
};

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const [result] = await db
    .insert(comments)
    .values({
      workId: body.workId,
      customerId: body.customerId,
      authorName: body.authorName,
      content: body.content,
      rating: body.rating,
      status: 'pending'
    })
    .returning();
  return json(result, { status: 201 });
};

export const PUT: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const { id, status } = body;

  if (!['approved', 'rejected'].includes(status)) {
    return json({ error: 'Status must be approved or rejected' }, { status: 400 });
  }

  const [result] = await db
    .update(comments)
    .set({
      status,
      reviewedAt: new Date()
    })
    .where(eq(comments.id, id))
    .returning();

  return json(result);
};
