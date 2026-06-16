import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, and, desc, gte, lte, asc, or, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { todos, users, members, trainingCamps } from '../db/schema.js';
import { paginate, parsePagination } from '../lib/utils.js';

const todosRouter = new Hono();

const createTodoSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['fall_behind_warning', 'checkin_review', 'refund_review', 'custom']).default('custom'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).default('pending'),
  assigneeId: z.string().uuid().optional(),
  memberId: z.string().uuid().optional(),
  campId: z.string().uuid().optional(),
  dueDate: z.string().optional().transform((s) => (s ? new Date(s) : undefined)),
  createdBy: z.string().uuid().optional(),
});

const updateTodoSchema = createTodoSchema.partial();

const completeTodoSchema = z.object({
  completedBy: z.string().uuid().optional(),
  completeComment: z.string().optional(),
});

todosRouter.get('/', async (c) => {
  const { page, pageSize } = parsePagination(c.req.query());
  const query = c.req.query();

  let where: any = undefined;
  const conditions: any[] = [];

  if (query.status) {
    conditions.push(eq(todos.status, query.status as any));
  }
  if (query.priority) {
    conditions.push(eq(todos.priority, query.priority as any));
  }
  if (query.type) {
    conditions.push(eq(todos.type, query.type as any));
  }
  if (query.assigneeId) {
    conditions.push(eq(todos.assigneeId, query.assigneeId));
  }
  if (query.memberId) {
    conditions.push(eq(todos.memberId, query.memberId));
  }
  if (query.campId) {
    conditions.push(eq(todos.campId, query.campId));
  }
  if (query.dueBefore) {
    conditions.push(lte(todos.dueDate, new Date(query.dueBefore)));
  }
  if (query.createdStart) {
    conditions.push(gte(todos.createdAt, new Date(query.createdStart)));
  }
  if (query.createdEnd) {
    conditions.push(lte(todos.createdAt, new Date(query.createdEnd)));
  }
  if (query.showMy === 'true' && query.assigneeId) {
    const myConditions = conditions.length > 0 ? [...conditions] : [];
    where = and(...myConditions, or(eq(todos.assigneeId, query.assigneeId), eq(todos.createdBy, query.assigneeId)));
  } else if (conditions.length > 0) {
    where = and(...conditions);
  }

  const allTodos = await db
    .select({
      id: todos.id,
      title: todos.title,
      description: todos.description,
      type: todos.type,
      priority: todos.priority,
      status: todos.status,
      assigneeId: todos.assigneeId,
      memberId: todos.memberId,
      campId: todos.campId,
      dueDate: todos.dueDate,
      completedAt: todos.completedAt,
      completedBy: todos.completedBy,
      createdBy: todos.createdBy,
      createdAt: todos.createdAt,
      updatedAt: todos.updatedAt,
      assigneeName: sql`case when todos.assignee_id is not null then (select name from users where id = todos.assignee_id) else null end`,
      creatorName: sql`case when todos.created_by is not null then (select name from users where id = todos.created_by) else null end`,
      completerName: sql`case when todos.completed_by is not null then (select name from users where id = todos.completed_by) else null end`,
      memberNo: members.memberNo,
      memberName: users.name,
      campName: trainingCamps.name,
    })
    .from(todos)
    .leftJoin(members, eq(members.id, todos.memberId))
    .leftJoin(users, eq(users.id, members.userId))
    .leftJoin(trainingCamps, eq(trainingCamps.id, todos.campId))
    .where(where)
    .orderBy(asc(todos.dueDate), desc(todos.priority), desc(todos.createdAt));

  return c.json(paginate(allTodos, page, pageSize));
});

todosRouter.get('/overdue', async (c) => {
  const query = c.req.query();
  const now = new Date();

  let where: any = and(
    or(eq(todos.status, 'pending'), eq(todos.status, 'in_progress')),
    lte(todos.dueDate, now),
  );
  if (query.assigneeId) {
    where = and(where, eq(todos.assigneeId, query.assigneeId));
  }

  const overdue = await db
    .select({
      id: todos.id,
      title: todos.title,
      priority: todos.priority,
      status: todos.status,
      dueDate: todos.dueDate,
      assigneeName: sql`case when todos.assignee_id is not null then (select name from users where id = todos.assignee_id) else null end`,
      campName: trainingCamps.name,
      memberNo: members.memberNo,
      memberName: users.name,
    })
    .from(todos)
    .leftJoin(trainingCamps, eq(trainingCamps.id, todos.campId))
    .leftJoin(members, eq(members.id, todos.memberId))
    .leftJoin(users, eq(users.id, members.userId))
    .where(where)
    .orderBy(asc(todos.dueDate));

  return c.json(overdue);
});

todosRouter.get('/stats', async (c) => {
  const query = c.req.query();

  let baseWhere: any = undefined;
  const baseConditions: any[] = [];
  if (query.assigneeId) {
    baseConditions.push(eq(todos.assigneeId, query.assigneeId));
  }
  if (query.campId) {
    baseConditions.push(eq(todos.campId, query.campId));
  }
  if (baseConditions.length > 0) {
    baseWhere = and(...baseConditions);
  }

  const total = await db
    .select({ count: sql<number>`count(*)` })
    .from(todos)
    .where(baseWhere);
  const pending = await db
    .select({ count: sql<number>`count(*)` })
    .from(todos)
    .where(baseWhere ? and(baseWhere, eq(todos.status, 'pending')) : eq(todos.status, 'pending'));
  const inProgress = await db
    .select({ count: sql<number>`count(*)` })
    .from(todos)
    .where(baseWhere ? and(baseWhere, eq(todos.status, 'in_progress')) : eq(todos.status, 'in_progress'));
  const completed = await db
    .select({ count: sql<number>`count(*)` })
    .from(todos)
    .where(baseWhere ? and(baseWhere, eq(todos.status, 'completed')) : eq(todos.status, 'completed'));

  const now = new Date();
  const overdue = await db
    .select({ count: sql<number>`count(*)` })
    .from(todos)
    .where(
      baseWhere
        ? and(baseWhere, or(eq(todos.status, 'pending'), eq(todos.status, 'in_progress')), lte(todos.dueDate, now))
        : and(or(eq(todos.status, 'pending'), eq(todos.status, 'in_progress')), lte(todos.dueDate, now)),
    );

  const fallBehind = await db
    .select({ count: sql<number>`count(*)` })
    .from(todos)
    .where(baseWhere ? and(baseWhere, eq(todos.type, 'fall_behind_warning')) : eq(todos.type, 'fall_behind_warning'));
  const checkinReview = await db
    .select({ count: sql<number>`count(*)` })
    .from(todos)
    .where(baseWhere ? and(baseWhere, eq(todos.type, 'checkin_review')) : eq(todos.type, 'checkin_review'));
  const refundReview = await db
    .select({ count: sql<number>`count(*)` })
    .from(todos)
    .where(baseWhere ? and(baseWhere, eq(todos.type, 'refund_review')) : eq(todos.type, 'refund_review'));

  return c.json({
    total: Number(total[0].count),
    pending: Number(pending[0].count),
    inProgress: Number(inProgress[0].count),
    completed: Number(completed[0].count),
    overdue: Number(overdue[0].count),
    byType: {
      fallBehindWarning: Number(fallBehind[0].count),
      checkinReview: Number(checkinReview[0].count),
      refundReview: Number(refundReview[0].count),
    },
  });
});

todosRouter.get('/:id', async (c) => {
  const id = c.req.param('id');
  const todo = await db
    .select({
      id: todos.id,
      title: todos.title,
      description: todos.description,
      type: todos.type,
      priority: todos.priority,
      status: todos.status,
      assigneeId: todos.assigneeId,
      memberId: todos.memberId,
      campId: todos.campId,
      dueDate: todos.dueDate,
      completedAt: todos.completedAt,
      completedBy: todos.completedBy,
      createdBy: todos.createdBy,
      createdAt: todos.createdAt,
      updatedAt: todos.updatedAt,
      assigneeName: sql`case when todos.assignee_id is not null then (select name from users where id = todos.assignee_id) else null end`,
      creatorName: sql`case when todos.created_by is not null then (select name from users where id = todos.created_by) else null end`,
      completerName: sql`case when todos.completed_by is not null then (select name from users where id = todos.completed_by) else null end`,
      memberNo: members.memberNo,
      memberName: users.name,
      memberPhone: users.phone,
      campName: trainingCamps.name,
    })
    .from(todos)
    .leftJoin(members, eq(members.id, todos.memberId))
    .leftJoin(users, eq(users.id, members.userId))
    .leftJoin(trainingCamps, eq(trainingCamps.id, todos.campId))
    .where(eq(todos.id, id));

  if (todo.length === 0) {
    return c.json({ message: '待办不存在' }, 404);
  }
  return c.json(todo[0]);
});

todosRouter.post('/', zValidator('json', createTodoSchema), async (c) => {
  const data = c.req.valid('json');
  const result = await db.insert(todos).values(data).returning();
  return c.json(result[0], 201);
});

todosRouter.put('/:id', zValidator('json', updateTodoSchema), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');
  const result = await db
    .update(todos)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(todos.id, id))
    .returning();
  if (result.length === 0) {
    return c.json({ message: '待办不存在' }, 404);
  }
  return c.json(result[0]);
});

todosRouter.patch('/:id/complete', zValidator('json', completeTodoSchema), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');
  const result = await db
    .update(todos)
    .set({
      status: 'completed',
      completedAt: new Date(),
      completedBy: data.completedBy,
      updatedAt: new Date(),
    })
    .where(eq(todos.id, id))
    .returning();
  if (result.length === 0) {
    return c.json({ message: '待办不存在' }, 404);
  }
  return c.json(result[0]);
});

todosRouter.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const result = await db.delete(todos).where(eq(todos.id, id)).returning();
  if (result.length === 0) {
    return c.json({ message: '待办不存在' }, 404);
  }
  return c.json({ deleted: true, item: result[0] });
});

export { todosRouter };
