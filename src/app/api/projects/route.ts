import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { withAuthSession, sanitizeProjectsForClient } from '@/lib/auth-utils';
import { createAuditLog } from '@/lib/audit-service';
import { eq, and, like, asc, desc } from 'drizzle-orm';

const createProjectSchema = z.object({
  name: z.string().min(1),
  clientId: z.string().optional(),
  description: z.string().optional(),
  totalAmount: z.number().default(0),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export async function GET(request: Request) {
  const authResult = await withAuthSession();
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { session } = authResult;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const clientId = searchParams.get('clientId');
  const search = searchParams.get('search');

  let query = db.select().from(projects).$dynamic();

  const conditions = [];
  if (status) {
    conditions.push(eq(projects.status, status as any));
  }
  if (clientId) {
    conditions.push(eq(projects.clientId, clientId));
  }
  if (search) {
    conditions.push(like(projects.name, `%${search}%`));
  }

  if (session.user.role === 'client') {
    const client = await db.query.clients.findFirst({
      where: (clients, { eq }) => eq(clients.userId, session.user.id),
    });
    if (client) {
      conditions.push(eq(projects.clientId, client.id));
    } else {
      return NextResponse.json({ data: [], total: 0 });
    }
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  query = query.orderBy(desc(projects.updatedAt));

  const result = await query;

  let data = result;
  if (session.user.role === 'client') {
    data = sanitizeProjectsForClient(data as any);
  }

  return NextResponse.json({
    data,
    total: data.length,
  });
}

export async function POST(request: Request) {
  const authResult = await withAuthSession();
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  if (authResult.session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validated = createProjectSchema.parse(body);

    const [project] = await db
      .insert(projects)
      .values({
        ...validated,
        startDate: validated.startDate ? new Date(validated.startDate) : null,
        endDate: validated.endDate ? new Date(validated.endDate) : null,
        createdBy: authResult.session.user.id,
      })
      .returning();

    await createAuditLog({
      userId: authResult.session.user.id,
      action: 'create',
      entityType: 'project',
      entityId: project.id,
      changes: { name: { before: null, after: project.name } },
    });

    return NextResponse.json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
