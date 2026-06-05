import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { withAuthSession, canAccessProject, sanitizeProjectForClient } from '@/lib/auth-utils';
import { createAuditLog, createChangeTracker } from '@/lib/audit-service';
import { sendProjectStatusNotification } from '@/lib/notification-service';
import { eq } from 'drizzle-orm';

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'archived']).optional(),
  description: z.string().optional(),
  totalAmount: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  privateNotes: z.string().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authResult = await withAuthSession();
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { session } = authResult;
  const canAccess = await canAccessProject(
    params.id,
    session.user.id,
    session.user.role
  );

  if (!canAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, params.id),
    with: {
      client: true,
      tasks: {
        orderBy: (tasks, { asc }) => [asc(tasks.sortOrder)],
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let result = project;
  if (session.user.role === 'client') {
    result = sanitizeProjectForClient(project as any);
  }

  return NextResponse.json(result);
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authResult = await withAuthSession();
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  if (authResult.session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const existing = await db.query.projects.findFirst({
      where: eq(projects.id, params.id),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const body = await request.json();
    const validated = updateProjectSchema.parse(body);

    const trackChanges = createChangeTracker(existing);

    const [updated] = await db
      .update(projects)
      .set({
        ...validated,
        startDate: validated.startDate ? new Date(validated.startDate) : undefined,
        endDate: validated.endDate ? new Date(validated.endDate) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, params.id))
      .returning();

    const changes = trackChanges(validated);
    if (changes) {
      await createAuditLog({
        userId: authResult.session.user.id,
        action: 'update',
        entityType: 'project',
        entityId: params.id,
        changes,
      });
    }

    if (validated.status && validated.status !== existing.status) {
      await sendProjectStatusNotification(params.id, existing.status, validated.status);
    }

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authResult = await withAuthSession();
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  if (authResult.session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const existing = await db.query.projects.findFirst({
    where: eq(projects.id, params.id),
  });

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await db.delete(projects).where(eq(projects.id, params.id));

  await createAuditLog({
    userId: authResult.session.user.id,
    action: 'delete',
    entityType: 'project',
    entityId: params.id,
    changes: { name: { before: existing.name, after: null } },
  });

  return NextResponse.json({ success: true });
}
