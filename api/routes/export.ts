import { Router } from 'express';
import type { Request, Response } from 'express';
import {
  createExportTask,
  getTaskStatus,
  getExportFile,
  listTasks,
} from '../services/exportWorker.js';
import type { ExportFormat } from '../services/exportWorker.js';

const router = Router();

router.post('/create', (req: Request, res: Response) => {
  try {
    const { format = 'xlsx', ...params } = req.body;
    const task = createExportTask(format as ExportFormat, params);
    res.json({ taskId: task.taskId, status: task.status });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/tasks', (req: Request, res: Response) => {
  res.json(listTasks());
});

router.get('/:taskId/status', (req: Request, res: Response) => {
  const { taskId } = req.params;
  const task = getTaskStatus(taskId);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  res.json(task);
});

router.get('/:taskId/download', (req: Request, res: Response) => {
  const { taskId } = req.params;
  const file = getExportFile(taskId);
  if (!file) {
    res.status(404).json({ error: 'File not found or not ready' });
    return;
  }
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.fileName)}"`);
  res.setHeader('Content-Type', 'application/octet-stream');
  res.send(file.buffer);
});

export default router;
