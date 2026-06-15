import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db/index';
import { treatmentCards, customers } from '$lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { addHistory } from '$lib/db/history';

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

  const customer = await db.select().from(customers).where(eq(customers.id, body.customerId));
  const operatorName = body.operatorName ?? '前台';

  await addHistory({
    operatorName,
    action: '创建',
    targetType: 'treatment_card',
    targetId: result.id,
    detail: `为${customer[0]?.name ?? '客户'}创建${body.serviceName}${body.totalSessions}次卡，价格¥${body.price}`,
    metadata: {
      customer: customer[0]?.name,
      serviceName: body.serviceName,
      totalSessions: body.totalSessions,
      price: String(body.price),
      expireDate: body.expireDate
    }
  });

  return json(result, { status: 201 });
};

export const PUT: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const { id, usedSessions, status, operatorName = '前台' } = body;

  const [oldCard] = await db.select().from(treatmentCards).where(eq(treatmentCards.id, id));

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (usedSessions !== undefined) updateData.usedSessions = usedSessions;
  if (status !== undefined) updateData.status = status;

  const [result] = await db
    .update(treatmentCards)
    .set(updateData)
    .where(eq(treatmentCards.id, id))
    .returning();

  const customer = await db.select().from(customers).where(eq(customers.id, result.customerId));

  if (usedSessions !== undefined && oldCard && usedSessions > oldCard.usedSessions) {
    const usedCount = usedSessions - oldCard.usedSessions;
    const remaining = result.totalSessions - usedSessions;

    await addHistory({
      operatorName,
      action: '核销',
      targetType: 'treatment_card',
      targetId: id,
      detail: `${customer[0]?.name ?? '客户'}使用${result.serviceName}疗程卡核销${usedCount}次，剩余${remaining}次`,
      metadata: {
        customer: customer[0]?.name,
        serviceName: result.serviceName,
        usedCount,
        remaining,
        totalSessions: result.totalSessions,
        usedSessions: result.usedSessions
      }
    });
  }

  if (status !== undefined && oldCard?.status !== status) {
    const statusText: Record<string, string> = {
      active: '激活',
      completed: '完成',
      expired: '已过期',
      cancelled: '已取消'
    };

    await addHistory({
      operatorName,
      action: '更新',
      targetType: 'treatment_card',
      targetId: id,
      detail: `${customer[0]?.name ?? '客户'}的${result.serviceName}疗程卡状态更新为：${statusText[status] ?? status}`,
      metadata: {
        customer: customer[0]?.name,
        serviceName: result.serviceName,
        oldStatus: oldCard?.status,
        newStatus: status
      }
    });
  }

  return json(result);
};
