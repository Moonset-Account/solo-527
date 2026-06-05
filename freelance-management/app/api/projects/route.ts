import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, sanitizeProjectForClient } from '@/lib/middleware/auth';
import * as projectService from '@/lib/services/projectService';
import { Role } from '@/types';
import { canAccessProject } from '@/lib/auth';

export const GET = requireAuth(async (request: NextRequest, user) => {
  const projects = projectService.getProjects(user.userId, user.role);
  
  if (user.role === Role.CLIENT) {
    return NextResponse.json(projects.map(sanitizeProjectForClient));
  }
  
  return NextResponse.json(projects);
});

export const POST = requireAuth(async (request: NextRequest, user) => {
  if (user.role === Role.CLIENT) {
    return NextResponse.json({ error: '权限不足' }, { status: 403 });
  }
  
  const body = await request.json();
  const project = projectService.createProject(body, user.userId);
  
  return NextResponse.json(project, { status: 201 });
});
