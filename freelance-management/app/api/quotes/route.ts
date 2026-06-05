import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import * as quoteService from '@/lib/services/quoteService';
import { Role } from '@/types';

export const GET = requireAuth(async (request: NextRequest, user) => {
  const templates = request.nextUrl.searchParams.get('templates');
  
  if (templates === 'true' && user.role !== Role.CLIENT) {
    return NextResponse.json(quoteService.getQuoteTemplates());
  }
  
  const quotes = quoteService.getQuotes(user.userId, user.role);
  return NextResponse.json(quotes);
});

export const POST = requireAuth(async (request: NextRequest, user) => {
  if (user.role === Role.CLIENT) {
    return NextResponse.json({ error: '权限不足' }, { status: 403 });
  }
  
  const body = await request.json();
  const quote = quoteService.createQuote(body, user.userId);
  
  return NextResponse.json(quote, { status: 201 });
});
