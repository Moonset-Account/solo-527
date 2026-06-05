import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import * as timeEntryService from '@/lib/services/timeEntryService';
import { Role } from '@/types';

export const GET = requireAuth(async (request: NextRequest, user) => {
  if (user.role === Role.CLIENT) {
    return NextResponse.json([]);
  }
  
  const projectId = request.nextUrl.searchParams.get('project_id');
  const userId = request.nextUrl.searchParams.get('user_id');
  
  if (projectId) {
    const entries = timeEntryService.getTimeEntriesByProject(parseInt(projectId));
    return NextResponse.json(entries);
  }
  
  const uid = userId ? parseInt(userId) : user.userId;
  const entries = timeEntryService.getTimeEntriesByUser(uid);
  return NextResponse.json(entries);
});

export const POST = requireAuth(async (request: NextRequest, user) => {
  if (user.role === Role.CLIENT) {
    return NextResponse.json({ error: '权限不足' }, { status: 403 });
  }
  
  const body = await request.json();
  const entry = timeEntryService.createTimeEntry(body, user.userId);
  
  return NextResponse.json(entry, { status: 201 });
});
