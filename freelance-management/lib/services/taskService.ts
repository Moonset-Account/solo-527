import { db } from '@/lib/db/schema';
import { Task, TaskStatus } from '@/types';
import { notifyTaskAssigned } from './notificationService';

export interface CreateTaskInput {
  project_id: number;
  title: string;
  description?: string;
  status?: TaskStatus;
  assignee_id?: number;
  estimated_hours?: number;
  due_date?: string;
  order_index?: number;
}

export function getTasksByProject(projectId: number): Task[] {
  return db.prepare('SELECT * FROM tasks WHERE project_id = ? ORDER BY order_index ASC, id ASC').all(projectId) as Task[];
}

export function getTaskById(id: number): (Task & { project_name?: string }) | null {
  return db.prepare(`
    SELECT t.*, p.name as project_name
    FROM tasks t
    JOIN projects p ON t.project_id = p.id
    WHERE t.id = ?
  `).get(id) as (Task & { project_name?: string }) | null;
}

export function getTasksByAssignee(userId: number): Task[] {
  return db.prepare(`
    SELECT t.*, p.name as project_name
    FROM tasks t
    JOIN projects p ON t.project_id = p.id
    WHERE t.assignee_id = ?
    ORDER BY t.due_date ASC
  `).all(userId) as Task[];
}

export function createTask(input: CreateTaskInput, createdBy: number): Task {
  const maxOrder = db.prepare('SELECT COALESCE(MAX(order_index), -1) as max FROM tasks WHERE project_id = ?').get(input.project_id) as { max: number };
  
  const stmt = db.prepare(`
    INSERT INTO tasks (project_id, title, description, status, assignee_id, estimated_hours, due_date, order_index, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    input.project_id,
    input.title,
    input.description || null,
    input.status || TaskStatus.TODO,
    input.assignee_id || null,
    input.estimated_hours || null,
    input.due_date || null,
    input.order_index ?? (maxOrder.max + 1),
    createdBy
  );
  
  const task = getTaskById(result.lastInsertRowid as number)!;
  
  if (input.assignee_id && task.project_name) {
    notifyTaskAssigned(task.id, task.title, task.project_name, input.assignee_id);
  }
  
  return task as Task;
}

export function updateTask(id: number, input: Partial<CreateTaskInput>): Task {
  const oldTask = getTaskById(id);
  const fields = Object.keys(input)
    .map(key => `${key} = ?`)
    .join(', ');
  const values = Object.values(input);
  values.push(id);
  
  const stmt = db.prepare(`
    UPDATE tasks SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
  stmt.run(...values);
  
  const updatedTask = getTaskById(id)!;
  
  if (input.assignee_id && oldTask && input.assignee_id !== oldTask.assignee_id && updatedTask.project_name) {
    notifyTaskAssigned(updatedTask.id, updatedTask.title, updatedTask.project_name, input.assignee_id);
  }
  
  return updatedTask as Task;
}

export function deleteTask(id: number): void {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
}

export function updateTaskStatus(id: number, status: TaskStatus): Task {
  return updateTask(id, { status });
}

export function reorderTasks(projectId: number, taskIds: number[]): void {
  const transaction = db.transaction((ids: number[]) => {
    ids.forEach((taskId, index) => {
      db.prepare('UPDATE tasks SET order_index = ? WHERE id = ? AND project_id = ?').run(index, taskId, projectId);
    });
  });
  transaction(taskIds);
}

export function getTaskStatsByProject(projectId: number) {
  const total = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE project_id = ?').get(projectId) as { count: number };
  const done = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE project_id = ? AND status = 'done'").get(projectId) as { count: number };
  const inProgress = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE project_id = ? AND status = 'in_progress'").get(projectId) as { count: number };
  const review = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE project_id = ? AND status = 'review'").get(projectId) as { count: number };
  
  return {
    total: total.count,
    done: done.count,
    inProgress: inProgress.count,
    review: review.count,
    todo: total.count - done.count - inProgress.count - review.count,
  };
}
