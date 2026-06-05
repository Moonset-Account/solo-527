import type { NextApiRequest, NextApiResponse } from 'next';
import { createApiHandler } from '@/lib/api-utils';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const fileStatusSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
});

export default createApiHandler(
  async (req, res, { userId, role }) => {
    const { fileId } = req.query;

    if (req.method === 'PATCH') {
      if (role !== 'ADMIN' && role !== 'PLANNER') {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: '没有权限审批文件',
        });
      }

      const data = fileStatusSchema.parse(req.body);
      
      const file = await prisma.projectFile.update({
        where: { id: fileId as string },
        data: { status: data.status },
      });

      return res.status(200).json({
        success: true,
        data: file,
        message: '文件状态更新成功',
      });
    }

    return res.status(405).json({
      success: false,
      error: 'MethodNotAllowed',
      message: '不支持的请求方法',
    });
  },
  {
    requirePermission: 'file:update',
  }
);
