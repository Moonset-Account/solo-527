import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import * as invoiceService from '@/lib/services/invoiceService';
import { Role } from '@/types';

export const GET = requireAuth(async (request: NextRequest, user) => {
  const invoices = invoiceService.getInvoices(user.userId, user.role);
  return NextResponse.json(invoices);
});

export const POST = requireAuth(async (request: NextRequest, user) => {
  if (user.role === Role.CLIENT) {
    return NextResponse.json({ error: '权限不足' }, { status: 403 });
  }
  
  const body = await request.json();
  const invoice = invoiceService.createInvoice(body, user.userId);
  
  return NextResponse.json(invoice, { status: 201 });
});
