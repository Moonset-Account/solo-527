import type { NextApiRequest, NextApiResponse } from 'next';
import { createApiHandler, ApiResponse } from '@/lib/api-utils';
import prisma from '@/lib/prisma';
import { filterBudgetItemsByRole } from '@/lib/permissions';
import { z } from 'zod';

const budgetSchema = z.object({
  category: z.enum(['VENUE', 'FLORISTRY', 'PHOTOGRAPHY', 'CATERING', 'DRESS', 'MUSIC', 'DECORATION', 'OTHER']),
  description: z.string().min(1, '描述不能为空'),
  estimated: z.number().min(0, '预算不能为负数'),
  actual: z.number().min(0).optional().default(0),
  isInternal: z.boolean().optional().default(false),
  supplierId: z.string().optional().nullable(),
  serviceId: z.string().optional().nullable(),
});

export default createApiHandler(
  async (req, res, { userId, role }) => {
    const { projectId } = req.query;

    if (req.method === 'GET') {
      const budgetItems = await prisma.budgetItem.findMany({
        where: { projectId: projectId as string },
        include: {
          supplier: { select: { id: true, name: true } },
          service: { select: { id: true, name: true } },
        },
        orderBy: { category: 'asc' },
      });

      const filteredItems = filterBudgetItemsByRole(budgetItems, role as any);
      
      const totalEstimated = filteredItems.reduce((sum, item) => sum + Number(item.estimated), 0);
      const totalActual = filteredItems.reduce((sum, item) => sum + Number(item.actual), 0);

      return res.status(200).json({
        success: true,
        data: {
          items: filteredItems,
          summary: {
            totalEstimated,
            totalActual,
            remaining: totalEstimated - totalActual,
          },
        },
      });
    }

    if (req.method === 'POST') {
      if (role !== 'ADMIN' && role !== 'PLANNER') {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: '没有权限添加预算项',
        });
      }

      const data = budgetSchema.parse(req.body);

      const budgetItem = await prisma.budgetItem.create({
        data: {
          ...data,
          projectId: projectId as string,
        },
        include: {
          supplier: { select: { id: true, name: true } },
          service: { select: { id: true, name: true } },
        },
      });

      const project = await prisma.project.findUnique({
        where: { id: projectId as string },
        select: { budgetItems: true },
      });

      if (project) {
        const allItems = project.budgetItems;
        const totalEstimated = allItems.reduce((sum, item) => sum + Number(item.estimated), 0);
        const totalActual = allItems.reduce((sum, item) => sum + Number(item.actual), 0);
        
        await prisma.project.update({
          where: { id: projectId as string },
          data: { totalBudget: totalEstimated, totalSpent: totalActual },
        });
      }

      return res.status(201).json({
        success: true,
        data: budgetItem,
        message: '预算项添加成功',
      });
    }

    return res.status(405).json({
      success: false,
      error: 'MethodNotAllowed',
      message: '不支持的请求方法',
    });
  },
  {
    requirePermission: 'budget:read',
    requireProjectAccess: true,
  }
);
