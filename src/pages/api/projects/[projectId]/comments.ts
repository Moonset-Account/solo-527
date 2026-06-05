import type { NextApiRequest, NextApiResponse } from 'next';
import { createApiHandler, ApiResponse } from '@/lib/api-utils';
import prisma from '@/lib/prisma';

export default createApiHandler(
  async (req, res, { userId, role }) => {
    const { projectId } = req.query;

    if (req.method === 'GET') {
      const comments = await prisma.comment.findMany({
        where: { projectId: projectId as string },
        include: {
          author: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json({
        success: true,
        data: comments,
      });
    }

    if (req.method === 'POST') {
      const { content, taskId, fileId } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'ValidationError',
          message: '评论内容不能为空',
        });
      }

      const comment = await prisma.comment.create({
        data: {
          content,
          projectId: projectId as string,
          taskId: taskId || null,
          fileId: fileId || null,
          authorId: userId,
        },
        include: {
          author: { select: { id: true, name: true, role: true } },
        },
      });

      return res.status(201).json({
        success: true,
        data: comment,
        message: '评论发布成功',
      });
    }

    return res.status(405).json({
      success: false,
      error: 'MethodNotAllowed',
      message: '不支持的请求方法',
    });
  },
  {
    requirePermission: 'comment:write',
    requireProjectAccess: true,
  }
);
