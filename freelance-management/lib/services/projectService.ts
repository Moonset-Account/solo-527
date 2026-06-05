import { db } from '@/lib/db/schema';
import { Project, ProjectStatus, Role } from '@/types';
import { notifyProjectStatusChange } from './notificationService';

export interface CreateProjectInput {
  name: string;
  description?: string;
  client_id: number;
  status?: ProjectStatus;
  start_date?: string;
  end_date?: string;
  budget?: number;
  hourly_rate?: number;
}

export function getProjects(userId: number, role: Role): Project[] {
  if (role === Role.CLIENT) {
    const projects = db.prepare(`
      SELECT p.id, p.name, p.description, p.client_id, p.status, p.start_date, p.end_date, p.created_by, p.created_at, p.updated_at
      FROM projects p
      JOIN clients c ON p.client_id = c.id
      WHERE c.user_id = ?
      ORDER BY p.created_at DESC
    `).all(userId) as Project[];
    return projects;
  }
  return db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all() as Project[];
}

export function getProjectById(id: number): (Project & { client_name?: string }) | null {
  return db.prepare(`
    SELECT p.*, c.name as client_name
    FROM projects p
    JOIN clients c ON p.client_id = c.id
    WHERE p.id = ?
  `).get(id) as (Project & { client_name?: string }) | null;
}

export function createProject(input: CreateProjectInput, createdBy: number): Project {
  const stmt = db.prepare(`
    INSERT INTO projects (name, description, client_id, status, start_date, end_date, budget, hourly_rate, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    input.name,
    input.description || null,
    input.client_id,
    input.status || ProjectStatus.DRAFT,
    input.start_date || null,
    input.end_date || null,
    input.budget || null,
    input.hourly_rate || null,
    createdBy
  );
  
  const projectId = result.lastInsertRowid as number;
  
  db.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)')
    .run(projectId, createdBy, 'owner');
  
  return getProjectById(projectId)! as Project;
}

export function updateProject(id: number, input: Partial<CreateProjectInput>): Project {
  const oldProject = getProjectById(id);
  const fields = Object.keys(input)
    .map(key => `${key} = ?`)
    .join(', ');
  const values = Object.values(input);
  values.push(id);
  
  const stmt = db.prepare(`
    UPDATE projects SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
  stmt.run(...values);
  
  const updatedProject = getProjectById(id)!;
  
  if (input.status && oldProject && input.status !== oldProject.status) {
    const client = db.prepare('SELECT user_id FROM clients WHERE id = ?').get(updatedProject.client_id) as any;
    const recipientIds = [updatedProject.created_by];
    if (client && client.user_id) {
      recipientIds.push(client.user_id);
    }
    notifyProjectStatusChange(id, updatedProject.name, input.status, recipientIds);
  }
  
  return updatedProject as Project;
}

export function deleteProject(id: number): void {
  db.prepare('DELETE FROM projects WHERE id = ?').run(id);
}

export function getProjectProgress(projectId: number) {
  const tasks = db.prepare('SELECT status FROM tasks WHERE project_id = ?').all(projectId) as { status: string }[];
  if (tasks.length === 0) return 0;
  
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  return Math.round((completedTasks / tasks.length) * 100);
}

export function getProjectStats() {
  const total = db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number };
  const inProgress = db.prepare("SELECT COUNT(*) as count FROM projects WHERE status = 'in_progress'").get() as { count: number };
  const completed = db.prepare("SELECT COUNT(*) as count FROM projects WHERE status = 'completed'").get() as { count: number };
  const pending = db.prepare("SELECT COUNT(*) as count FROM projects WHERE status = 'pending_approval'").get() as { count: number };
  
  return {
    total: total.count,
    inProgress: inProgress.count,
    completed: completed.count,
    pending: pending.count,
  };
}

export function getProjectMembers(projectId: number) {
  return db.prepare(`
    SELECT u.id, u.name, u.email, u.role, pm.role as project_role
    FROM project_members pm
    JOIN users u ON pm.user_id = u.id
    WHERE pm.project_id = ?
  `).all(projectId);
}

export function addProjectMember(projectId: number, userId: number, role = 'member') {
  db.prepare('INSERT OR IGNORE INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)')
    .run(projectId, userId, role);
}

export function removeProjectMember(projectId: number, userId: number) {
  db.prepare('DELETE FROM project_members WHERE project_id = ? AND user_id = ?').run(projectId, userId);
}
