import { Router } from 'express';
import prisma from '../config/prisma.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword } = req.query;
    const skip = (page - 1) * pageSize;

    const where = {};

    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { customerNo: { contains: keyword } },
        { contactName: { contains: keyword } },
      ];
    }

    const [list, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: parseInt(pageSize),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count({ where }),
    ]);

    res.json({
      list,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });
  } catch (error) {
    console.error('获取客户列表失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!customer) {
      return res.status(404).json({ message: '客户不存在' });
    }

    res.json({ customer });
  } catch (error) {
    console.error('获取客户详情失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.post('/', authenticate, requireRoles('FINANCE_STAFF', 'FINANCE_MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const { customerNo, name, contactName, phone, email, address, creditLimit } = req.body;

    const customer = await prisma.customer.create({
      data: {
        customerNo,
        name,
        contactName,
        phone,
        email,
        address,
        creditLimit: creditLimit || null,
      },
    });

    res.json({ customer });
  } catch (error) {
    console.error('创建客户失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.put('/:id', authenticate, requireRoles('FINANCE_STAFF', 'FINANCE_MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const { name, contactName, phone, email, address, creditLimit } = req.body;
    const customerId = parseInt(req.params.id);

    const customer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        name: name || undefined,
        contactName: contactName !== undefined ? contactName : undefined,
        phone: phone !== undefined ? phone : undefined,
        email: email !== undefined ? email : undefined,
        address: address !== undefined ? address : undefined,
        creditLimit: creditLimit !== undefined ? creditLimit : undefined,
      },
    });

    res.json({ customer });
  } catch (error) {
    console.error('更新客户失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.get('/options/list', authenticate, async (req, res) => {
  try {
    const { keyword } = req.query;
    const where = {};

    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { customerNo: { contains: keyword } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      select: {
        id: true,
        customerNo: true,
        name: true,
      },
      take: 50,
      orderBy: { name: 'asc' },
    });

    res.json({ list: customers });
  } catch (error) {
    console.error('获取客户选项失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.delete('/:id', authenticate, requireRoles('FINANCE_MANAGER', 'ADMIN'), async (req, res) => {
  try {
    await prisma.customer.delete({
      where: { id: parseInt(req.params.id) },
    });

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除客户失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

export default router;
