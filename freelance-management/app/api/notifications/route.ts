import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import * as notificationService from '@/lib/services/notificationService';

export const GET = requireAuth(async (request: NextRequest, user) => {
  const unread = request.nextUrl.searchParams.get('unread');
  
  if (unread === 'count') {
    const count = notificationService.getUnreadNotificationCount(user.userId);
    return NextResponse.json({ count });
  }
  
  const notifications = notificationService.getUserNotifications(user.userId);
  return NextResponse.json(notifications);
});

export const POST = requireAuth(async (request: NextRequest, user) => {
  const body = await request.json();
  
  if (body.mark_all_read) {
    notificationService.markAllNotificationsAsRead(user.userId);
    return NextResponse.json({ success: true });
  }
  
  if (body.id && body.read) {
    notificationService.markNotificationAsRead(body.id, user.userId);
    return NextResponse.json({ success: true });
  }
  
  return NextResponse.json({ error: '无效请求' }, { status: 400 });
});
