import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import * as clientService from '@/lib/services/clientService';
import { canAccessClient } from '@/lib/auth';
import { Role } from '@/types';

export const GET = requireAuth(async (request: NextRequest, user) => {
  const id = parseInt(request.nextUrl.pathname.split('/').pop()!);
  
  if (user.role === Role.CLIENT && !canAccessClient(user, id)) {
    return NextResponse.json({ error: '权限不足' }, { status: 403 });
  }
  
  const client = clientService.getClientById(id);
  if (!client) {
    return NextResponse.json({ error: '客户不存在' }, { status: 404 });
  }
  
  const stats = clientService.getClientStats(id);
  
  return NextResponse.json({ ...client, stats });
});

export const PUT = requireAuth(async (request: NextRequest, user) => {
  if (user.role === Role.CLIENT) {
    return NextResponse.json({ error: '权限不足' }, { status: 403 });
  }
  
  const id = parseInt(request.nextUrl.pathname.split('/').pop()!);
  const body = await request.json();
  
  const client = clientService.updateClient(id, body);
  return NextResponse.json(client);
});

export const DELETE = requireAuth(async (request: NextRequest, user) => {
  if (user.role !== Role.ADMIN && user.role !== Role.DESIGNER) {
    return NextResponse.json({ error: '权限不足' }, { status: 403 });
  }
  
  const id = parseInt(request.nextUrl.pathname.split('/').pop()!);
  clientService.deleteClient(id);
  
  return NextResponse.json({ success: true });
});
