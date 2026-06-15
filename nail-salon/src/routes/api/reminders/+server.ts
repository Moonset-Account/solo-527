import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db/index';
import { reminders, reminderRules, treatmentCards, customers, cashierRecords } from '$lib/db/schema';
import { eq, desc, and, sql, max } from 'drizzle-orm';
import { addHistory } from '$lib/db/history';

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
  const body = await request.json().catch(() => ({}));
  const operatorName = body.operatorName ?? '系统';

  const activeRules = await db
    .select()
    .from(reminderRules)
    .where(eq(reminderRules.isActive, true));

  const expireRules = activeRules
    .filter((r) => r.type === 'treatment_expire')
    .sort((a, b) => a.conditionDays - b.conditionDays);

  const noVisitRules = activeRules
    .filter((r) => r.type === 'no_visit')
    .sort((a, b) => a.conditionDays - b.conditionDays);

  const activeCards = await db
    .select({
      card: treatmentCards,
      customer: { id: customers.id, name: customers.name, phone: customers.phone }
    })
    .from(treatmentCards)
    .leftJoin(customers, eq(treatmentCards.customerId, customers.id))
    .where(eq(treatmentCards.status, 'active'));

  const generated: unknown[] = [];
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  for (const { card, customer } of activeCards) {
    const remaining = card.totalSessions - card.usedSessions;

    if (expireRules.length > 0 && remaining > 0) {
      const expireDate = new Date(card.expireDate);
      const daysUntilExpire = Math.ceil(
        (expireDate.getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24)
      );

      let matchedRule: typeof expireRules[number] | null = null;
      for (const rule of expireRules) {
        if (daysUntilExpire <= rule.conditionDays) {
          matchedRule = rule;
          break;
        }
      }

      if (matchedRule) {
        const existing = await db
          .select()
          .from(reminders)
          .where(
            and(
              eq(reminders.customerId, card.customerId),
              eq(reminders.ruleId, matchedRule.id),
              eq(reminders.treatmentCardId, card.id),
              eq(reminders.status, 'pending')
            )
          );

        if (existing.length === 0) {
          const message = matchedRule.messageTemplate
            ? matchedRule.messageTemplate
                .replace('{serviceName}', card.serviceName)
                .replace('{expireDate}', card.expireDate)
                .replace('{remaining}', String(remaining))
                .replace('{name}', customer?.name ?? '')
            : `您的${card.serviceName}疗程将于${card.expireDate}到期，还剩${remaining}次未使用。`;

          const [result] = await db
            .insert(reminders)
            .values({
              customerId: card.customerId,
              ruleId: matchedRule.id,
              treatmentCardId: card.id,
              urgencyLevel: matchedRule.urgencyLevel,
              message,
              status: 'pending',
              dueDate: card.expireDate
            })
            .returning();

          generated.push(result);

          await addHistory({
            operatorName,
            action: '生成',
            targetType: 'reminder',
            targetId: result.id,
            detail: `自动生成${matchedRule.urgencyLevel === 'urgent' ? '紧急' : matchedRule.urgencyLevel === 'warning' ? '警告' : '提示'}提醒：${customer?.name ?? '客户'} - ${card.serviceName} ${daysUntilExpire <= 0 ? '已过期' : `还有${daysUntilExpire}天过期`}`,
            metadata: {
              urgencyLevel: matchedRule.urgencyLevel,
              rule: matchedRule.name,
              daysUntilExpire,
              remaining,
              serviceName: card.serviceName
            }
          });
        }
      }
    }

    if (noVisitRules.length > 0) {
      const lastCashier = await db
        .select({ createdAt: max(cashierRecords.createdAt) })
        .from(cashierRecords)
        .where(eq(cashierRecords.customerId, card.customerId));

      const lastVisitDate = lastCashier[0]?.createdAt ?? card.updatedAt;
      const daysSinceLastVisit = Math.floor(
        (now.getTime() - new Date(lastVisitDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      let matchedRule: typeof noVisitRules[number] | null = null;
      for (const rule of noVisitRules) {
        if (daysSinceLastVisit >= rule.conditionDays) {
          matchedRule = rule;
        }
      }

      if (matchedRule) {
        const existing = await db
          .select()
          .from(reminders)
          .where(
            and(
              eq(reminders.customerId, card.customerId),
              eq(reminders.ruleId, matchedRule.id),
              eq(reminders.treatmentCardId, card.id),
              eq(reminders.status, 'pending')
            )
          );

        if (existing.length === 0) {
          const message = matchedRule.messageTemplate
            ? matchedRule.messageTemplate
                .replace('{name}', customer?.name ?? '')
                .replace('{days}', String(daysSinceLastVisit))
            : `亲爱的${customer?.name ?? ''}，很久没见到您了，期待您的再次光临！`;

          const dueDate = new Date(lastVisitDate);
          dueDate.setDate(dueDate.getDate() + matchedRule.conditionDays);

          const [result] = await db
            .insert(reminders)
            .values({
              customerId: card.customerId,
              ruleId: matchedRule.id,
              treatmentCardId: card.id,
              urgencyLevel: matchedRule.urgencyLevel,
              message,
              status: 'pending',
              dueDate: dueDate.toISOString().split('T')[0]
            })
            .returning();

          generated.push(result);

          await addHistory({
            operatorName,
            action: '生成',
            targetType: 'reminder',
            targetId: result.id,
            detail: `自动生成${matchedRule.urgencyLevel === 'urgent' ? '紧急' : matchedRule.urgencyLevel === 'warning' ? '警告' : '提示'}提醒：${customer?.name ?? '客户'} 久未到店${daysSinceLastVisit}天`,
            metadata: {
              urgencyLevel: matchedRule.urgencyLevel,
              rule: matchedRule.name,
              daysSinceLastVisit
            }
          });
        }
      }
    }
  }

  return json({ generated, count: generated.length }, { status: 201 });
};

export const PUT: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const { id, status, handlerRemark, operatorName = '店长' } = body;

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

  const statusText: Record<string, string> = {
    sent: '已发送',
    dismissed: '已忽略',
    completed: '已完成'
  };

  await addHistory({
    operatorName,
    action: '更新',
    targetType: 'reminder',
    targetId: result.id,
    detail: `提醒处理：${statusText[status] ?? status}${handlerRemark ? ` - ${handlerRemark}` : ''}`,
    metadata: {
      status,
      handlerRemark,
      urgencyLevel: result.urgencyLevel
    }
  });

  return json(result);
};
