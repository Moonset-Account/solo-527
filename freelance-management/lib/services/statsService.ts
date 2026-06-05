import { db } from '@/lib/db/schema';
import { RevenueStats } from '@/types';
import * as XLSX from 'xlsx';

export function getRevenueStats(userId?: number, role?: string): RevenueStats {
  let clientFilter = '';
  const params: any[] = [];
  
  if (role === 'client' && userId) {
    clientFilter = 'JOIN clients c ON i.client_id = c.id WHERE c.user_id = ?';
    params.push(userId);
  }
  
  const paidResult = db.prepare(`
    SELECT COALESCE(SUM(p.amount), 0) as total
    FROM payments p
    JOIN invoices i ON p.invoice_id = i.id
    ${clientFilter ? clientFilter.replace('WHERE', 'AND') : ''}
    WHERE p.status = 'paid'
  `).get(...params) as { total: number };
  
  const invoiceAmountResult = db.prepare(`
    SELECT COALESCE(SUM(total_amount), 0) as total
    FROM invoices i
    ${clientFilter}
  `).get(...(clientFilter ? params : [])) as { total: number };
  
  const outstandingResult = db.prepare(`
    SELECT COALESCE(SUM(total_amount), 0) as total
    FROM invoices i
    ${clientFilter ? clientFilter + ' AND' : 'WHERE'} i.status IN ('sent', 'overdue')
  `).get(...(clientFilter ? params : [])) as { total: number };
  
  const overdueResult = db.prepare(`
    SELECT COALESCE(SUM(total_amount), 0) as total
    FROM invoices i
    ${clientFilter ? clientFilter + ' AND' : 'WHERE'} 
    (i.status = 'overdue' OR (i.status = 'sent' AND i.due_date < DATE('now')))
  `).get(...(clientFilter ? params : [])) as { total: number };
  
  const hoursResult = db.prepare(`
    SELECT 
      COALESCE(SUM(hours), 0) as total,
      COALESCE(SUM(CASE WHEN billable = 1 THEN hours ELSE 0 END), 0) as billable
    FROM time_entries
  `).get() as { total: number; billable: number };
  
  const projectCount = db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number };
  const clientCount = db.prepare('SELECT COUNT(*) as count FROM clients').get() as { count: number };
  
  return {
    totalRevenue: paidResult.total,
    paidInvoicedAmount: invoiceAmountResult.total,
    outstandingAmount: outstandingResult.total,
    overdueAmount: overdueResult.total,
    totalHours: hoursResult.total,
    billableHours: hoursResult.billable,
    projectCount: projectCount.count,
    clientCount: clientCount.count,
  };
}

export function getMonthlyRevenue(months = 12): any[] {
  const result = db.prepare(`
    SELECT 
      strftime('%Y-%m', p.paid_at) as month,
      COALESCE(SUM(p.amount), 0) as revenue,
      COUNT(*) as payment_count
    FROM payments p
    WHERE p.status = 'paid' AND p.paid_at >= DATE('now', '-' || ? || ' months')
    GROUP BY strftime('%Y-%m', p.paid_at)
    ORDER BY month DESC
  `).all(months);
  
  return result;
}

export function getProjectsByStatus(): any[] {
  return db.prepare(`
    SELECT status, COUNT(*) as count
    FROM projects
    GROUP BY status
  `).all();
}

export function getTopClients(limit = 5): any[] {
  return db.prepare(`
    SELECT 
      c.id,
      c.name,
      c.email,
      COALESCE(SUM(p.amount), 0) as total_revenue,
      COUNT(DISTINCT pr.id) as project_count
    FROM clients c
    LEFT JOIN invoices i ON c.id = i.client_id
    LEFT JOIN payments p ON i.id = p.invoice_id AND p.status = 'paid'
    LEFT JOIN projects pr ON c.id = pr.client_id
    GROUP BY c.id
    ORDER BY total_revenue DESC
    LIMIT ?
  `).all(limit);
}

export function exportInvoicesToExcel(): Buffer {
  const invoices = db.prepare(`
    SELECT 
      i.invoice_number,
      i.title,
      c.name as client_name,
      p.name as project_name,
      i.total_amount,
      i.status,
      i.created_at,
      i.due_date,
      i.paid_at
    FROM invoices i
    JOIN clients c ON i.client_id = c.id
    JOIN projects p ON i.project_id = p.id
    ORDER BY i.created_at DESC
  `).all();
  
  const ws = XLSX.utils.json_to_sheet(invoices.map((inv: any) => ({
    '发票编号': inv.invoice_number,
    '标题': inv.title,
    '客户': inv.client_name,
    '项目': inv.project_name,
    '金额': inv.total_amount,
    '状态': inv.status,
    '创建日期': inv.created_at,
    '到期日期': inv.due_date,
    '支付日期': inv.paid_at,
  })));
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '发票');
  
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

export function exportTimeEntriesToExcel(startDate?: string, endDate?: string): Buffer {
  let query = `
    SELECT 
      te.entry_date,
      u.name as user_name,
      p.name as project_name,
      t.title as task_title,
      te.hours,
      te.description,
      CASE WHEN te.billable = 1 THEN '是' ELSE '否' END as billable
    FROM time_entries te
    JOIN users u ON te.user_id = u.id
    JOIN projects p ON te.project_id = p.id
    JOIN tasks t ON te.task_id = t.id
  `;
  
  const params: any[] = [];
  if (startDate && endDate) {
    query += ' WHERE te.entry_date BETWEEN ? AND ?';
    params.push(startDate, endDate);
  }
  query += ' ORDER BY te.entry_date DESC';
  
  const entries = db.prepare(query).all(...params);
  
  const ws = XLSX.utils.json_to_sheet(entries.map((entry: any) => ({
    '日期': entry.entry_date,
    '人员': entry.user_name,
    '项目': entry.project_name,
    '任务': entry.task_title,
    '工时': entry.hours,
    '描述': entry.description,
    '可计费': entry.billable,
  })));
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '工时记录');
  
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

export function exportRevenueReport(): Buffer {
  const monthly = getMonthlyRevenue(12);
  const stats = getRevenueStats();
  const topClients = getTopClients(10);
  
  const wb = XLSX.utils.book_new();
  
  const summaryData = [
    { '指标': '总收入', '数值': stats.totalRevenue },
    { '指标': '已开票金额', '数值': stats.paidInvoicedAmount },
    { '指标': '待收金额', '数值': stats.outstandingAmount },
    { '指标': '逾期金额', '数值': stats.overdueAmount },
    { '指标': '总工时', '数值': stats.totalHours },
    { '指标': '可计费工时', '数值': stats.billableHours },
    { '指标': '项目数量', '数值': stats.projectCount },
    { '指标': '客户数量', '数值': stats.clientCount },
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, '汇总');
  
  const wsMonthly = XLSX.utils.json_to_sheet(monthly.map((m: any) => ({
    '月份': m.month,
    '收入': m.revenue,
    '付款笔数': m.payment_count,
  })));
  XLSX.utils.book_append_sheet(wb, wsMonthly, '月度收入');
  
  const wsClients = XLSX.utils.json_to_sheet(topClients.map((c: any) => ({
    '客户名称': c.name,
    '邮箱': c.email,
    '总收入': c.total_revenue,
    '项目数': c.project_count,
  })));
  XLSX.utils.book_append_sheet(wb, wsClients, 'Top客户');
  
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}
