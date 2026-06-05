import type { NextApiRequest, NextApiResponse } from 'next';
import { createApiHandler, ApiResponse } from '@/lib/api-utils';
import prisma from '@/lib/prisma';

export default createApiHandler(
  async (req, res, { role }) => {
    if (req.method === 'GET') {
      const { category, search } = req.query;

      const where: any = {};
      if (category) where.category = category;
      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { contactName: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      const suppliers = await prisma.supplier.findMany({
        where,
        include: {
          services: true,
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { name: 'asc' },
      });

      return res.status(200).json({
        success: true,
        data: suppliers,
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

      const { name, category, contactName, phone, email, address, services } = req.body;

      const supplier = await prisma.supplier.create({
        data: {
          name,
          category,
          contactName,
          phone,
          email,
          address,
          services: services ? {
            create: services,
          } : undefined,
        },
        include: {
          services: true,
        },
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
