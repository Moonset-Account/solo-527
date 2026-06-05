import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import * as statsService from '@/lib/services/statsService';
import * as projectService from '@/lib/services/projectService';
import * as invoiceService from '@/lib/services/invoiceService';
import { Role } from '@/types';

export const GET = requireAuth(async (request: NextRequest, user) => {
  const type = request.nextUrl.searchParams.get('type');
  
  if (type === 'revenue') {
    const stats = statsService.getRevenueStats(user.userId, user.role);
    return NextResponse.json(stats);
  }
  
  if (type === 'monthly') {
    const monthly = statsService.getMonthlyRevenue(12);
    return NextResponse.json(monthly);
  }
  
  if (type === 'projects') {
    const projectStats = projectService.getProjectStats();
    return NextResponse.json(projectStats);
  }
  
  if (type === 'invoices') {
    const invoiceStats = invoiceService.getInvoiceStats();
    return NextResponse.json(invoiceStats);
  }
  
  if (type === 'top-clients') {
    const topClients = statsService.getTopClients(5);
    return NextResponse.json(topClients);
  }
  
  const revenue = statsService.getRevenueStats(user.userId, user.role);
  const projects = projectService.getProjectStats();
  const invoices = invoiceService.getInvoiceStats();
  const monthly = statsService.getMonthlyRevenue(6);
  const topClients = statsService.getTopClients(5);
  
  return NextResponse.json({
    revenue,
    projects,
    invoices,
    monthly,
    topClients,
  });
});
