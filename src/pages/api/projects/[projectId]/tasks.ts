import type { NextApiRequest, NextApiResponse } from 'next';
import { createApiHandler, ApiResponse } from '@/lib/api-utils';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const taskSchema = z.object({
  title: z.string().min(1, '任务标题不能为空'),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'APPROVED', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
});

export default createApiHandler(
  async (req, res, { userId, role }) => {
    const { projectId } = req.query;

    if (req.method === 'GET') {
      const { status, assigneeId, priority } = req.query;

      const where: any = { projectId: projectId as string };

      if (status) where.status = status;
      if (assigneeId) where.assigneeId = assigneeId;
      if (priority) where.priority = priority;

      const tasks = await prisma.task.findMany({
        where,
        include: {
          assignee: { select: { id: true, name: true, email: true, role: true } },
          creator: { select: { id: true, name: true } },
        },
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
        ],
      });

      return res.status(200).json({
        success: true,
        data: tasks,
      });
    }

    if (req.method === 'POST') {
      if (role === 'COUPLE') {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: '新人不能创建任务',
        });
      }

      const data = taskSchema.parse(req.body);

      const task = await prisma.task.create({
        data: {
          ...data,
          projectId: projectId as string,
          creatorId: userId,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          status: data.status || 'TODO',
          priority: data.priority || 'MEDIUM',
        },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          creator: { select: { id: true, name: true } },
        },
      });

      return res.status(201).json({
        success: true,
        data: task,
        message: '任务创建成功',
      });
    }

    return res.status(405).json({
      success: false,
      error: 'MethodNotAllowed',
      message: '不支持的请求方法',
    });
  },
  {
    requirePermission: 'task:read',
    requireProjectAccess: true,
  }
);
