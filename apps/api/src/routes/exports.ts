import { Router, Request, Response } from 'express';
import fs from 'fs';
import { validateBody, validateQuery } from '../middleware/validate';
import { CreateExportTaskSchema, ExportTaskQuerySchema } from '@seat-platform/shared';
import * as exportService from '../services/exportService';
import { config } from '../config';

const router = Router();

router.get('/', validateQuery(ExportTaskQuerySchema), async (req: Request, res: Response) => {
  const query = req.query as unknown as Parameters<typeof exportService.listExportTasks>[0];
  const result = await exportService.listExportTasks(query);
  res.json(result);
});

router.get('/:id', async (req: Request, res: Response) => {
  const task = await exportService.getExportTaskById(req.params.id);
  if (!task) {
    return res.status(404).json({ message: '导出任务不存在' });
  }
  res.json(task);
});

router.post('/', validateBody(CreateExportTaskSchema), async (req: Request, res: Response) => {
  const task = await exportService.createExportTask(req.body);
  res.status(201).json(task);
});

router.get('/:id/download', async (req: Request, res: Response) => {
  const task = await exportService.getExportTaskById(req.params.id);
  if (!task) {
    return res.status(404).json({ message: '导出任务不存在' });
  }
  if (task.status !== 'completed' || !task.filePath) {
    return res.status(400).json({ message: `任务状态: ${task.status}，暂不可下载` });
  }

  const filePath = exportService.getExportFilePath(task.filePath);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: '导出文件不存在' });
  }

  res.download(filePath, `${task.name}_${task.type}.csv`, (err) => {
    if (err) {
      console.error('[Export] Download error:', err);
    }
  });
});

export default router;
