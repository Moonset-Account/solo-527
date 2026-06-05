import { db } from '@/lib/db/schema';
import { TimeEntry } from '@/types';

export interface CreateTimeEntryInput {
  task_id: number;
  project_id: number;
  hours: number;
  description?: string;
  entry_date: string;
  billable?: boolean;
}

export function getTimeEntriesByProject(projectId: number): (TimeEntry & { task_title?: string; user_name?: string })[] {
  return db.prepare(`
    SELECT te.*, t.title as task_title, u.name as user_name
    FROM time_entries te
    JOIN tasks t ON te.task_id = t.id
    JOIN users u ON te.user_id = u.id
    WHERE te.project_id = ?
    ORDER BY te.entry_date DESC, te.created_at DESC
  `).all(projectId) as (TimeEntry & { task_title?: string; user_name?: string })[];
}

export function getTimeEntriesByUser(userId: number): (TimeEntry & { task_title?: string; project_name?: string })[] {
  return db.prepare(`
    SELECT te.*, t.title as task_title, p.name as project_name
    FROM time_entries te
    JOIN tasks t ON te.task_id = t.id
    JOIN projects p ON te.project_id = p.id
    WHERE te.user_id = ?
    ORDER BY te.entry_date DESC, te.created_at DESC
  `).all(userId) as (TimeEntry & { task_title?: string; project_name?: string })[];
}

export function getTimeEntryById(id: number): TimeEntry | null {
  return db.prepare('SELECT * FROM time_entries WHERE id = ?').get(id) as TimeEntry | null;
}

export function createTimeEntry(input: CreateTimeEntryInput, userId: number): TimeEntry {
  const stmt = db.prepare(`
    INSERT INTO time_entries (task_id, user_id, project_id, hours, description, entry_date, billable)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    input.task_id,
    userId,
    input.project_id,
    input.hours,
    input.description || null,
    input.entry_date,
    input.billable !== false ? 1 : 0
  );
  return getTimeEntryById(result.lastInsertRowid as number)!;
}

export function updateTimeEntry(id: number, input: Partial<CreateTimeEntryInput>): TimeEntry {
  const fields = Object.keys(input)
    .map(key => {
      if (key === 'billable') return `${key} = ?`;
      return `${key} = ?`;
    })
    .join(', ');
  
  const values = Object.entries(input).map(([key, value]) => {
    if (key === 'billable') return value ? 1 : 0;
    return value;
  });
  values.push(id);
  
  const stmt = db.prepare(`
    UPDATE time_entries SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
  stmt.run(...values);
  return getTimeEntryById(id)!;
}

export function deleteTimeEntry(id: number): void {
  db.prepare('DELETE FROM time_entries WHERE id = ?').run(id);
}

export function getTotalHoursByProject(projectId: number): { total: number; billable: number } {
  const result = db.prepare(`
    SELECT 
      COALESCE(SUM(hours), 0) as total,
      COALESCE(SUM(CASE WHEN billable = 1 THEN hours ELSE 0 END), 0) as billable
    FROM time_entries
    WHERE project_id = ?
  `).get(projectId) as { total: number; billable: number };
  return result;
}

export function getTotalHoursByUser(userId: number, startDate?: string, endDate?: string): { total: number; billable: number } {
  let query = `
    SELECT 
      COALESCE(SUM(hours), 0) as total,
      COALESCE(SUM(CASE WHEN billable = 1 THEN hours ELSE 0 END), 0) as billable
    FROM time_entries
    WHERE user_id = ?
  `;
  const params: any[] = [userId];
  
  if (startDate) {
    query += ' AND entry_date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND entry_date <= ?';
    params.push(endDate);
  }
  
  return db.prepare(query).get(...params) as { total: number; billable: number };
}

export function getHoursByDateRange(userId: number, startDate: string, endDate: string): any[] {
  return db.prepare(`
    SELECT 
      entry_date,
      COALESCE(SUM(hours), 0) as hours,
      COALESCE(SUM(CASE WHEN billable = 1 THEN hours ELSE 0 END), 0) as billable_hours
    FROM time_entries
    WHERE user_id = ? AND entry_date BETWEEN ? AND ?
    GROUP BY entry_date
    ORDER BY entry_date
  `).all(userId, startDate, endDate);
}
