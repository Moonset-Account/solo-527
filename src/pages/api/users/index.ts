import type { NextApiRequest, NextApiResponse } from 'next';
import { createApiHandler } from '@/lib/api-utils';
import prisma from '@/lib/prisma';

export default createApiHandler(
  async (req, res, { role }) => {
    if (req.method === 'GET') {
      const { role: roleFilter } = req.query;
      
      const where: any = {};
      
      if (roleFilter) {
        where.role = roleFilter;
      }

      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json({
        success: true,
        data: {
          items: users,
          total: users.length,
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
    requirePermission: 'user:read',
  }
);
