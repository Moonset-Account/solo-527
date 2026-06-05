import type { NextApiRequest, NextApiResponse } from 'next';
import { createApiHandler } from '@/lib/api-utils';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const commentSchema = z.object({
  content: z.string().min(1, '评论内容不能为空'),
  taskId: z.string().optional(),
  fileId: z.string().optional(),
});

export default createApiHandler(
  async (req, res, { userId, role }) => {
    const { projectId } = req.query;

    if (req.method === 'POST') {
      const data = commentSchema.parse(req.body);
      
      const comment = await prisma.comment.create({
        data: {
          content: data.content,
          projectId: projectId as string,
          authorId: userId!,
          taskId: data.taskId,
          fileId: data.fileId,
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

    if (req.method === 'GET') {
      const comments = await prisma.comment.findMany({
        where: {
          projectId: projectId as string,
        },
        include: {
          author: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json({
        success: true,
        data: {
          items: comments,
          total: comments.length,
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
    requirePermission: 'comment:write',
  }
);
