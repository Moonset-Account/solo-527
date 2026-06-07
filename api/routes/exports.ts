import { Router, type Request, type Response } from 'express';
import type { ExportTask, ExportFormat } from '../../shared/types.js';

const router = Router();

const exportTasks = new Map<string, ExportTask>();

function randomId(): string {
  return `export_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

router.post('/', (req: Request, res: Response): void => {
  const { viewType, filters, format } = req.body as {
    viewType: string;
    filters: Record<string, unknown>;
    format: ExportFormat;
  };

  if (!viewType || !format) {
    res.status(400).json({ error: 'Missing viewType or format' });
    return;
  }

  const task: ExportTask = {
    id: randomId(),
    viewType,
    filters,
    format,
    status: 'queued',
    createdAt: new Date().toISOString(),
  };

  exportTasks.set(task.id, task);

  setTimeout(() => {
    const t = exportTasks.get(task.id);
    if (t) {
      t.status = 'processing';
      setTimeout(() => {
        const t2 = exportTasks.get(task.id);
        if (t2) {
          t2.status = 'completed';
          t2.completedAt = new Date().toISOString();
          t2.downloadUrl = `/api/exports/${t2.id}/download`;
        }
      }, 2000 + Math.random() * 3000);
    }
  }, 1000);

  res.status(201).json(task);
});

router.get('/', (_req: Request, res: Response): void => {
  const tasks = Array.from(exportTasks.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  res.json(tasks);
});

router.get('/:id/download', (req: Request, res: Response): void => {
  const task = exportTasks.get(req.params.id);
  if (!task) {
    res.status(404).json({ error: 'Export task not found' });
    return;
  }
  if (task.status !== 'completed') {
    res.status(400).json({ error: 'Export not ready yet' });
    return;
  }

  const headers = ['ID', '视图类型', '创建时间', '状态'];
  const row = [task.id, task.viewType, task.createdAt, task.status];
  const csv = [headers.join(','), row.join(',')].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=export_${task.id}.csv`);
  res.send(csv);
});

export default router;
