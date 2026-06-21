const { success, error } = require('../utils/response');
const logger = require('../utils/logger');
const prisma = require('../config/prisma');

async function getAppointments(req, res) {
  try {
    const { page = 1, pageSize = 10, memberId, consultantId, status, startDate, endDate } = req.query;
    
    const skip = (page - 1) * pageSize;
    const where = {};
    
    if (memberId) {
      where.memberId = Number(memberId);
    }
    
    if (consultantId) {
      where.consultantId = Number(consultantId);
    }
    
    if (status) {
      where.status = status;
    }
    
    if (startDate || endDate) {
      where.appointmentDate = {};
      if (startDate) {
        where.appointmentDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.appointmentDate.lte = new Date(endDate);
      }
    }
    
    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip: Number(skip),
        take: Number(pageSize),
        include: {
          member: {
            select: { id: true, name: true, phone: true, memberNo: true },
          },
          consultant: {
            select: { id: true, name: true },
          },
          items: {
            include: {
              treatment: {
                select: { id: true, name: true },
              },
            },
          },
        },
        orderBy: { appointmentDate: 'desc' },
      }),
      prisma.appointment.count({ where }),
    ]);
    
    success(res, {
      list: appointments,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    }, '获取成功');
  } catch (err) {
    logger.error('获取预约列表失败', { error: err.message });
    error(res, '获取预约列表失败', 500);
  }
}

async function getAppointmentById(req, res) {
  try {
    const { id } = req.params;
    
    const appointment = await prisma.appointment.findUnique({
      where: { id: Number(id) },
      include: {
        member: true,
        consultant: true,
        items: {
          include: {
            treatment: true,
          },
        },
      },
    });
    
    if (!appointment) {
      return error(res, '预约不存在', 404);
    }
    
    success(res, appointment, '获取成功');
  } catch (err) {
    logger.error('获取预约详情失败', { error: err.message, id: req.params.id });
    error(res, '获取预约详情失败', 500);
  }
}

async function createAppointment(req, res) {
  try {
    const { memberId, consultantId, appointmentDate, startTime, endTime, items, remark } = req.body;
    
    if (!memberId || !appointmentDate || !startTime || !endTime) {
      return error(res, '必填参数不能为空', 400);
    }
    
    const member = await prisma.member.findUnique({
      where: { id: Number(memberId) },
    });
    
    if (!member) {
      return error(res, '会员不存在', 404);
    }
    
    let totalAmount = 0;
    const appointmentItems = [];
    
    if (items && items.length > 0) {
      for (const item of items) {
        const treatment = await prisma.treatment.findUnique({
          where: { id: Number(item.treatmentId) },
        });
        
        if (!treatment) {
          return error(res, `疗程ID ${item.treatmentId} 不存在`, 404);
        }
        
        const quantity = item.quantity || 1;
        const unitPrice = item.unitPrice || treatment.price;
        const subtotal = quantity * Number(unitPrice);
        
        totalAmount += subtotal;
        
        appointmentItems.push({
          treatmentId: Number(item.treatmentId),
          quantity,
          unitPrice: Number(unitPrice),
          subtotal,
          remark: item.remark,
        });
      }
    }
    
    const appointment = await prisma.appointment.create({
      data: {
        memberId: Number(memberId),
        consultantId: consultantId ? Number(consultantId) : null,
        appointmentDate: new Date(appointmentDate),
        startTime,
        endTime,
        totalAmount,
        remark,
        items: {
          create: appointmentItems,
        },
      },
      include: {
        items: true,
      },
    });
    
    await logger.operation(
      req.user?.id,
      'create',
      'appointment',
      appointment.id,
      'appointment',
      `创建预约: 会员${member.name}`,
      req
    );
    
    success(res, appointment, '创建成功', 201);
  } catch (err) {
    logger.error('创建预约失败', { error: err.message });
    error(res, '创建预约失败', 500);
  }
}

async function updateAppointment(req, res) {
  try {
    const { id } = req.params;
    const { consultantId, appointmentDate, startTime, endTime, status, remark } = req.body;
    
    const appointment = await prisma.appointment.findUnique({
      where: { id: Number(id) },
    });
    
    if (!appointment) {
      return error(res, '预约不存在', 404);
    }
    
    const updated = await prisma.appointment.update({
      where: { id: Number(id) },
      data: {
        consultantId: consultantId !== undefined ? (consultantId ? Number(consultantId) : null) : undefined,
        appointmentDate: appointmentDate ? new Date(appointmentDate) : undefined,
        startTime,
        endTime,
        status,
        remark,
      },
    });
    
    await logger.operation(
      req.user?.id,
      'update',
      'appointment',
      Number(id),
      'appointment',
      '更新预约信息',
      req
    );
    
    success(res, updated, '更新成功');
  } catch (err) {
    logger.error('更新预约失败', { error: err.message, id: req.params.id });
    error(res, '更新预约失败', 500);
  }
}

async function confirmAppointment(req, res) {
  try {
    const { id } = req.params;
    
    const appointment = await prisma.appointment.findUnique({
      where: { id: Number(id) },
    });
    
    if (!appointment) {
      return error(res, '预约不存在', 404);
    }
    
    if (appointment.status !== 'pending') {
      return error(res, '只能确认待确认的预约', 400);
    }
    
    const updated = await prisma.appointment.update({
      where: { id: Number(id) },
      data: { status: 'confirmed' },
    });
    
    await logger.operation(
      req.user?.id,
      'confirm',
      'appointment',
      Number(id),
      'appointment',
      '确认预约',
      req
    );
    
    success(res, updated, '确认成功');
  } catch (err) {
    logger.error('确认预约失败', { error: err.message, id: req.params.id });
    error(res, '确认预约失败', 500);
  }
}

async function completeAppointment(req, res) {
  try {
    const { id } = req.params;
    const { actualAmount, consumeItems = true } = req.body;
    
    const appointment = await prisma.appointment.findUnique({
      where: { id: Number(id) },
      include: {
        items: true,
        member: true,
      },
    });
    
    if (!appointment) {
      return error(res, '预约不存在', 404);
    }
    
    if (appointment.status === 'completed') {
      return error(res, '预约已完成', 400);
    }
    
    if (appointment.status === 'cancelled') {
      return error(res, '已取消的预约不能完成', 400);
    }
    
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.appointment.update({
        where: { id: Number(id) },
        data: {
          status: 'completed',
          actualAmount: actualAmount !== undefined ? Number(actualAmount) : appointment.totalAmount,
        },
        include: {
          items: true,
        },
      });
      
      if (consumeItems) {
        for (const item of appointment.items) {
          await tx.appointmentItem.update({
            where: { id: item.id },
            data: {
              isConsumed: true,
              consumedAt: new Date(),
            },
          });
          
          const memberTreatments = await tx.memberTreatment.findMany({
            where: {
              memberId: appointment.memberId,
              treatmentId: item.treatmentId,
              status: 'active',
              remainingSessions: { gt: 0 },
            },
            orderBy: { purchaseDate: 'asc' },
          });
          
          let remainingToDeduct = item.quantity;
          for (const mt of memberTreatments) {
            if (remainingToDeduct <= 0) break;
            const deduct = Math.min(mt.remainingSessions, remainingToDeduct);
            await tx.memberTreatment.update({
              where: { id: mt.id },
              data: {
                usedSessions: { increment: deduct },
                remainingSessions: { decrement: deduct },
              },
            });
            remainingToDeduct -= deduct;
          }
        }
      }
      
      await tx.member.update({
        where: { id: appointment.memberId },
        data: { lastVisitAt: new Date() },
      });
      
      return result;
    });
    
    await logger.operation(
      req.user?.id,
      'complete',
      'appointment',
      Number(id),
      'appointment',
      '完成预约',
      req
    );
    
    success(res, updated, '完成成功');
  } catch (err) {
    logger.error('完成预约失败', { error: err.message, id: req.params.id });
    error(res, '完成预约失败', 500);
  }
}

async function cancelAppointment(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const appointment = await prisma.appointment.findUnique({
      where: { id: Number(id) },
    });
    
    if (!appointment) {
      return error(res, '预约不存在', 404);
    }
    
    if (appointment.status === 'completed') {
      return error(res, '已完成的预约不能取消', 400);
    }
    
    if (appointment.status === 'cancelled') {
      return error(res, '预约已取消', 400);
    }
    
    const updated = await prisma.appointment.update({
      where: { id: Number(id) },
      data: {
        status: 'cancelled',
        remark: reason ? (appointment.remark ? `${appointment.remark}\n取消原因: ${reason}` : `取消原因: ${reason}`) : appointment.remark,
      },
    });
    
    await logger.operation(
      req.user?.id,
      'cancel',
      'appointment',
      Number(id),
      'appointment',
      `取消预约: ${reason || '未填原因'}`,
      req
    );
    
    success(res, updated, '取消成功');
  } catch (err) {
    logger.error('取消预约失败', { error: err.message, id: req.params.id });
    error(res, '取消预约失败', 500);
  }
}

async function deleteAppointment(req, res) {
  try {
    const { id } = req.params;
    
    const appointment = await prisma.appointment.findUnique({
      where: { id: Number(id) },
    });
    
    if (!appointment) {
      return error(res, '预约不存在', 404);
    }
    
    await prisma.appointment.delete({
      where: { id: Number(id) },
    });
    
    await logger.operation(
      req.user?.id,
      'delete',
      'appointment',
      Number(id),
      'appointment',
      '删除预约',
      req
    );
    
    success(res, null, '删除成功');
  } catch (err) {
    logger.error('删除预约失败', { error: err.message, id: req.params.id });
    error(res, '删除预约失败', 500);
  }
}

module.exports = {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  confirmAppointment,
  completeAppointment,
  cancelAppointment,
  deleteAppointment,
};
