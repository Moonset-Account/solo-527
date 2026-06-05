import type { NextApiRequest, NextApiResponse } from 'next';
import { createApiHandler, ApiResponse } from '@/lib/api-utils';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'APPROVED', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
});

export default createApiHandler(
  async (req, res, { userId, role }) => {
    const { taskId } = req.query;

    if (req.method === 'GET') {
      const task = await prisma.task.findUnique({
        where: { id: taskId as string },
        include: {
          project: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true, email: true, role: true } },
          creator: { select: { id: true, name: true } },
          comments: {
            include: {
              author: { select: { id: true, name: true, role: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
          files: {
            include: {
              uploadedBy: { select: { id: true, name: true } },
            },
          },
        },
      });

      if (!task) {
        return res.status(404).json({
          success: false,
          error: 'NotFound',
          message: '任务不存在',
        });
      }

      return res.status(200).json({
        success: true,
        data: task,
      });
    }

    if (req.method === 'PATCH') {
      const data = updateTaskSchema.parse(req.body);

      const currentTask = await prisma.task.findUnique({
        where: { id: taskId as string },
        include: { project: true },
      });

      if (!currentTask) {
        return res.status(404).json({
          success: false,
          error: 'NotFound',
          message: '任务不存在',
        });
      }

      if (data.status) {
        if (role === 'SUPPLIER' && currentTask.assigneeId === userId) {
          const allowedTransitions = ['TODO', 'IN_PROGRESS', 'REVIEW'];
          if (!allowedTransitions.includes(data.status)) {
            return res.status(403).json({
              success: false,
              error: 'Forbidden',
              message: '供应商只能更新任务到待办、进行中或待审核状态',
            });
          }
        }
      }

      if (role === 'COUPLE' && data.status) {
        if (data.status !== 'APPROVED' && currentTask.status !== 'REVIEW') {
          return res.status(403).json({
            success: false,
            error: 'Forbidden',
            message: '新人只能确认审核中的任务',
          });
        }
      }

      const updateData: any = { ...data };
      if (data.dueDate) updateData.dueDate = new Date(data.dueDate);
      if (data.status === 'COMPLETED') updateData.completedAt = new Date();
      if (data.status === 'IN_PROGRESS' && !currentTask.startedAt) updateData.startedAt = new Date();

      const task = await prisma.task.update({
        where: { id: taskId as string },
        data: updateData,
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          creator: { select: { id: true, name: true } },
        },
      });

      return res.status(200).json({
        success: true,
        data: task,
        message: '任务更新成功',
      });
    }

    if (req.method === 'DELETE') {
      if (role !== 'ADMIN' && role !== 'PLANNER') {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: '没有权限删除任务',
        });
      }

      await prisma.task.delete({
        where: { id: taskId as string },
      });

      return res.status(200).json({
        success: true,
        message: '任务删除成功',
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
  }
);
