import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db/index';
import { treatmentCards, customers } from '$lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url }) => {
  const status = url.searchParams.get('status');
  const customerId = url.searchParams.get('customerId');

  const conditions = [];
  if (status) conditions.push(eq(treatmentCards.status, status));
  if (customerId) conditions.push(eq(treatmentCards.customerId, customerId));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const data = await db
    .select({
      card: treatmentCards,
      customer: { id: customers.id, name: customers.name, phone: customers.phone }
    })
    .from(treatmentCards)
    .leftJoin(customers, eq(treatmentCards.customerId, customers.id))
    .where(whereClause)
    .orderBy(desc(treatmentCards.createdAt));

  return json(data);
};

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const [result] = await db
    .insert(treatmentCards)
    .values({
      customerId: body.customerId,
      serviceName: body.serviceName,
      totalSessions: body.totalSessions,
      usedSessions: body.usedSessions ?? 0,
      price: body.price,
      startDate: body.startDate,
      expireDate: body.expireDate,
      status: body.status ?? 'active'
    })
    .returning();
  return json(result, { status: 201 });
};

export const PUT: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const { id, usedSessions, status } = body;

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (usedSessions !== undefined) updateData.usedSessions = usedSessions;
  if (status !== undefined) updateData.status = status;

  const [result] = await db
    .update(treatmentCards)
    .set(updateData)
    .where(eq(treatmentCards.id, id))
    .returning();

  return json(result);
};
