import type { NextApiRequest, NextApiResponse } from 'next';
import { createApiHandler, ApiResponse } from '@/lib/api-utils';
import prisma from '@/lib/prisma';
import { filterBudgetItemsByRole } from '@/lib/permissions';

export default createApiHandler(
  async (req, res, { userId, role }) => {
    const { projectId } = req.query;

    if (req.method === 'GET') {
      const project = await prisma.project.findUnique({
        where: { id: projectId as string },
        include: {
          manager: { select: { id: true, name: true, email: true } },
          couple: { select: { id: true, name: true, email: true } },
          tasks: {
            include: {
              assignee: { select: { id: true, name: true, email: true } },
              creator: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
          budgetItems: true,
          files: {
            include: {
              uploadedBy: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
          confirmations: {
            orderBy: { createdAt: 'desc' },
          },
          comments: {
            include: {
              author: { select: { id: true, name: true, role: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
          reminders: {
            orderBy: { remindAt: 'asc' },
          },
        },
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'NotFound',
          message: '项目不存在',
        });
      }

      const filteredBudgetItems = filterBudgetItemsByRole(project.budgetItems, role as any);

      return res.status(200).json({
        success: true,
        data: {
          ...project,
          budgetItems: filteredBudgetItems,
        },
      });
    }

    if (req.method === 'PUT') {
      if (role !== 'ADMIN' && role !== 'PLANNER') {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: '没有权限编辑项目',
        });
      }

      const { name, description, weddingDate, venue, status, totalBudget } = req.body;

      const project = await prisma.project.update({
        where: { id: projectId as string },
        data: {
          name,
          description,
          weddingDate: weddingDate ? new Date(weddingDate) : null,
          venue,
          status,
          totalBudget,
        },
        include: {
          manager: { select: { id: true, name: true, email: true } },
          couple: { select: { id: true, name: true, email: true } },
        },
      });

      return res.status(200).json({
        success: true,
        data: project,
        message: '项目更新成功',
      });
    }

    if (req.method === 'DELETE') {
      if (role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: '只有管理员可以删除项目',
        });
      }

      await prisma.project.delete({
        where: { id: projectId as string },
      });

      return res.status(200).json({
        success: true,
        message: '项目删除成功',
      });
    }

    return res.status(405).json({
      success: false,
      error: 'MethodNotAllowed',
      message: '不支持的请求方法',
    });
  },
  {
    requirePermission: 'project:read',
    requireProjectAccess: true,
  }
);
