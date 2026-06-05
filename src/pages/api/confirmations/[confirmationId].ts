import type { NextApiRequest, NextApiResponse } from 'next';
import { createApiHandler, ApiResponse } from '@/lib/api-utils';
import prisma from '@/lib/prisma';

export default createApiHandler(
  async (req, res, { userId, role }) => {
    const { confirmationId } = req.query;

    if (req.method === 'PATCH') {
      const { status } = req.body;

      const confirmation = await prisma.confirmation.findUnique({
        where: { id: confirmationId as string },
        include: { project: { select: { coupleId: true } } },
      });

      if (!confirmation) {
        return res.status(404).json({
          success: false,
          error: 'NotFound',
          message: '确认单不存在',
        });
      }

      if (role === 'COUPLE') {
        if (confirmation.project.coupleId !== userId) {
          return res.status(403).json({
            success: false,
            error: 'Forbidden',
            message: '没有权限操作此确认单',
          });
        }
        if (!['CONFIRMED', 'DECLINED'].includes(status)) {
          return res.status(400).json({
            success: false,
            error: 'ValidationError',
            message: '新人只能确认或拒绝确认单',
          });
        }
      } else if (role !== 'ADMIN' && role !== 'PLANNER') {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: '没有权限操作确认单',
        });
      }

      const updated = await prisma.confirmation.update({
        where: { id: confirmationId as string },
        data: {
          status,
          confirmedAt: status === 'CONFIRMED' ? new Date() : null,
        },
        include: {
          files: true,
        },
      });

      return res.status(200).json({
        success: true,
        data: updated,
        message: status === 'CONFIRMED' ? '已确认' : status === 'DECLINED' ? '已拒绝' : '状态已更新',
      });
    }

    return res.status(405).json({
      success: false,
      error: 'MethodNotAllowed',
      message: '不支持的请求方法',
    });
  },
  {
    requirePermission: 'confirmation:confirm',
  }
);
