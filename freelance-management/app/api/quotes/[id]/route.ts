import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import * as quoteService from '@/lib/services/quoteService';
import { Role } from '@/types';

export const GET = requireAuth(async (request: NextRequest, user) => {
  const id = parseInt(request.nextUrl.pathname.split('/').pop()!);
  const quote = quoteService.getQuoteById(id);
  
  if (!quote) {
    return NextResponse.json({ error: '报价单不存在' }, { status: 404 });
  }
  
  const items = quoteService.getQuoteItems(id);
  
  return NextResponse.json({ ...quote, items });
});

export const PUT = requireAuth(async (request: NextRequest, user) => {
  if (user.role === Role.CLIENT) {
    return NextResponse.json({ error: '权限不足' }, { status: 403 });
  }
  
  const id = parseInt(request.nextUrl.pathname.split('/').pop()!);
  const body = await request.json();
  
  const quote = quoteService.updateQuote(id, body);
  return NextResponse.json(quote);
});

export const DELETE = requireAuth(async (request: NextRequest, user) => {
  if (user.role === Role.CLIENT) {
    return NextResponse.json({ error: '权限不足' }, { status: 403 });
  }
  
  const id = parseInt(request.nextUrl.pathname.split('/').pop()!);
  quoteService.deleteQuote(id);
  
  return NextResponse.json({ success: true });
});
