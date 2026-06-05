import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import * as invoiceService from '@/lib/services/invoiceService';
import { Role } from '@/types';

export const GET = requireAuth(async (request: NextRequest, user) => {
  const id = parseInt(request.nextUrl.pathname.split('/').pop()!);
  const invoice = invoiceService.getInvoiceById(id);
  
  if (!invoice) {
    return NextResponse.json({ error: '发票不存在' }, { status: 404 });
  }
  
  const items = invoiceService.getInvoiceItems(id);
  const payments = invoiceService.getPaymentsByInvoice(id);
  
  return NextResponse.json({ ...invoice, items, payments });
});

export const PUT = requireAuth(async (request: NextRequest, user) => {
  if (user.role === Role.CLIENT) {
    return NextResponse.json({ error: '权限不足' }, { status: 403 });
  }
  
  const id = parseInt(request.nextUrl.pathname.split('/').pop()!);
  const body = await request.json();
  
  const invoice = invoiceService.updateInvoice(id, body);
  return NextResponse.json(invoice);
});

export const DELETE = requireAuth(async (request: NextRequest, user) => {
  if (user.role === Role.CLIENT) {
    return NextResponse.json({ error: '权限不足' }, { status: 403 });
  }
  
  const id = parseInt(request.nextUrl.pathname.split('/').pop()!);
  invoiceService.deleteInvoice(id);
  
  return NextResponse.json({ success: true });
});
