import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import * as invoiceService from '@/lib/services/invoiceService';
import { Role } from '@/types';

export const POST = requireAuth(async (request: NextRequest, user) => {
  if (user.role === Role.CLIENT) {
    return NextResponse.json({ error: '权限不足' }, { status: 403 });
  }
  
  const id = parseInt(request.nextUrl.pathname.split('/')[3]);
  const body = await request.json();
  
  const payment = invoiceService.addPayment(
    id,
    body.amount,
    body.payment_method,
    body.note,
    user.userId
  );
  
  return NextResponse.json(payment, { status: 201 });
});
