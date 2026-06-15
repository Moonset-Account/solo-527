import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db/index';
import { reminders, reminderRules, treatmentCards, customers } from '$lib/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url }) => {
  const urgencyLevel = url.searchParams.get('urgencyLevel');
  const status = url.searchParams.get('status');

  const conditions = [];
  if (urgencyLevel) conditions.push(eq(reminders.urgencyLevel, urgencyLevel));
  if (status) conditions.push(eq(reminders.status, status));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const data = await db
    .select({
      reminder: reminders,
      customer: { id: customers.id, name: customers.name, phone: customers.phone },
      rule: { id: reminderRules.id, name: reminderRules.name, type: reminderRules.type },
      card: { id: treatmentCards.id, serviceName: treatmentCards.serviceName }
    })
    .from(reminders)
    .leftJoin(customers, eq(reminders.customerId, customers.id))
    .leftJoin(reminderRules, eq(reminders.ruleId, reminderRules.id))
    .leftJoin(treatmentCards, eq(reminders.treatmentCardId, treatmentCards.id))
    .where(whereClause)
    .orderBy(desc(reminders.createdAt));

  return json(data);
};

export const POST: RequestHandler = async ({ request }) => {
  const activeRules = await db
    .select()
    .from(reminderRules)
    .where(eq(reminderRules.isActive, true));

  const activeCards = await db
    .select()
    .from(treatmentCards)
    .where(eq(treatmentCards.status, 'active'));

  const generated: unknown[] = [];

  for (const card of activeCards) {
    for (const rule of activeRules) {
      const lastVisit = new Date(card.updatedAt);
      const now = new Date();
      const daysSinceLastVisit = Math.floor(
        (now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastVisit >= rule.conditionDays) {
        const existing = await db
          .select()
          .from(reminders)
          .where(
            and(
              eq(reminders.customerId, card.customerId),
              eq(reminders.ruleId, rule.id),
              eq(reminders.treatmentCardId, card.id),
              eq(reminders.status, 'pending')
            )
          );

        if (existing.length === 0) {
          const dueDate = new Date(lastVisit);
          dueDate.setDate(dueDate.getDate() + rule.conditionDays);

          const message = rule.messageTemplate
            ? rule.messageTemplate
                .replace('{customerName}', '')
                .replace('{serviceName}', card.serviceName)
                .replace('{days}', String(daysSinceLastVisit))
            : `You haven't visited in ${daysSinceLastVisit} days for ${card.serviceName}`;

          const [result] = await db
            .insert(reminders)
            .values({
              customerId: card.customerId,
              ruleId: rule.id,
              treatmentCardId: card.id,
              urgencyLevel: rule.urgencyLevel,
              message,
              status: 'pending',
              dueDate: dueDate.toISOString().split('T')[0]
            })
            .returning();

          generated.push(result);
        }
      }
    }
  }

  return json({ generated, count: generated.length }, { status: 201 });
};

export const PUT: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const { id, status, handlerRemark } = body;

  if (!['sent', 'dismissed', 'completed'].includes(status)) {
    return json({ error: 'Invalid status' }, { status: 400 });
  }

  const [result] = await db
    .update(reminders)
    .set({
      status,
      ...(handlerRemark !== undefined && { handlerRemark }),
      handledAt: new Date()
    })
    .where(eq(reminders.id, id))
    .returning();

  return json(result);
};
