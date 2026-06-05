import type { NextApiRequest, NextApiResponse } from 'next';
import { createApiHandler } from '@/lib/api-utils';
import prisma from '@/lib/prisma';
import { filterBudgetItemsByRole } from '@/lib/permissions';

export default createApiHandler(
  async (req, res, { userId, role }) => {
    if (req.method === 'GET') {
      const { status, projectId } = req.query;

      const where: any = {};
      
      if (status) {
        where.status = status;
      }
      if (projectId) {
        where.projectId = projectId;
      }

      if (role === 'PLANNER') {
        where.project = {
          managerId: userId,
        };
      } else if (role === 'COUPLE') {
        where.project = {
          coupleId: userId,
        };
      } else if (role === 'SUPPLIER') {
        where.uploadedById = userId;
      }

      const files = await prisma.projectFile.findMany({
        where,
        include: {
          project: { select: { id: true, name: true } },
          uploadedBy: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json({
        success: true,
        data: {
          items: files,
          total: files.length,
        },
      });
    }

    return res.status(405).json({
      success: false,
      error: 'MethodNotAllowed',
      message: '不支持的请求方法',
    });
  },
  {
    requirePermission: 'file:read',
  }
);
