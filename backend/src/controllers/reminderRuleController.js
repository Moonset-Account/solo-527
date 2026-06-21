const { success, error } = require('../utils/response');
const logger = require('../utils/logger');
const prisma = require('../config/prisma');

async function getReminderRules(req, res) {
  try {
    const { page = 1, pageSize = 10, type, isEnabled } = req.query;

    const skip = (page - 1) * pageSize;
    const where = {};

    if (type) {
      where.type = type;
    }

    if (isEnabled !== undefined) {
      where.isEnabled = isEnabled === 'true';
    }

    const [rules, total] = await Promise.all([
      prisma.reminderRule.findMany({
        where,
        skip: Number(skip),
        take: Number(pageSize),
        orderBy: { sortOrder: 'asc' },
        include: {
          treatment: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.reminderRule.count({ where }),
    ]);

    success(res, {
      list: rules,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    }, '获取成功');
  } catch (err) {
    logger.error('获取提醒规则列表失败', { error: err.message });
    error(res, '获取提醒规则列表失败', 500);
  }
}

async function getReminderRuleById(req, res) {
  try {
    const { id } = req.params;

    const rule = await prisma.reminderRule.findUnique({
      where: { id: Number(id) },
      include: {
        treatment: {
          select: { id: true, name: true },
        },
      },
    });

    if (!rule) {
      return error(res, '提醒规则不存在', 404);
    }

    success(res, rule, '获取成功');
  } catch (err) {
    logger.error('获取提醒规则详情失败', { error: err.message, id: req.params.id });
    error(res, '获取提醒规则详情失败', 500);
  }
}

async function createReminderRule(req, res) {
  try {
    const { name, type, treatmentId, daysBefore, urgencyLevel, template, sortOrder } = req.body;

    if (!name || !type || !daysBefore) {
      return error(res, '规则名称、类型和提前天数不能为空', 400);
    }

    const rule = await prisma.reminderRule.create({
      data: {
        name,
        type,
        treatmentId: treatmentId ? Number(treatmentId) : null,
        daysBefore: Number(daysBefore),
        urgencyLevel: urgencyLevel || 'normal',
        template,
        sortOrder: sortOrder ? Number(sortOrder) : 0,
      },
    });

    await logger.operation(
      req.user?.id,
      'create',
      'reminderRule',
      rule.id,
      'reminderRule',
      `创建提醒规则: ${name}`,
      req
    );

    success(res, rule, '创建成功', 201);
  } catch (err) {
    logger.error('创建提醒规则失败', { error: err.message });
    error(res, '创建提醒规则失败', 500);
  }
}

async function updateReminderRule(req, res) {
  try {
    const { id } = req.params;
    const { name, type, treatmentId, daysBefore, urgencyLevel, template, isEnabled, sortOrder } = req.body;

    const rule = await prisma.reminderRule.findUnique({
      where: { id: Number(id) },
    });

    if (!rule) {
      return error(res, '提醒规则不存在', 404);
    }

    const updated = await prisma.reminderRule.update({
      where: { id: Number(id) },
      data: {
        name,
        type,
        treatmentId: treatmentId !== undefined ? Number(treatmentId) : undefined,
        daysBefore: daysBefore !== undefined ? Number(daysBefore) : undefined,
        urgencyLevel,
        template,
        isEnabled,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined,
      },
    });

    await logger.operation(
      req.user?.id,
      'update',
      'reminderRule',
      Number(id),
      'reminderRule',
      `更新提醒规则: ${name || rule.name}`,
      req
    );

    success(res, updated, '更新成功');
  } catch (err) {
    logger.error('更新提醒规则失败', { error: err.message, id: req.params.id });
    error(res, '更新提醒规则失败', 500);
  }
}

async function deleteReminderRule(req, res) {
  try {
    const { id } = req.params;

    const rule = await prisma.reminderRule.findUnique({
      where: { id: Number(id) },
    });

    if (!rule) {
      return error(res, '提醒规则不存在', 404);
    }

    await prisma.reminderRule.delete({
      where: { id: Number(id) },
    });

    await logger.operation(
      req.user?.id,
      'delete',
      'reminderRule',
      Number(id),
      'reminderRule',
      `删除提醒规则: ${rule.name}`,
      req
    );

    success(res, null, '删除成功');
  } catch (err) {
    logger.error('删除提醒规则失败', { error: err.message, id: req.params.id });
    error(res, '删除提醒规则失败', 500);
  }
}

async function toggleReminderRule(req, res) {
  try {
    const { id } = req.params;

    const rule = await prisma.reminderRule.findUnique({
      where: { id: Number(id) },
    });

    if (!rule) {
      return error(res, '提醒规则不存在', 404);
    }

    const updated = await prisma.reminderRule.update({
      where: { id: Number(id) },
      data: {
        isEnabled: !rule.isEnabled,
      },
    });

    await logger.operation(
      req.user?.id,
      'toggle',
      'reminderRule',
      Number(id),
      'reminderRule',
      `${rule.isEnabled ? '禁用' : '启用'}提醒规则: ${rule.name}`,
      req
    );

    success(res, updated, '操作成功');
  } catch (err) {
    logger.error('切换提醒规则状态失败', { error: err.message, id: req.params.id });
    error(res, '切换提醒规则状态失败', 500);
  }
}

module.exports = {
  getReminderRules,
  getReminderRuleById,
  createReminderRule,
  updateReminderRule,
  deleteReminderRule,
  toggleReminderRule,
};
