import { QueueTask, TaskType } from '../types';
import { generateStandardExcel, generateStandardPDF, generateCSV } from './exportService';
import { etlEngine } from './etlEngine';

const STORAGE_KEY = 'saas_analytics_task_queue';
const MAX_CONCURRENT = 2;
const TASK_TTL = 24 * 60 * 60 * 1000;

export type TaskHandler = (task: QueueTask, onProgress?: (progress: number, message: string) => void) => Promise<any>;

class TaskQueue {
  private tasks: Map<string, QueueTask> = new Map();
  private runningCount = 0;
  private listeners: Set<(tasks: QueueTask[]) => void> = new Set();
  private handlers: Map<TaskType, TaskHandler> = new Map();

  constructor() {
    this.loadFromStorage();
    this.registerDefaultHandlers();
    this.startProcessingLoop();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored) as QueueTask[];
        const now = Date.now();
        data.forEach(task => {
          const age = now - new Date(task.createdAt).getTime();
          if (age < TASK_TTL) {
            if (task.status === 'running') {
              task.status = 'failed';
              task.error = '任务在处理中断开连接';
            }
            this.tasks.set(task.id, task);
          }
        });
      }
    } catch (e) {
      console.warn('[TaskQueue] 加载任务历史失败', e);
    }
  }

  private saveToStorage() {
    try {
      const tasks = [...this.tasks.values()].slice(0, 50);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.warn('[TaskQueue] 保存任务历史失败', e);
    }
  }

  private registerDefaultHandlers() {
    this.handlers.set('etl', async (task, onProgress) => {
      const metadata = task.metadata as any;
      const result = await etlEngine.runFullPipeline(
        metadata.filters,
        metadata.dateRange,
        (_stage, progress, message) => onProgress?.(progress, message)
      );
      return result;
    });

    this.handlers.set('export_xlsx', async (task, onProgress) => {
      const metadata = task.metadata as any;
      onProgress?.(30, '正在生成 Excel...');
      const blob = generateStandardExcel(metadata.aggregatedResult, metadata.filters, metadata.dateRange);
      onProgress?.(100, '生成完成');
      return {
        blob,
        filename: `留存分析报告_${Date.now()}.xlsx`,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    });

    this.handlers.set('export_pdf', async (task, onProgress) => {
      const metadata = task.metadata as any;
      onProgress?.(30, '正在生成 PDF...');
      const blob = generateStandardPDF(metadata.aggregatedResult, metadata.filters, metadata.dateRange);
      onProgress?.(100, '生成完成');
      return {
        blob,
        filename: `留存分析报告_${Date.now()}.pdf`,
        mimeType: 'application/pdf',
      };
    });

    this.handlers.set('export_csv', async (task, onProgress) => {
      const metadata = task.metadata as any;
      onProgress?.(30, '正在生成 CSV...');
      const blob = generateCSV(metadata.aggregatedResult, metadata.filters, metadata.dateRange);
      onProgress?.(100, '生成完成');
      return {
        blob,
        filename: `留存分析报告_${Date.now()}.csv`,
        mimeType: 'text/csv;charset=utf-8',
      };
    });

    this.handlers.set('aggregation', async (task, onProgress) => {
      const metadata = task.metadata as any;
      const result = await etlEngine.runFullPipeline(
        metadata.filters,
        metadata.dateRange,
        (_stage, progress, message) => onProgress?.(progress, message)
      );
      return result;
    });
  }

  private startProcessingLoop() {
    setInterval(() => this.processQueue(), 1000);
  }

  private async processQueue() {
    if (this.runningCount >= MAX_CONCURRENT) return;

    const queuedTasks = [...this.tasks.values()]
      .filter(t => t.status === 'queued')
      .sort((a, b) => {
        const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
        const aPriority = (a as any).priority || 'medium';
        const bPriority = (b as any).priority || 'medium';
        if (priorityOrder[aPriority] !== priorityOrder[bPriority]) {
          return priorityOrder[aPriority] - priorityOrder[bPriority];
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

    for (const task of queuedTasks) {
      if (this.runningCount >= MAX_CONCURRENT) break;
      await this.processTask(task);
    }
  }

  private async processTask(task: QueueTask) {
    const taskType = (task as any).type as TaskType;
    const handler = this.handlers.get(taskType);
    if (!handler) {
      this.updateTask(task.id, { status: 'failed', error: `未找到任务处理器: ${task.type}` });
      return;
    }

    this.runningCount++;
    this.updateTask(task.id, {
      status: 'running',
      startedAt: new Date().toISOString(),
      progress: 0,
    });

    try {
      const result = await handler(task, (progress, message) => {
        this.updateTask(task.id, { progress, error: message });
      });

      this.updateTask(task.id, {
        status: 'completed',
        completedAt: new Date().toISOString(),
        progress: 100,
        result,
      });

      if (result?.blob) {
        this.triggerDownload(result.blob, result.filename, result.mimeType);
      }
    } catch (error: any) {
      this.updateTask(task.id, {
        status: 'failed',
        failedAt: new Date().toISOString(),
        error: error.message || '任务执行失败',
      });
    } finally {
      this.runningCount--;
      this.notifyListeners();
    }
  }

  private triggerDownload(blob: Blob, filename: string, mimeType: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.type = mimeType;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  private updateTask(id: string, updates: Partial<QueueTask>) {
    const task = this.tasks.get(id);
    if (task) {
      const updated = { ...task, ...updates } as QueueTask;
      this.tasks.set(id, updated);
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  private notifyListeners() {
    const tasks = this.getTasks();
    this.listeners.forEach(fn => fn(tasks));
  }

  subscribe(listener: (tasks: QueueTask[]) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getTasks(): QueueTask[] {
    return [...this.tasks.values()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getTask(id: string): QueueTask | undefined {
    return this.tasks.get(id);
  }

  createTask(
    type: TaskType,
    name: string,
    metadata: Record<string, any>,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): QueueTask {
    const task: any = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      name,
      status: 'queued',
      priority,
      createdAt: new Date().toISOString(),
      progress: 0,
      metadata,
    };

    this.tasks.set(task.id, task);
    this.saveToStorage();
    this.notifyListeners();

    console.log(`[TaskQueue] 任务已创建: ${task.id} (${type}) - ${name}`);
    return task as QueueTask;
  }

  cancelTask(id: string): boolean {
    const task = this.tasks.get(id);
    if (task && (task.status === 'queued' || task.status === 'pending')) {
      this.updateTask(id, { status: 'cancelled' } as any);
      return true;
    }
    return false;
  }

  retryTask(id: string): boolean {
    const task = this.tasks.get(id) as any;
    if (task && (task.status === 'failed' || task.status === 'cancelled')) {
      this.createTask(
        task.type,
        `${task.name} (重试)`,
        task.metadata || {},
        task.priority
      );
      return true;
    }
    return false;
  }

  clearCompleted(): number {
    let count = 0;
    this.tasks.forEach((task, id) => {
      if (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') {
        this.tasks.delete(id);
        count++;
      }
    });
    this.saveToStorage();
    this.notifyListeners();
    return count;
  }

  registerHandler(type: TaskType, handler: TaskHandler) {
    this.handlers.set(type, handler);
  }

  getStats() {
    const stats = {
      total: this.tasks.size,
      queued: 0,
      running: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    };
    this.tasks.forEach(task => {
      stats[task.status as keyof typeof stats]++;
    });
    return stats;
  }
}

export const taskQueue = new TaskQueue();
