const { success, error } = require('../utils/response');
const logger = require('../utils/logger');
const prisma = require('../config/prisma');

async function getTreatments(req, res) {
  try {
    const { page = 1, pageSize = 10, keyword, category, status } = req.query;
    
    const skip = (page - 1) * pageSize;
    const where = {};
    
    if (keyword) {
      where.name = { contains: keyword };
    }
    
    if (category) {
      where.category = category;
    }
    
    if (status) {
      where.status = status;
    }
    
    const [treatments, total] = await Promise.all([
      prisma.treatment.findMany({
        where,
        skip: Number(skip),
        take: Number(pageSize),
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.treatment.count({ where }),
    ]);
    
    success(res, {
      list: treatments,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    }, '获取成功');
  } catch (err) {
    logger.error('获取疗程列表失败', { error: err.message });
    error(res, '获取疗程列表失败', 500);
  }
}

async function getTreatmentById(req, res) {
  try {
    const { id } = req.params;
    
    const treatment = await prisma.treatment.findUnique({
      where: { id: Number(id) },
    });
    
    if (!treatment) {
      return error(res, '疗程不存在', 404);
    }
    
    success(res, treatment, '获取成功');
  } catch (err) {
    logger.error('获取疗程详情失败', { error: err.message, id: req.params.id });
    error(res, '获取疗程详情失败', 500);
  }
}

async function createTreatment(req, res) {
  try {
    const { name, category, price, duration, description, image, totalSessions, validDays, sortOrder } = req.body;
    
    if (!name || !price) {
      return error(res, '疗程名称和价格不能为空', 400);
    }
    
    const treatment = await prisma.treatment.create({
      data: {
        name,
        category,
        price: Number(price),
        duration: duration ? Number(duration) : null,
        description,
        image,
        totalSessions: totalSessions ? Number(totalSessions) : 1,
        validDays: validDays ? Number(validDays) : null,
        sortOrder: sortOrder ? Number(sortOrder) : 0,
      },
    });
    
    await logger.operation(
      req.user?.id,
      'create',
      'treatment',
      treatment.id,
      'treatment',
      `创建疗程: ${name}`,
      req
    );
    
    success(res, treatment, '创建成功', 201);
  } catch (err) {
    logger.error('创建疗程失败', { error: err.message });
    error(res, '创建疗程失败', 500);
  }
}

async function updateTreatment(req, res) {
  try {
    const { id } = req.params;
    const { name, category, price, duration, description, image, totalSessions, validDays, status, sortOrder } = req.body;
    
    const treatment = await prisma.treatment.findUnique({
      where: { id: Number(id) },
    });
    
    if (!treatment) {
      return error(res, '疗程不存在', 404);
    }
    
    const updated = await prisma.treatment.update({
      where: { id: Number(id) },
      data: {
        name,
        category,
        price: price !== undefined ? Number(price) : undefined,
        duration: duration !== undefined ? Number(duration) : undefined,
        description,
        image,
        totalSessions: totalSessions !== undefined ? Number(totalSessions) : undefined,
        validDays: validDays !== undefined ? Number(validDays) : undefined,
        status,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined,
      },
    });
    
    await logger.operation(
      req.user?.id,
      'update',
      'treatment',
      Number(id),
      'treatment',
      `更新疗程: ${name || treatment.name}`,
      req
    );
    
    success(res, updated, '更新成功');
  } catch (err) {
    logger.error('更新疗程失败', { error: err.message, id: req.params.id });
    error(res, '更新疗程失败', 500);
  }
}

async function deleteTreatment(req, res) {
  try {
    const { id } = req.params;
    
    const treatment = await prisma.treatment.findUnique({
      where: { id: Number(id) },
    });
    
    if (!treatment) {
      return error(res, '疗程不存在', 404);
    }
    
    await prisma.treatment.delete({
      where: { id: Number(id) },
    });
    
    await logger.operation(
      req.user?.id,
      'delete',
      'treatment',
      Number(id),
      'treatment',
      `删除疗程: ${treatment.name}`,
      req
    );
    
    success(res, null, '删除成功');
  } catch (err) {
    logger.error('删除疗程失败', { error: err.message, id: req.params.id });
    error(res, '删除疗程失败', 500);
  }
}

module.exports = {
  getTreatments,
  getTreatmentById,
  createTreatment,
  updateTreatment,
  deleteTreatment,
};
