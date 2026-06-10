const prisma = require('../utils/prisma');
const { success, error, paginate } = require('../utils/response');

function safeJsonParse(str) {
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch (e) {
    return str;
  }
}

function parseEventImages(event) {
  if (event && event.images) {
    event.images = safeJsonParse(event.images);
  }
  return event;
}

function parseOperationLogDetails(log) {
  if (log && log.details) {
    log.details = safeJsonParse(log.details);
  }
  return log;
}

async function getEvents(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const keyword = req.query.keyword || '';
    const type = req.query.type;
    const level = req.query.level;
    const status = req.query.status;
    const gridId = req.query.gridId ? parseInt(req.query.gridId) : undefined;
    const reporterId = req.query.reporterId ? parseInt(req.query.reporterId) : undefined;
    const assigneeId = req.query.assigneeId ? parseInt(req.query.assigneeId) : undefined;
    const departmentId = req.query.departmentId ? parseInt(req.query.departmentId) : undefined;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const isEffective = req.query.isEffective ? req.query.isEffective === 'true' : undefined;

    const where = {};

    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { description: { contains: keyword } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (level) {
      where.level = level;
    }

    if (status) {
      where.status = status;
    }

    if (gridId) {
      where.gridId = gridId;
    }

    if (reporterId) {
      where.reporterId = reporterId;
    }

    if (assigneeId) {
      where.assigneeId = assigneeId;
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate + ' 23:59:59');
      }
    }

    if (isEffective !== undefined) {
      where.isEffective = isEffective;
    }

    const skip = (page - 1) * pageSize;

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          grid: { select: { id: true, name: true } },
          reporter: { select: { id: true, name: true, username: true } },
          assignee: { select: { id: true, name: true, username: true } },
          department: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.event.count({ where }),
    ]);

    const parsedEvents = events.map(parseEventImages);

    return paginate(res, parsedEvents, total, page, pageSize);
  } catch (err) {
    next(err);
  }
}

async function getEventById(req, res, next) {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: parseInt(id) },
      include: {
        grid: true,
        reporter: { select: { id: true, name: true, username: true, avatar: true } },
        assignee: { select: { id: true, name: true, username: true, avatar: true } },
        department: true,
        volunteerServices: true,
        operationLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!event) {
      return error(res, '事件不存在', 404);
    }

    parseEventImages(event);
    if (event.operationLogs) {
      event.operationLogs.forEach(parseOperationLogDetails);
    }

    return success(res, event);
  } catch (err) {
    next(err);
  }
}

async function createEvent(req, res, next) {
  try {
    const {
      title,
      description,
      type,
      level,
      location,
      latitude,
      longitude,
      gridId,
      images,
    } = req.body;

    if (!title || !type || !level || !location || !gridId) {
      return error(res, '必填项不能为空', 400);
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        type,
        level,
        location,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        gridId: parseInt(gridId),
        reporterId: req.user.id,
        images: images ? JSON.stringify(images) : null,
      },
    });

    await prisma.operationLog.create({
      data: {
        eventId: event.id,
        action: '创建事件',
        operatorId: req.user.id,
        operatorName: req.user.name,
        details: JSON.stringify({ title }),
      },
    });

    return success(res, event, '创建成功');
  } catch (err) {
    next(err);
  }
}

async function updateEvent(req, res, next) {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      type,
      level,
      location,
      latitude,
      longitude,
      gridId,
      departmentId,
      images,
    } = req.body;

    const event = await prisma.event.update({
      where: { id: parseInt(id) },
      data: {
        title,
        description,
        type,
        level,
        location,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        gridId: gridId ? parseInt(gridId) : undefined,
        departmentId: departmentId ? parseInt(departmentId) : null,
        images: images ? JSON.stringify(images) : null,
      },
    });

    await prisma.operationLog.create({
      data: {
        eventId: event.id,
        action: '更新事件',
        operatorId: req.user.id,
        operatorName: req.user.name,
        details: JSON.stringify({ title }),
      },
    });

    return success(res, event, '更新成功');
  } catch (err) {
    next(err);
  }
}

async function assignEvent(req, res, next) {
  try {
    const { id } = req.params;
    const { assigneeId, departmentId } = req.body;

    if (!assigneeId && !departmentId) {
      return error(res, '请指定处理人或部门', 400);
    }

    const updateData = {
      status: 'ASSIGNED',
    };

    if (assigneeId) {
      updateData.assigneeId = parseInt(assigneeId);
    }

    if (departmentId) {
      updateData.departmentId = parseInt(departmentId);
    }

    const event = await prisma.event.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    if (assigneeId) {
      await prisma.notification.create({
        data: {
          userId: parseInt(assigneeId),
          title: '新事件指派',
          content: `您被指派处理事件：${event.title}`,
          type: 'EVENT',
          eventId: event.id,
        },
      });
    }

    await prisma.operationLog.create({
      data: {
        eventId: event.id,
        action: '指派事件',
        operatorId: req.user.id,
        operatorName: req.user.name,
        details: JSON.stringify({ assigneeId, departmentId }),
      },
    });

    return success(res, event, '指派成功');
  } catch (err) {
    next(err);
  }
}

async function updateEventStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return error(res, '状态不能为空', 400);
    }

    const updateData = { status };

    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    const event = await prisma.event.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    await prisma.operationLog.create({
      data: {
        eventId: event.id,
        action: `更新状态为 ${status}`,
        operatorId: req.user.id,
        operatorName: req.user.name,
        details: JSON.stringify({ status }),
      },
    });

    return success(res, event, '状态更新成功');
  } catch (err) {
    next(err);
  }
}

async function deleteEvent(req, res, next) {
  try {
    const { id } = req.params;

    await prisma.event.delete({
      where: { id: parseInt(id) },
    });

    return success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
}

async function getEventStatistics(req, res, next) {
  try {
    const [totalCount, pendingCount, processingCount, completedCount] = await Promise.all([
      prisma.event.count(),
      prisma.event.count({ where: { status: 'PENDING' } }),
      prisma.event.count({ where: { status: 'PROCESSING' } }),
      prisma.event.count({ where: { status: 'COMPLETED' } }),
    ]);

    const typeStats = await prisma.event.groupBy({
      by: ['type'],
      _count: true,
    });

    const levelStats = await prisma.event.groupBy({
      by: ['level'],
      _count: true,
    });

    return success(res, {
      total: totalCount,
      pending: pendingCount,
      processing: processingCount,
      completed: completedCount,
      byType: typeStats,
      byLevel: levelStats,
    });
  } catch (err) {
    next(err);
  }
}

async function batchAssignEvents(req, res, next) {
  try {
    const { ids, assigneeId, departmentId } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return error(res, '请选择要分派的事件', 400);
    }

    if (!assigneeId && !departmentId) {
      return error(res, '请指定处理人或部门', 400);
    }

    const events = await prisma.event.findMany({
      where: {
        id: { in: ids.map(id => parseInt(id)) },
        status: { not: 'CLOSED' },
      },
    });

    if (events.length === 0) {
      return error(res, '没有可分派的事件', 400);
    }

    const validIds = events.map(e => e.id);
    const invalidIds = ids
      .map(id => parseInt(id))
      .filter(id => !validIds.includes(id));

    const updateData = { status: 'ASSIGNED' };
    if (assigneeId) {
      updateData.assigneeId = parseInt(assigneeId);
    }
    if (departmentId) {
      updateData.departmentId = parseInt(departmentId);
    }

    await prisma.event.updateMany({
      where: { id: { in: validIds } },
      data: updateData,
    });

    const successLogs = validIds.map(id => ({
      eventId: id,
      action: '批量分派事件',
      operatorId: req.user.id,
      operatorName: req.user.name,
      details: JSON.stringify({ assigneeId, departmentId, reason: '批量分派' }),
      status: 'SUCCESS',
    }));

    const failureLogs = invalidIds.map(id => ({
      eventId: null,
      action: '批量分派事件',
      operatorId: req.user.id,
      operatorName: req.user.name,
      details: JSON.stringify({ assigneeId, departmentId, eventId: id }),
      status: 'FAILED',
      failureReason: '事件已关闭或不存在，无法分派',
    }));

    if (successLogs.length > 0) {
      await prisma.operationLog.createMany({ data: successLogs });
    }
    if (failureLogs.length > 0) {
      await prisma.operationLog.createMany({ data: failureLogs });
    }

    if (assigneeId) {
      const assignNotifications = validIds.map(id => {
        const event = events.find(e => e.id === id);
        return {
          userId: parseInt(assigneeId),
          title: '新事件指派',
          content: `您被指派处理事件：${event?.title || ''}`,
          type: 'EVENT',
          eventId: id,
        };
      });
      if (assignNotifications.length > 0) {
        await prisma.notification.createMany({ data: assignNotifications });
      }
    }

    return success(res, {
      successCount: validIds.length,
      failCount: invalidIds.length,
      total: ids.length,
      successIds: validIds,
      failIds: invalidIds,
      failReasons: invalidIds.map(id => ({ id, reason: '事件已关闭或不存在，无法分派' })),
    }, `成功分派 ${validIds.length} 条，失败 ${invalidIds.length} 条`);
  } catch (err) {
    next(err);
  }
}

async function batchWithdrawEvents(req, res, next) {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return error(res, '请选择要撤回的事件', 400);
    }

    const allEvents = await prisma.event.findMany({
      where: {
        id: { in: ids.map(id => parseInt(id)) },
      },
    });

    if (allEvents.length === 0) {
      return error(res, '未找到选中的事件', 404);
    }

    const validEvents = allEvents.filter(e => e.status === 'PENDING' && e.isEffective === true);
    const validIds = validEvents.map(e => e.id);

    const failedEvents = allEvents.filter(e => !(e.status === 'PENDING' && e.isEffective === true));
    const invalidIds = failedEvents.map(e => e.id);

    const notFoundIds = ids
      .map(id => parseInt(id))
      .filter(id => !allEvents.find(e => e.id === id));

    if (validIds.length > 0) {
      await prisma.event.updateMany({
        where: { id: { in: validIds } },
        data: { isEffective: false },
      });
    }

    const successLogs = validIds.map(id => ({
      eventId: id,
      action: '撤回事件',
      operatorId: req.user.id,
      operatorName: req.user.name,
      details: JSON.stringify({ reason: '批量撤回' }),
      status: 'SUCCESS',
    }));

    const failureLogs = [];
    const failReasons = [];

    failedEvents.forEach(event => {
      let reason = '';
      if (event.status !== 'PENDING') {
        reason = `事件状态为「${event.status}」，只有待处理状态可以撤回`;
      } else if (!event.isEffective) {
        reason = '事件已为未生效状态';
      } else {
        reason = '不符合撤回条件';
      }
      failureLogs.push({
        eventId: event.id,
        action: '撤回事件',
        operatorId: req.user.id,
        operatorName: req.user.name,
        details: JSON.stringify({ reason: '批量撤回' }),
        status: 'FAILED',
        failureReason: reason,
      });
      failReasons.push({ id: event.id, title: event.title, reason });
    });

    notFoundIds.forEach(id => {
      failureLogs.push({
        eventId: null,
        action: '撤回事件',
        operatorId: req.user.id,
        operatorName: req.user.name,
        details: JSON.stringify({ reason: '批量撤回', eventId: id }),
        status: 'FAILED',
        failureReason: '事件不存在',
      });
      failReasons.push({ id, title: `事件ID:${id}`, reason: '事件不存在' });
    });

    if (successLogs.length > 0) {
      await prisma.operationLog.createMany({ data: successLogs });
    }
    if (failureLogs.length > 0) {
      await prisma.operationLog.createMany({ data: failureLogs });
    }

    return success(res, {
      successCount: validIds.length,
      failCount: failedEvents.length + notFoundIds.length,
      total: ids.length,
      successIds: validIds,
      failIds: [...invalidIds, ...notFoundIds],
      failReasons,
    }, `成功撤回 ${validIds.length} 条，失败 ${failedEvents.length + notFoundIds.length} 条`);
  } catch (err) {
    next(err);
  }
}

async function getEventTrend(req, res, next) {
  try {
    const days = parseInt(req.query.days) || 30;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const allEvents = await prisma.event.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        createdAt: true,
        completedAt: true,
        status: true,
      },
    });

    const dateMap = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      dateMap[dateStr] = {
        date: dateStr,
        reported: 0,
        completed: 0,
      };
    }

    allEvents.forEach(event => {
      const reportDate = event.createdAt.toISOString().split('T')[0];
      if (dateMap[reportDate]) {
        dateMap[reportDate].reported++;
      }
      if (event.completedAt) {
        const completeDate = event.completedAt.toISOString().split('T')[0];
        if (dateMap[completeDate]) {
          dateMap[completeDate].completed++;
        }
      }
    });

    const trend = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));

    return success(res, trend);
  } catch (err) {
    next(err);
  }
}

async function closeEvent(req, res, next) {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: parseInt(id) },
    });

    if (!event) {
      return error(res, '事件不存在', 404);
    }

    if (event.status !== 'COMPLETED') {
      return error(res, '只有已完成的事件才能关闭', 400);
    }

    const closedEvent = await prisma.event.update({
      where: { id: parseInt(id) },
      data: { status: 'CLOSED' },
    });

    await prisma.operationLog.create({
      data: {
        eventId: closedEvent.id,
        action: '关闭事件',
        operatorId: req.user.id,
        operatorName: req.user.name,
        details: JSON.stringify({ fromStatus: 'COMPLETED', toStatus: 'CLOSED' }),
      },
    });

    return success(res, closedEvent, '关闭成功');
  } catch (err) {
    next(err);
  }
}

async function processFacilityDamage(req, res, next) {
  try {
    const { id } = req.params;
    const { volunteerName, volunteerPhone, serviceHours, serviceDate, description } = req.body;

    const event = await prisma.event.findUnique({
      where: { id: parseInt(id) },
    });

    if (!event) {
      return error(res, '事件不存在', 404);
    }

    if (event.type !== 'FACILITY_DAMAGE') {
      return error(res, '只有设施损坏事件才能处理志愿服务', 400);
    }

    const updatedEvent = await prisma.event.update({
      where: { id: parseInt(id) },
      data: { status: 'PROCESSING' },
    });

    const volunteerService = await prisma.volunteerService.create({
      data: {
        eventId: parseInt(id),
        volunteerName,
        volunteerPhone,
        serviceHours: parseFloat(serviceHours),
        serviceDate: new Date(serviceDate),
        description,
      },
    });

    if (event.assigneeId) {
      await prisma.notification.create({
        data: {
          userId: event.assigneeId,
          title: '设施损坏处理提醒',
          content: `事件「${event.title}」已进入处理状态，请及时跟进`,
          type: 'REMINDER',
          eventId: event.id,
        },
      });
    }

    await prisma.operationLog.create({
      data: {
        eventId: event.id,
        action: '处理设施损坏事件',
        operatorId: req.user.id,
        operatorName: req.user.name,
        details: JSON.stringify({ volunteerName, serviceHours }),
      },
    });

    return success(res, { event: updatedEvent, volunteerService }, '处理成功');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  assignEvent,
  batchAssignEvents,
  updateEventStatus,
  deleteEvent,
  getEventStatistics,
  batchWithdrawEvents,
  getEventTrend,
  closeEvent,
  processFacilityDamage,
};
