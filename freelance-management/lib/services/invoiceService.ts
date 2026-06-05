import { db } from '@/lib/db/schema';
import { Invoice, InvoiceItem, InvoiceStatus, Payment, PaymentStatus } from '@/types';
import { notifyInvoiceCreated, notifyPaymentReceived } from './notificationService';

export interface CreateInvoiceInput {
  project_id: number;
  client_id: number;
  title: string;
  description?: string;
  amount: number;
  tax?: number;
  discount?: number;
  total_amount: number;
  due_date?: string;
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
  }>;
}

export function generateInvoiceNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const count = db.prepare("SELECT COUNT(*) as count FROM invoices WHERE strftime('%Y', created_at) = ?").get(year.toString()) as { count: number };
  return `INV-${year}-${String(count.count + 1).padStart(3, '0')}`;
}

export function getInvoices(userId: number, role: string): (Invoice & { client_name?: string; project_name?: string })[] {
  if (role === 'client') {
    return db.prepare(`
      SELECT i.*, c.name as client_name, p.name as project_name
      FROM invoices i
      JOIN clients c ON i.client_id = c.id
      JOIN projects p ON i.project_id = p.id
      WHERE c.user_id = ?
      ORDER BY i.created_at DESC
    `).all(userId) as (Invoice & { client_name?: string; project_name?: string })[];
  }
  return db.prepare(`
    SELECT i.*, c.name as client_name, p.name as project_name
    FROM invoices i
    JOIN clients c ON i.client_id = c.id
    JOIN projects p ON i.project_id = p.id
    ORDER BY i.created_at DESC
  `).all() as (Invoice & { client_name?: string; project_name?: string })[];
}

export function getInvoiceById(id: number): (Invoice & { client_name?: string; client_email?: string; project_name?: string }) | null {
  return db.prepare(`
    SELECT i.*, c.name as client_name, c.email as client_email, p.name as project_name
    FROM invoices i
    JOIN clients c ON i.client_id = c.id
    JOIN projects p ON i.project_id = p.id
    WHERE i.id = ?
  `).get(id) as (Invoice & { client_name?: string; client_email?: string; project_name?: string }) | null;
}

export function getInvoiceItems(invoiceId: number): InvoiceItem[] {
  return db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(invoiceId) as InvoiceItem[];
}

export function createInvoice(input: CreateInvoiceInput, createdBy: number): Invoice {
  const invoiceNumber = generateInvoiceNumber();
  
  const stmt = db.prepare(`
    INSERT INTO invoices (project_id, client_id, invoice_number, title, description, amount, tax, discount, total_amount, status, due_date, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    input.project_id,
    input.client_id,
    invoiceNumber,
    input.title,
    input.description || null,
    input.amount,
    input.tax || 0,
    input.discount || 0,
    input.total_amount,
    InvoiceStatus.DRAFT,
    input.due_date || null,
    createdBy
  );
  
  const invoiceId = result.lastInsertRowid as number;
  
  const insertItem = db.prepare(`
    INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, amount)
    VALUES (?, ?, ?, ?, ?)
  `);
  input.items.forEach(item => {
    insertItem.run(invoiceId, item.description, item.quantity, item.unit_price, item.amount);
  });
  
  return getInvoiceById(invoiceId)! as Invoice;
}

export function updateInvoice(id: number, input: Partial<CreateInvoiceInput>): Invoice {
  const fields = Object.keys(input)
    .filter(key => key !== 'items')
    .map(key => `${key} = ?`)
    .join(', ');
  const values = Object.values(input).filter(v => typeof v !== 'object');
  values.push(id);
  
  if (fields) {
    const stmt = db.prepare(`UPDATE invoices SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
    stmt.run(...values);
  }
  
  if (input.items) {
    db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').run(id);
    const insertItem = db.prepare(`
      INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, amount)
      VALUES (?, ?, ?, ?, ?)
    `);
    input.items.forEach(item => {
      insertItem.run(id, item.description, item.quantity, item.unit_price, item.amount);
    });
  }
  
  return getInvoiceById(id)! as Invoice;
}

export function sendInvoice(id: number): Invoice {
  const invoice = getInvoiceById(id)!;
  db.prepare('UPDATE invoices SET status = ?, sent_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(InvoiceStatus.SENT, id);
  
  const client = db.prepare('SELECT user_id FROM clients WHERE id = ?').get(invoice.client_id) as any;
  if (client && client.user_id) {
    notifyInvoiceCreated(id, invoice.invoice_number, invoice.total_amount, client.user_id);
  }
  
  return getInvoiceById(id)! as Invoice;
}

export function markInvoicePaid(id: number): Invoice {
  db.prepare('UPDATE invoices SET status = ?, paid_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(InvoiceStatus.PAID, id);
  return getInvoiceById(id)! as Invoice;
}

export function deleteInvoice(id: number): void {
  db.prepare('DELETE FROM invoices WHERE id = ?').run(id);
}

export function addPayment(invoiceId: number, amount: number, paymentMethod?: string, note?: string, createdBy?: number): Payment {
  const stmt = db.prepare(`
    INSERT INTO payments (invoice_id, amount, payment_method, status, paid_at, note, created_by)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
  `);
  const result = stmt.run(
    invoiceId,
    amount,
    paymentMethod || null,
    PaymentStatus.PAID,
    note || null,
    createdBy || 1
  );
  
  const invoice = getInvoiceById(invoiceId)!;
  const totalPaid = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE invoice_id = ? AND status = ?')
    .get(invoiceId, PaymentStatus.PAID) as { total: number };
  
  if (totalPaid.total >= invoice.total_amount) {
    markInvoicePaid(invoiceId);
  }
  
  notifyPaymentReceived(invoiceId, invoice.invoice_number, amount, invoice.created_by);
  
  return db.prepare('SELECT * FROM payments WHERE id = ?').get(result.lastInsertRowid) as Payment;
}

export function getPaymentsByInvoice(invoiceId: number): Payment[] {
  return db.prepare('SELECT * FROM payments WHERE invoice_id = ? ORDER BY created_at DESC').all(invoiceId) as Payment[];
}

export function getInvoiceStats() {
  const total = db.prepare('SELECT COUNT(*) as count FROM invoices').get() as { count: number };
  const paid = db.prepare("SELECT COALESCE(SUM(total_amount), 0) as amount, COUNT(*) as count FROM invoices WHERE status = 'paid'").get() as { amount: number; count: number };
  const outstanding = db.prepare("SELECT COALESCE(SUM(total_amount), 0) as amount, COUNT(*) as count FROM invoices WHERE status IN ('sent', 'overdue')").get() as { amount: number; count: number };
  const overdue = db.prepare("SELECT COALESCE(SUM(total_amount), 0) as amount, COUNT(*) as count FROM invoices WHERE status = 'overdue' OR (status = 'sent' AND due_date < DATE('now'))").get() as { amount: number; count: number };
  
  return {
    totalCount: total.count,
    paidAmount: paid.amount,
    paidCount: paid.count,
    outstandingAmount: outstanding.amount,
    outstandingCount: outstanding.count,
    overdueAmount: overdue.amount,
    overdueCount: overdue.count,
  };
}
