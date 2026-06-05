import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, sanitizeProjectForClient } from '@/lib/middleware/auth';
import * as projectService from '@/lib/services/projectService';
import * as taskService from '@/lib/services/taskService';
import * as timeEntryService from '@/lib/services/timeEntryService';
import { Role } from '@/types';
import { canAccessProject } from '@/lib/auth';

export const GET = requireAuth(async (request: NextRequest, user) => {
  const id = parseInt(request.nextUrl.pathname.split('/').pop()!);
  
  if (user.role === Role.CLIENT && !canAccessProject(user, id)) {
    return NextResponse.json({ error: '权限不足' }, { status: 403 });
  }
  
  const project = projectService.getProjectById(id);
  if (!project) {
    return NextResponse.json({ error: '项目不存在' }, { status: 404 });
  }
  
  const tasks = taskService.getTasksByProject(id);
  const progress = projectService.getProjectProgress(id);
  
  let timeEntries: any[] = [];
  if (user.role !== Role.CLIENT) {
    timeEntries = timeEntryService.getTimeEntriesByProject(id);
  }
  
  const result = user.role === Role.CLIENT 
    ? sanitizeProjectForClient(project) 
    : project;
  
  return NextResponse.json({
    ...result,
    tasks,
    progress,
    timeEntries,
  });
});

export const PUT = requireAuth(async (request: NextRequest, user) => {
  if (user.role === Role.CLIENT) {
    return NextResponse.json({ error: '权限不足' }, { status: 403 });
  }
  
  const id = parseInt(request.nextUrl.pathname.split('/').pop()!);
  const body = await request.json();
  
  const project = projectService.updateProject(id, body);
  return NextResponse.json(project);
});

export const DELETE = requireAuth(async (request: NextRequest, user) => {
  if (user.role !== Role.ADMIN && user.role !== Role.DESIGNER) {
    return NextResponse.json({ error: '权限不足' }, { status: 403 });
  }
  
  const id = parseInt(request.nextUrl.pathname.split('/').pop()!);
  projectService.deleteProject(id);
  
  return NextResponse.json({ success: true });
});
