import type { NextApiRequest, NextApiResponse } from 'next';
import { createApiHandler } from '@/lib/api-utils';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const budgetItemSchema = z.object({
  category: z.enum(['VENUE', 'FLORISTRY', 'PHOTOGRAPHY', 'CATERING', 'DRESS', 'MUSIC', 'DECORATION', 'OTHER']).optional(),
  description: z.string().optional(),
  estimated: z.number().min(0).optional(),
  actual: z.number().min(0).optional(),
  isInternal: z.boolean().optional(),
  supplierId: z.string().optional().nullable(),
});

export default createApiHandler(
  async (req, res, { role }) => {
    const { budgetId } = req.query;

    if (req.method === 'PATCH') {
      if (role !== 'ADMIN' && role !== 'PLANNER') {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: '没有权限编辑预算',
        });
      }

      const data = budgetItemSchema.parse(req.body);
      
      const budgetItem = await prisma.budgetItem.update({
        where: { id: budgetId as string },
        data,
      });

      return res.status(200).json({
        success: true,
        data: budgetItem,
        message: '预算项更新成功',
      });
    }

    return res.status(405).json({
      success: false,
      error: 'MethodNotAllowed',
      message: '不支持的请求方法',
    });
  },
  {
    requirePermission: 'budget:update',
  }
);
