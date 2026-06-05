import { db } from '@/lib/db/schema';
import { Client } from '@/types';

export interface CreateClientInput {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  user_id?: number;
}

export function getClients(createdBy?: number): Client[] {
  if (createdBy) {
    return db.prepare('SELECT * FROM clients WHERE created_by = ? ORDER BY created_at DESC').all(createdBy) as Client[];
  }
  return db.prepare('SELECT * FROM clients ORDER BY created_at DESC').all() as Client[];
}

export function getClientById(id: number): Client | null {
  return db.prepare('SELECT * FROM clients WHERE id = ?').get(id) as Client | null;
}

export function getClientByUserId(userId: number): Client | null {
  return db.prepare('SELECT * FROM clients WHERE user_id = ?').get(userId) as Client | null;
}

export function createClient(input: CreateClientInput, createdBy: number): Client {
  const stmt = db.prepare(`
    INSERT INTO clients (name, email, phone, company, address, user_id, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    input.name,
    input.email,
    input.phone || null,
    input.company || null,
    input.address || null,
    input.user_id || null,
    createdBy
  );
  return getClientById(result.lastInsertRowid as number)!;
}

export function updateClient(id: number, input: Partial<CreateClientInput>): Client {
  const fields = Object.keys(input)
    .map(key => `${key} = ?`)
    .join(', ');
  const values = Object.values(input);
  values.push(id);
  
  const stmt = db.prepare(`
    UPDATE clients SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
  stmt.run(...values);
  return getClientById(id)!;
}

export function deleteClient(id: number): void {
  db.prepare('DELETE FROM clients WHERE id = ?').run(id);
}

export function getClientStats(clientId: number) {
  const projectCount = db.prepare('SELECT COUNT(*) as count FROM projects WHERE client_id = ?').get(clientId) as { count: number };
  
  const totalRevenue = db.prepare(`
    SELECT COALESCE(SUM(p.amount), 0) as total
    FROM invoices i
    JOIN payments p ON i.id = p.invoice_id
    WHERE i.client_id = ? AND p.status = 'paid'
  `).get(clientId) as { total: number };
  
  const outstanding = db.prepare(`
    SELECT COALESCE(SUM(i.total_amount), 0) as total
    FROM invoices i
    WHERE i.client_id = ? AND i.status IN ('sent', 'overdue')
  `).get(clientId) as { total: number };

  return {
    projectCount: projectCount.count,
    totalRevenue: totalRevenue.total,
    outstanding: outstanding.total,
  };
}
