import type { NextApiRequest, NextApiResponse } from 'next';
import { createApiHandler, ApiResponse } from '@/lib/api-utils';
import prisma from '@/lib/prisma';

export default createApiHandler(
  async (req, res, { userId, role }) => {
    const { projectId } = req.query;

    if (req.method === 'GET') {
      const confirmations = await prisma.confirmation.findMany({
        where: { projectId: projectId as string },
        include: {
          files: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json({
        success: true,
        data: confirmations,
      });
    }

    if (req.method === 'POST') {
      if (role !== 'ADMIN' && role !== 'PLANNER') {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: '没有权限创建确认单',
        });
      }

      const { title, content, fileIds } = req.body;

      const confirmation = await prisma.confirmation.create({
        data: {
          title,
          content,
          projectId: projectId as string,
          files: fileIds ? {
            connect: fileIds.map((id: string) => ({ id })),
          } : undefined,
        },
        include: {
          files: true,
        },
      });

      return res.status(201).json({
        success: true,
        data: confirmation,
        message: '确认单创建成功',
      });
    }

    return res.status(405).json({
      success: false,
      error: 'MethodNotAllowed',
      message: '不支持的请求方法',
    });
  },
  {
    requirePermission: 'confirmation:read',
    requireProjectAccess: true,
  }
);
