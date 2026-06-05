import { db } from '@/lib/db/schema';
import { Quote, QuoteItem, QuoteStatus } from '@/types';

export interface CreateQuoteInput {
  project_id: number;
  client_id: number;
  title: string;
  description?: string;
  amount: number;
  tax?: number;
  discount?: number;
  total_amount: number;
  valid_until?: string;
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
  }>;
}

export function generateQuoteNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const count = db.prepare("SELECT COUNT(*) as count FROM quotes WHERE strftime('%Y', created_at) = ?").get(year.toString()) as { count: number };
  return `Q-${year}-${String(count.count + 1).padStart(3, '0')}`;
}

export function getQuotes(userId: number, role: string): (Quote & { client_name?: string; project_name?: string })[] {
  if (role === 'client') {
    return db.prepare(`
      SELECT q.*, c.name as client_name, p.name as project_name
      FROM quotes q
      JOIN clients c ON q.client_id = c.id
      JOIN projects p ON q.project_id = p.id
      WHERE c.user_id = ?
      ORDER BY q.created_at DESC
    `).all(userId) as (Quote & { client_name?: string; project_name?: string })[];
  }
  return db.prepare(`
    SELECT q.*, c.name as client_name, p.name as project_name
    FROM quotes q
    JOIN clients c ON q.client_id = c.id
    JOIN projects p ON q.project_id = p.id
    ORDER BY q.created_at DESC
  `).all() as (Quote & { client_name?: string; project_name?: string })[];
}

export function getQuoteById(id: number): (Quote & { client_name?: string; project_name?: string }) | null {
  return db.prepare(`
    SELECT q.*, c.name as client_name, p.name as project_name
    FROM quotes q
    JOIN clients c ON q.client_id = c.id
    JOIN projects p ON q.project_id = p.id
    WHERE q.id = ?
  `).get(id) as (Quote & { client_name?: string; project_name?: string }) | null;
}

export function getQuoteItems(quoteId: number): QuoteItem[] {
  return db.prepare('SELECT * FROM quote_items WHERE quote_id = ?').all(quoteId) as QuoteItem[];
}

export function createQuote(input: CreateQuoteInput, createdBy: number): Quote {
  const quoteNumber = generateQuoteNumber();
  
  const stmt = db.prepare(`
    INSERT INTO quotes (project_id, client_id, quote_number, title, description, amount, tax, discount, total_amount, status, valid_until, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    input.project_id,
    input.client_id,
    quoteNumber,
    input.title,
    input.description || null,
    input.amount,
    input.tax || 0,
    input.discount || 0,
    input.total_amount,
    QuoteStatus.DRAFT,
    input.valid_until || null,
    createdBy
  );
  
  const quoteId = result.lastInsertRowid as number;
  
  const insertItem = db.prepare(`
    INSERT INTO quote_items (quote_id, description, quantity, unit_price, amount)
    VALUES (?, ?, ?, ?, ?)
  `);
  input.items.forEach(item => {
    insertItem.run(quoteId, item.description, item.quantity, item.unit_price, item.amount);
  });
  
  return getQuoteById(quoteId)! as Quote;
}

export function updateQuote(id: number, input: Partial<CreateQuoteInput>): Quote {
  const fields = Object.keys(input)
    .filter(key => key !== 'items')
    .map(key => `${key} = ?`)
    .join(', ');
  const values = Object.values(input).filter(v => typeof v !== 'object');
  values.push(id);
  
  if (fields) {
    const stmt = db.prepare(`UPDATE quotes SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
    stmt.run(...values);
  }
  
  if (input.items) {
    db.prepare('DELETE FROM quote_items WHERE quote_id = ?').run(id);
    const insertItem = db.prepare(`
      INSERT INTO quote_items (quote_id, description, quantity, unit_price, amount)
      VALUES (?, ?, ?, ?, ?)
    `);
    input.items.forEach(item => {
      insertItem.run(id, item.description, item.quantity, item.unit_price, item.amount);
    });
  }
  
  return getQuoteById(id)! as Quote;
}

export function sendQuote(id: number): Quote {
  db.prepare('UPDATE quotes SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(QuoteStatus.SENT, id);
  return getQuoteById(id)! as Quote;
}

export function acceptQuote(id: number): Quote {
  db.prepare('UPDATE quotes SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(QuoteStatus.ACCEPTED, id);
  return getQuoteById(id)! as Quote;
}

export function rejectQuote(id: number): Quote {
  db.prepare('UPDATE quotes SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(QuoteStatus.REJECTED, id);
  return getQuoteById(id)! as Quote;
}

export function deleteQuote(id: number): void {
  db.prepare('DELETE FROM quotes WHERE id = ?').run(id);
}

export function getQuoteTemplates(): any[] {
  return [
    {
      id: 'brand-design',
      name: '品牌设计报价模板',
      items: [
        { description: 'Logo设计（3套方案）', quantity: 1, unit_price: 15000 },
        { description: 'VI基础系统设计', quantity: 1, unit_price: 20000 },
        { description: '品牌手册设计', quantity: 1, unit_price: 15000 },
      ],
    },
    {
      id: 'web-design',
      name: '网站设计报价模板',
      items: [
        { description: '需求分析与原型设计', quantity: 1, unit_price: 8000 },
        { description: 'UI界面设计', quantity: 10, unit_price: 2000 },
        { description: '响应式适配', quantity: 1, unit_price: 5000 },
      ],
    },
    {
      id: 'packaging-design',
      name: '包装设计报价模板',
      items: [
        { description: '市场调研分析', quantity: 1, unit_price: 3000 },
        { description: '包装设计方案', quantity: 3, unit_price: 5000 },
        { description: '设计源文件交付', quantity: 1, unit_price: 2000 },
      ],
    },
  ];
}
