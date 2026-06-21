const { success, error } = require('../utils/response');
const logger = require('../utils/logger');
const prisma = require('../config/prisma');

async function getReminders(req, res) {
  try {
    const { page = 1, pageSize = 10, status, urgencyLevel, memberId, keyword } = req.query;

    const skip = (page - 1) * pageSize;
    const where = {};

    if (status) {
      where.status = status;
    }

    if (urgencyLevel) {
      where.urgencyLevel = urgencyLevel;
    }

    if (memberId) {
      where.memberId = Number(memberId);
    }

    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { content: { contains: keyword } },
      ];
    }

    const [reminders, total] = await Promise.all([
      prisma.reminder.findMany({
        where,
        skip: Number(skip),
        take: Number(pageSize),
        orderBy: [
          { createdAt: 'desc' },
        ],
        include: {
          member: {
            select: { id: true, name: true, phone: true, memberNo: true },
          },
          rule: {
            select: { id: true, name: true },
          },
          createdBy: {
            select: { id: true, name: true },
          },
          handledBy: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.reminder.count({ where }),
    ]);

    success(res, {
      list: reminders,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    }, '获取成功');
  } catch (err) {
    logger.error('获取提醒列表失败', { error: err.message });
    error(res, '获取提醒列表失败', 500);
  }
}

async function getReminderById(req, res) {
  try {
    const { id } = req.params;

    const reminder = await prisma.reminder.findUnique({
      where: { id: Number(id) },
      include: {
        member: {
          select: { id: true, name: true, phone: true, memberNo: true },
        },
        rule: {
          select: { id: true, name: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
        handledBy: {
          select: { id: true, name: true },
        },
      },
    });

    if (!reminder) {
      return error(res, '提醒不存在', 404);
    }

    success(res, reminder, '获取成功');
  } catch (err) {
    logger.error('获取提醒详情失败', { error: err.message, id: req.params.id });
    error(res, '获取提醒详情失败', 500);
  }
}

async function createReminder(req, res) {
  try {
    const { memberId, ruleId, type, title, content, urgencyLevel, relatedId, relatedType } = req.body;

    if (!memberId || !title || !content) {
      return error(res, '会员ID、标题和内容不能为空', 400);
    }

    const reminder = await prisma.reminder.create({
      data: {
        memberId: Number(memberId),
        ruleId: ruleId ? Number(ruleId) : null,
        type: type || 'manual',
        title,
        content,
        urgencyLevel: urgencyLevel || 'normal',
        relatedId: relatedId ? Number(relatedId) : null,
        relatedType,
        createdById: req.user?.id,
      },
    });

    await logger.operation(
      req.user?.id,
      'create',
      'reminder',
      reminder.id,
      'reminder',
      `创建提醒: ${title}`,
      req
    );

    success(res, reminder, '创建成功', 201);
  } catch (err) {
    logger.error('创建提醒失败', { error: err.message });
    error(res, '创建提醒失败', 500);
  }
}

async function updateReminder(req, res) {
  try {
    const { id } = req.params;
    const { title, content, urgencyLevel, status } = req.body;

    const reminder = await prisma.reminder.findUnique({
      where: { id: Number(id) },
    });

    if (!reminder) {
      return error(res, '提醒不存在', 404);
    }

    const updated = await prisma.reminder.update({
      where: { id: Number(id) },
      data: {
        title,
        content,
        urgencyLevel,
        status,
      },
    });

    await logger.operation(
      req.user?.id,
      'update',
      'reminder',
      Number(id),
      'reminder',
      `更新提醒: ${title || reminder.title}`,
      req
    );

    success(res, updated, '更新成功');
  } catch (err) {
    logger.error('更新提醒失败', { error: err.message, id: req.params.id });
    error(res, '更新提醒失败', 500);
  }
}

async function handleReminder(req, res) {
  try {
    const { id } = req.params;
    const { handleRemark } = req.body;

    const reminder = await prisma.reminder.findUnique({
      where: { id: Number(id) },
    });

    if (!reminder) {
      return error(res, '提醒不存在', 404);
    }

    if (reminder.status === 'handled') {
      return error(res, '提醒已处理', 400);
    }

    const updated = await prisma.reminder.update({
      where: { id: Number(id) },
      data: {
        status: 'handled',
        handledById: req.user?.id,
        handledAt: new Date(),
        handleRemark,
      },
    });

    await logger.operation(
      req.user?.id,
      'handle',
      'reminder',
      Number(id),
      'reminder',
      `处理提醒: ${reminder.title}`,
      req
    );

    success(res, updated, '处理成功');
  } catch (err) {
    logger.error('处理提醒失败', { error: err.message, id: req.params.id });
    error(res, '处理提醒失败', 500);
  }
}

async function deleteReminder(req, res) {
  try {
    const { id } = req.params;

    const reminder = await prisma.reminder.findUnique({
      where: { id: Number(id) },
    });

    if (!reminder) {
      return error(res, '提醒不存在', 404);
    }

    await prisma.reminder.delete({
      where: { id: Number(id) },
    });

    await logger.operation(
      req.user?.id,
      'delete',
      'reminder',
      Number(id),
      'reminder',
      `删除提醒: ${reminder.title}`,
      req
    );

    success(res, null, '删除成功');
  } catch (err) {
    logger.error('删除提醒失败', { error: err.message, id: req.params.id });
    error(res, '删除提醒失败', 500);
  }
}

async function getReminderStats(req, res) {
  try {
    const statusCounts = await prisma.reminder.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    const urgencyCounts = await prisma.reminder.groupBy({
      by: ['urgencyLevel'],
      _count: {
        urgencyLevel: true,
      },
    });

    const stats = {
      byStatus: {
        pending: 0,
        handled: 0,
        ignored: 0,
      },
      byUrgency: {
        urgent: 0,
        normal: 0,
        low: 0,
      },
    };

    statusCounts.forEach(item => {
      stats.byStatus[item.status] = item._count.status;
    });

    urgencyCounts.forEach(item => {
      stats.byUrgency[item.urgencyLevel] = item._count.urgencyLevel;
    });

    stats.total = stats.byStatus.pending + stats.byStatus.handled + stats.byStatus.ignored;

    success(res, stats, '获取成功');
  } catch (err) {
    logger.error('获取提醒统计失败', { error: err.message });
    error(res, '获取提醒统计失败', 500);
  }
}

async function generateReminders(req, res) {
  try {
    const enabledRules = await prisma.reminderRule.findMany({
      where: { isEnabled: true },
      include: {
        treatment: true,
      },
    });

    if (enabledRules.length === 0) {
      return success(res, { generated: 0, skipped: 0 }, '没有启用的提醒规则');
    }

    let generatedCount = 0;
    let skippedCount = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const rule of enabledRules) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + rule.daysBefore);

      const where = {
        status: 'active',
        expireDate: {
          gte: today,
          lte: targetDate,
        },
      };

      if (rule.treatmentId) {
        where.treatmentId = rule.treatmentId;
      }

      const memberTreatments = await prisma.memberTreatment.findMany({
        where,
        include: {
          member: true,
          treatment: true,
        },
      });

      for (const mt of memberTreatments) {
        const existingReminder = await prisma.reminder.findFirst({
          where: {
            memberId: mt.memberId,
            ruleId: rule.id,
            relatedId: mt.id,
            relatedType: 'memberTreatment',
            status: 'pending',
          },
        });

        if (existingReminder) {
          skippedCount++;
          continue;
        }

        const daysLeft = Math.ceil((mt.expireDate - today) / (1000 * 60 * 60 * 24));
        const title = rule.template
          ? rule.template.replace('{name}', mt.member.name).replace('{days}', daysLeft)
          : `疗程即将到期提醒 - ${mt.treatment.name}`;

        const content = `尊敬的${mt.member.name}，您的${mt.treatment.name}疗程还有${daysLeft}天到期，剩余${mt.remainingSessions}次，请及时预约使用。`;

        let urgencyLevel = rule.urgencyLevel;
        if (daysLeft <= 3) {
          urgencyLevel = 'urgent';
        } else if (daysLeft <= 7) {
          urgencyLevel = 'normal';
        } else {
          urgencyLevel = 'low';
        }

        await prisma.reminder.create({
          data: {
            memberId: mt.memberId,
            ruleId: rule.id,
            type: rule.type,
            title,
            content,
            urgencyLevel,
            relatedId: mt.id,
            relatedType: 'memberTreatment',
            createdById: req.user?.id,
          },
        });

        generatedCount++;
      }
    }

    await logger.operation(
      req.user?.id,
      'generate',
      'reminder',
      null,
      'reminder',
      `自动生成提醒: 生成${generatedCount}条，跳过${skippedCount}条`,
      req
    );

    success(res, { generated: generatedCount, skipped: skippedCount }, '生成成功');
  } catch (err) {
    logger.error('生成提醒失败', { error: err.message });
    error(res, '生成提醒失败', 500);
  }
}

module.exports = {
  getReminders,
  getReminderById,
  createReminder,
  updateReminder,
  handleReminder,
  deleteReminder,
  getReminderStats,
  generateReminders,
};
