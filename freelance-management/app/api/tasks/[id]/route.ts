import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import * as taskService from '@/lib/services/taskService';
import { Role } from '@/types';

export const GET = requireAuth(async (request: NextRequest, user) => {
  const id = parseInt(request.nextUrl.pathname.split('/').pop()!);
  const task = taskService.getTaskById(id);
  
  if (!task) {
    return NextResponse.json({ error: '任务不存在' }, { status: 404 });
  }
  
  return NextResponse.json(task);
});

export const PUT = requireAuth(async (request: NextRequest, user) => {
  if (user.role === Role.CLIENT) {
    return NextResponse.json({ error: '权限不足' }, { status: 403 });
  }
  
  const id = parseInt(request.nextUrl.pathname.split('/').pop()!);
  const body = await request.json();
  
  const task = taskService.updateTask(id, body);
  return NextResponse.json(task);
});

export const DELETE = requireAuth(async (request: NextRequest, user) => {
  if (user.role === Role.CLIENT) {
    return NextResponse.json({ error: '权限不足' }, { status: 403 });
  }
  
  const id = parseInt(request.nextUrl.pathname.split('/').pop()!);
  taskService.deleteTask(id);
  
  return NextResponse.json({ success: true });
});
