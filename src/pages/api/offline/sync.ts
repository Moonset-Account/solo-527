import type { NextApiRequest, NextApiResponse } from 'next';
import { createApiHandler, ApiResponse } from '@/lib/api-utils';
import prisma from '@/lib/prisma';
import { enqueueSyncItem } from '@/lib/queue';

export default createApiHandler(
  async (req, res, { userId }) => {
    if (req.method === 'GET') {
      const pendingItems = await prisma.offlineSyncQueue.findMany({
        where: {
          userId,
          synced: false,
        },
        orderBy: { createdAt: 'asc' },
      });

      return res.status(200).json({
        success: true,
        data: pendingItems,
      });
    }

    if (req.method === 'POST') {
      const { operations } = req.body;

      if (!Array.isArray(operations)) {
        return res.status(400).json({
          success: false,
          error: 'ValidationError',
          message: 'operations 必须是数组',
        });
      }

      const createdItems = [];

      for (const op of operations) {
        const syncItem = await prisma.offlineSyncQueue.create({
          data: {
            userId,
            operation: op.operation,
            entityType: op.entityType,
            entityData: op.entityData,
          },
        });
        createdItems.push(syncItem);

        await enqueueSyncItem(syncItem.id);
      }

      return res.status(201).json({
        success: true,
        data: createdItems,
        message: `${createdItems.length} 条数据已加入同步队列`,
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
