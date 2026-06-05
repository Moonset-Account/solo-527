import type { NextApiRequest, NextApiResponse } from 'next';
import { createApiHandler, ApiResponse } from '@/lib/api-utils';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const projectSchema = z.object({
  name: z.string().min(1, '项目名称不能为空'),
  description: z.string().optional(),
  weddingDate: z.string().datetime().optional().nullable(),
  venue: z.string().optional().nullable(),
  totalBudget: z.number().min(0).optional().default(0),
  coupleId: z.string().optional().nullable(),
});

export default createApiHandler(
  async (req, res, { userId, role }) => {
    if (req.method === 'GET') {
      const { status, page = '1', pageSize = '10' } = req.query;
      
      const where: any = {};
      
      if (role === 'PLANNER') {
        where.managerId = userId;
      } else if (role === 'COUPLE') {
        where.coupleId = userId;
      } else if (role === 'SUPPLIER') {
        where.tasks = {
          some: {
            assigneeId: userId,
          },
        };
      }

      if (status) {
        where.status = status;
      }

      const projects = await prisma.project.findMany({
        where,
        include: {
          manager: { select: { id: true, name: true, email: true } },
          couple: { select: { id: true, name: true, email: true } },
          _count: {
            select: { tasks: true, files: true, comments: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(pageSize as string),
        take: parseInt(pageSize as string),
      });

      const total = await prisma.project.count({ where });

      return res.status(200).json({
        success: true,
        data: {
          items: projects,
          total,
          page: parseInt(page as string),
          pageSize: parseInt(pageSize as string),
        },
      });
    }

    if (req.method === 'POST') {
      if (role !== 'ADMIN' && role !== 'PLANNER') {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: '没有权限创建项目',
        });
      }

      const data = projectSchema.parse(req.body);
      
      const project = await prisma.project.create({
        data: {
          ...data,
          managerId: userId,
          weddingDate: data.weddingDate ? new Date(data.weddingDate) : null,
        },
        include: {
          manager: { select: { id: true, name: true, email: true } },
          couple: { select: { id: true, name: true, email: true } },
        },
      });

      return res.status(201).json({
        success: true,
        data: project,
        message: '项目创建成功',
      });
    }

    return res.status(405).json({
      success: false,
      error: 'MethodNotAllowed',
      message: '不支持的请求方法',
    });
  },
  {
    requirePermission: 'project:read',
  }
);
