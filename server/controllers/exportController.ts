import type { Request, Response } from 'express';
import { Queue } from 'bullmq';
import { redis } from '../utils/cache';
import { prisma } from '../utils/db';
import type { ExportTaskRequest, ExportTaskStatus } from '@shared/types';

const exportQueue = new Queue('export-tasks', {
  connection: redis,
});

export async function createExportTask(req: Request, res: Response) {
  try {
    const { filters, format } = req.body as ExportTaskRequest;

    const task = await prisma.exportTask.create({
      data: {
        status: 'pending',
        filters: filters as any,
      },
    });

    await exportQueue.add('generate-export', {
      taskId: task.id,
      filters,
      format: format || 'xlsx',
    });

    res.json({
      id: task.id,
      status: 'pending',
      createdAt: task.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Create export task error:', error);
    res.status(500).json({ error: 'Failed to create export task' });
  }
}

export async function getExportStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const task = await prisma.exportTask.findUnique({
      where: { id },
    });

    if (!task) {
      return res.status(404).json({ error: 'Export task not found' });
    }

    const response: ExportTaskStatus = {
      id: task.id,
      status: task.status as any,
      fileUrl: task.fileUrl || undefined,
      createdAt: task.createdAt.toISOString(),
      completedAt: task.completedAt?.toISOString(),
    };

    res.json(response);
  } catch (error) {
    console.error('Get export status error:', error);
    res.status(500).json({ error: 'Failed to get export status' });
  }
}
