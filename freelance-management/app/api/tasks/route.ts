import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import * as taskService from '@/lib/services/taskService';
import { Role } from '@/types';
import { canAccessProject } from '@/lib/auth';

export const GET = requireAuth(async (request: NextRequest, user) => {
  const projectId = request.nextUrl.searchParams.get('project_id');
  const assigneeId = request.nextUrl.searchParams.get('assignee_id');
  
  if (assigneeId) {
    const tasks = taskService.getTasksByAssignee(parseInt(assigneeId));
    return NextResponse.json(tasks);
  }
  
  if (projectId) {
    const pid = parseInt(projectId);
    if (user.role === Role.CLIENT && !canAccessProject(user, pid)) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }
    const tasks = taskService.getTasksByProject(pid);
    return NextResponse.json(tasks);
  }
  
  if (user.role !== Role.CLIENT) {
    const tasks = taskService.getTasksByAssignee(user.userId);
    return NextResponse.json(tasks);
  }
  
  return NextResponse.json([]);
});

export const POST = requireAuth(async (request: NextRequest, user) => {
  if (user.role === Role.CLIENT) {
    return NextResponse.json({ error: '权限不足' }, { status: 403 });
  }
  
  const body = await request.json();
  
  if (body.project_id && user.role === Role.CLIENT && !canAccessProject(user, body.project_id)) {
    return NextResponse.json({ error: '权限不足' }, { status: 403 });
  }
  
  const task = taskService.createTask(body, user.userId);
  return NextResponse.json(task, { status: 201 });
});
