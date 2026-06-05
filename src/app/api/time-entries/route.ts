import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { timeEntries } from '@/db/schema';
import { withAuthSession } from '@/lib/auth-utils';
import { createAuditLog } from '@/lib/audit-service';
import { eq, and, desc } from 'drizzle-orm';

const createTimeEntrySchema = z.object({
  projectId: z.string(),
  taskId: z.string().optional(),
  startTime: z.string(),
  endTime: z.string().optional(),
  durationMinutes: z.number().int().positive(),
  description: z.string().optional(),
  isBillable: z.boolean().default(true),
});

export async function GET(request: Request) {
  const authResult = await withAuthSession();
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  if (authResult.session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const conditions = [];
  if (projectId) {
    conditions.push(eq(timeEntries.projectId, projectId));
  }
  if (startDate) {
    conditions.push(eq(timeEntries.startTime, new Date(startDate)));
  }

  const data = await db.query.timeEntries.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [desc(timeEntries.startTime)],
    with: {
      project: {
        columns: { name: true },
      },
      task: {
        columns: { name: true },
      },
    },
    limit: 100,
  });

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
    const validated = createTimeEntrySchema.parse(body);

    const [entry] = await db
      .insert(timeEntries)
      .values({
        ...validated,
        startTime: new Date(validated.startTime),
        endTime: validated.endTime ? new Date(validated.endTime) : null,
        userId: authResult.session.user.id,
      })
      .returning();

    await createAuditLog({
      userId: authResult.session.user.id,
      action: 'create',
      entityType: 'time_entry',
      entityId: entry.id,
      changes: {
        projectId: { before: null, after: entry.projectId },
        duration: { before: null, after: entry.durationMinutes },
      },
    });

    return NextResponse.json(entry);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
