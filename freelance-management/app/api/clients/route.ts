import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import * as clientService from '@/lib/services/clientService';
import { Role } from '@/types';

export const GET = requireAuth(async (request: NextRequest, user) => {
  if (user.role === Role.CLIENT) {
    const client = clientService.getClientByUserId(user.userId);
    return NextResponse.json(client ? [client] : []);
  }
  
  const clients = clientService.getClients();
  return NextResponse.json(clients);
});

export const POST = requireAuth(async (request: NextRequest, user) => {
  if (user.role === Role.CLIENT) {
    return NextResponse.json({ error: '权限不足' }, { status: 403 });
  }
  
  const body = await request.json();
  const client = clientService.createClient(body, user.userId);
  
  return NextResponse.json(client, { status: 201 });
});
