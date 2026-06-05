import { NextResponse } from 'next/server';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { withAuthSession } from '@/lib/auth-utils';
import { processNotificationQueue, markNotificationAsRead } from '@/lib/notification-service';
import { eq, and } from 'drizzle-orm';

export async function GET(request: Request) {
  const authResult = await withAuthSession();
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get('unread') === 'true';

  const conditions = [eq(notifications.userId, authResult.session.user.id)];
  if (unreadOnly) {
    conditions.push(eq(notifications.status, 'sent'));
  }

  const data = await db.query.notifications.findMany({
    where: and(...conditions),
    orderBy: (notifications, { desc }) => [desc(notifications.createdAt)],
    limit: 50,
  });

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const authResult = await withAuthSession();
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const body = await request.json();

  if (body.action === 'process-queue') {
    if (authResult.session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const results = await processNotificationQueue();
    return NextResponse.json({ processed: results.length, results });
  }

  if (body.action === 'mark-read' && body.id) {
    await markNotificationAsRead(body.id);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
