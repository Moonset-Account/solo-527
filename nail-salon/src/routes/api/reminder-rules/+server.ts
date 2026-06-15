import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db/index';
import { reminderRules } from '$lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url }) => {
  const activeOnly = url.searchParams.get('active') === 'true';

  const data = activeOnly
    ? await db
        .select()
        .from(reminderRules)
        .where(eq(reminderRules.isActive, true))
        .orderBy(desc(reminderRules.createdAt))
    : await db.select().from(reminderRules).orderBy(desc(reminderRules.createdAt));

  return json(data);
};

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const [result] = await db
    .insert(reminderRules)
    .values({
      name: body.name,
      type: body.type,
      conditionDays: body.conditionDays,
      urgencyLevel: body.urgencyLevel,
      messageTemplate: body.messageTemplate
    })
    .returning();
  return json(result, { status: 201 });
};

export const PUT: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const { id, name, type, conditionDays, urgencyLevel, messageTemplate, isActive } = body;

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (type !== undefined) updateData.type = type;
  if (conditionDays !== undefined) updateData.conditionDays = conditionDays;
  if (urgencyLevel !== undefined) updateData.urgencyLevel = urgencyLevel;
  if (messageTemplate !== undefined) updateData.messageTemplate = messageTemplate;
  if (isActive !== undefined) updateData.isActive = isActive;

  const [result] = await db
    .update(reminderRules)
    .set(updateData)
    .where(eq(reminderRules.id, id))
    .returning();

  return json(result);
};
