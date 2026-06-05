import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import * as taskService from '@/lib/services/taskService';
import { Role } from '@/types';
import { canAccessProject } from '@/lib/auth';
import { db } from '@/lib/db/schema';

export const GET = requireAuth(async (request: NextRequest, user) => {
  const projectId = request.nextUrl.searchParams.get('project_id');
  const assigneeId = request.nextUrl.searchParams.get('assignee_id');

  if (user.role === Role.CLIENT) {
    if (projectId) {
      const pid = parseInt(projectId);
      if (!canAccessProject(user, pid)) {
        return NextResponse.json({ error: '权限不足' }, { status: 403 });
      }
      const tasks = taskService.getTasksByProject(pid);
      return NextResponse.json(tasks);
    }

    const tasks = db.prepare(`
      SELECT t.* FROM tasks t
      JOIN projects p ON t.project_id = p.id
      JOIN clients c ON p.client_id = c.id
      WHERE c.user_id = ?
      ORDER BY t.created_at DESC
    `).all(user.userId);
    return NextResponse.json(tasks);
  }

  if (assigneeId) {
    const tasks = taskService.getTasksByAssignee(parseInt(assigneeId));
    return NextResponse.json(tasks);
  }

  if (projectId) {
    const pid = parseInt(projectId);
    const tasks = taskService.getTasksByProject(pid);
    return NextResponse.json(tasks);
  }

  const tasks = taskService.getTasksByAssignee(user.userId);
  return NextResponse.json(tasks);
});

export const POST = requireAuth(async (request: NextRequest, user) => {
  if (user.role === Role.CLIENT) {
    return NextResponse.json({ error: '权限不足' }, { status: 403 });
  }

  const body = await request.json();

  if (body.project_id && !canAccessProject(user, body.project_id)) {
    return NextResponse.json({ error: '权限不足' }, { status: 403 });
  }

  const task = taskService.createTask(body, user.userId);
  return NextResponse.json(task, { status: 201 });
});
