import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db/index';
import { comments, works, customers } from '$lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { addHistory } from '$lib/db/history';

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
  const { id, status, operatorName = '店长' } = body;

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

  const [fullComment] = await db
    .select({
      comment: comments,
      work: { title: works.title },
      customer: { name: customers.name }
    })
    .from(comments)
    .leftJoin(works, eq(comments.workId, works.id))
    .leftJoin(customers, eq(comments.customerId, customers.id))
    .where(eq(comments.id, id));

  const statusText = status === 'approved' ? '审核通过' : '审核拒绝';
  const author = fullComment?.customer?.name ?? fullComment?.comment?.authorName ?? '游客';

  await addHistory({
    operatorName,
    action: status === 'approved' ? '审核通过' : '审核拒绝',
    targetType: 'comment',
    targetId: id,
    detail: `${statusText}：${author}对《${fullComment?.work?.title ?? ''}》的评论，评分${fullComment?.comment?.rating ?? '无'}`,
    metadata: {
      status,
      author,
      workTitle: fullComment?.work?.title,
      rating: fullComment?.comment?.rating,
      content: fullComment?.comment?.content?.substring(0, 100)
    }
  });

  return json(result);
};
