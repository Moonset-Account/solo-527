import type { NextApiRequest, NextApiResponse } from 'next';
import { createApiHandler } from '@/lib/api-utils';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const supplierSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().nullable(),
  address: z.string().optional(),
  rating: z.number().min(0).max(5).optional().default(0),
});

export default createApiHandler(
  async (req, res, { role }) => {
    if (req.method === 'GET') {
      const suppliers = await prisma.supplier.findMany({
        include: {
          services: true,
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json({
        success: true,
        data: {
          items: suppliers,
          total: suppliers.length,
        },
      });
    }

    if (req.method === 'POST') {
      if (role !== 'ADMIN' && role !== 'PLANNER') {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: '没有权限创建供应商',
        });
      }

      const data = supplierSchema.parse(req.body);
      const supplier = await prisma.supplier.create({
        data,
        include: { services: true },
      });

      return res.status(201).json({
        success: true,
        data: supplier,
        message: '供应商创建成功',
      });
    }

    return res.status(405).json({
      success: false,
      error: 'MethodNotAllowed',
      message: '不支持的请求方法',
    });
  },
  {
    requirePermission: 'supplier:read',
  }
);
