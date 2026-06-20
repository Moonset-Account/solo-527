import { db } from '../db';
import { todoItems, complianceRecords } from '../schema';
import { eq, and, desc, sql, type SQL } from 'drizzle-orm';
import type { TodoItem, TodoType, Status, Priority } from '$types';
import { createComplianceRecord } from './compliance';

export async function getTodoItems(
  filters?: {
    type?: TodoType;
    status?: Status;
    assigneeId?: string;
  },
  pagination?: { page: number; pageSize: number }
): Promise<{ data: TodoItem[]; total: number }> {
  const whereConditions: SQL[] = [];

  if (filters?.type) {
    whereConditions.push(eq(todoItems.type, filters.type));
  }
  if (filters?.status) {
    whereConditions.push(eq(todoItems.status, filters.status));
  }
  if (filters?.assigneeId) {
    whereConditions.push(eq(todoItems.assigneeId, filters.assigneeId));
  }

  const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(todoItems)
    .where(whereClause);

  const total = countResult?.count || 0;

  const data = pagination
    ? await db.select().from(todoItems).where(whereClause).orderBy(desc(todoItems.dueDate)).limit(pagination.pageSize).offset((pagination.page - 1) * pagination.pageSize)
    : await db.select().from(todoItems).where(whereClause).orderBy(desc(todoItems.dueDate));
  return { data: data as TodoItem[], total };
}

export async function getTodoItemById(id: string): Promise<TodoItem | null> {
  const [item] = await db.select().from(todoItems).where(eq(todoItems.id, id));
  return (item as TodoItem) || null;
}

export async function createTodoItem(
  data: Omit<TodoItem, 'id' | 'status' | 'complianceRecordId'>
): Promise<TodoItem> {
  const [item] = await db
    .insert(todoItems)
    .values({
      type: data.type,
      title: data.title,
      description: data.description,
      assignee: data.assignee,
      assigneeId: data.assigneeId,
      priority: data.priority,
      dueDate: data.dueDate,
      status: 'pending'
    })
    .returning();
  return item as TodoItem;
}

export async function updateTodoItem(
  id: string,
  data: Partial<TodoItem>
): Promise<TodoItem | null> {
  const [item] = await db
    .update(todoItems)
    .set(data)
    .where(eq(todoItems.id, id))
    .returning();
  return (item as TodoItem) || null;
}

export async function completeTodo(
  id: string,
  userId: string,
  userName: string,
  processingDetails?: string
): Promise<TodoItem | null> {
  const todo = await getTodoItemById(id);
  if (!todo) return null;

  const complianceRecord = await createComplianceRecord({
    type: 'todo',
    referenceId: id,
    status: 'completed',
    operator: userName,
    operatorId: userId,
    details: processingDetails || `完成待办事项: ${todo.title}`,
    processedAt: new Date()
  });

  const [updatedTodo] = await db
    .update(todoItems)
    .set({
      status: 'completed',
      complianceRecordId: complianceRecord.id
    })
    .where(eq(todoItems.id, id))
    .returning();

  return updatedTodo as TodoItem;
}

export async function processTodo(
  id: string,
  userId: string,
  userName: string
): Promise<TodoItem | null> {
  const todo = await getTodoItemById(id);
  if (!todo) return null;

  const complianceRecord = await createComplianceRecord({
    type: 'todo',
    referenceId: id,
    status: 'processing',
    operator: userName,
    operatorId: userId,
    details: `开始处理待办事项: ${todo.title}`,
    processedAt: new Date()
  });

  const [updatedTodo] = await db
    .update(todoItems)
    .set({
      status: 'processing',
      complianceRecordId: complianceRecord.id
    })
    .where(eq(todoItems.id, id))
    .returning();

  return updatedTodo as TodoItem;
}

export async function getTodoStats(assigneeId?: string): Promise<{
  total: number;
  pending: number;
  processing: number;
  completed: number;
  byType: Record<TodoType, number>;
  highPriority: number;
}> {
  const whereClause = assigneeId ? eq(todoItems.assigneeId, assigneeId) : undefined;

  const [totalResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(todoItems)
    .where(whereClause);

  const [pendingResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(todoItems)
    .where(whereClause ? and(whereClause, eq(todoItems.status, 'pending')) : eq(todoItems.status, 'pending'));

  const [processingResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(todoItems)
    .where(whereClause ? and(whereClause, eq(todoItems.status, 'processing')) : eq(todoItems.status, 'processing'));

  const [completedResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(todoItems)
    .where(whereClause ? and(whereClause, eq(todoItems.status, 'completed')) : eq(todoItems.status, 'completed'));

  const [highPriorityResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(todoItems)
    .where(
      whereClause
        ? and(whereClause, eq(todoItems.priority, 'high' as Priority), eq(todoItems.status, 'pending'))
        : and(eq(todoItems.priority, 'high' as Priority), eq(todoItems.status, 'pending'))
    );

  const byTypeResult = await db
    .select({
      type: todoItems.type,
      count: sql<number>`count(*)`
    })
    .from(todoItems)
    .where(whereClause)
    .groupBy(todoItems.type);

  const byType: Record<TodoType, number> = {
    project_report: 0,
    instrument_booking: 0,
    sample_tracking: 0
  };

  for (const item of byTypeResult) {
    if (item.type) {
      byType[item.type] = item.count;
    }
  }

  return {
    total: totalResult?.count || 0,
    pending: pendingResult?.count || 0,
    processing: processingResult?.count || 0,
    completed: completedResult?.count || 0,
    byType,
    highPriority: highPriorityResult?.count || 0
  };
}
