const express = require('express');
const dayjs = require('dayjs');
const prisma = require('../prisma');

const router = express.Router();

const logOperation = async (prismaTx, appointmentId, action, operator, remark) => {
  await prismaTx.operationLog.create({
    data: { appointmentId, action, operator, remark },
  });
  await prismaTx.appointment.update({
    where: { id: appointmentId },
    data: { lastOperation: action, lastOperatedAt: new Date() },
  });
};

router.get('/', async (req, res, next) => {
  try {
    const {
      status,
      counselorId,
      startDate,
      endDate,
      keyword,
      isWaitlisted,
      waitlistExpired,
      page = 1,
      pageSize = 20,
    } = req.query;

    const where = {};

    if (status) {
      where.status = status;
    }
    if (counselorId) {
      where.counselorId = parseInt(counselorId);
    }
    if (startDate && endDate) {
      where.timeSlot = {
        date: {
          gte: dayjs(startDate).startOf('day').toDate(),
          lte: dayjs(endDate).endOf('day').toDate(),
        },
      };
    }
    if (keyword) {
      where.OR = [
        { clientName: { contains: keyword } },
        { clientPhone: { contains: keyword } },
        { clientEmail: { contains: keyword } },
      ];
    }
    if (isWaitlisted !== undefined) {
      where.isWaitlisted = isWaitlisted === 'true';
    }
    if (waitlistExpired !== undefined) {
      where.waitlistExpired = waitlistExpired === 'true';
    }

    const [total, appointments] = await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.findMany({
        where,
        include: {
          counselor: true,
          timeSlot: true,
          operationLogs: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
        orderBy: [{ createdAt: 'desc' }],
        skip: (parseInt(page) - 1) * parseInt(pageSize),
        take: parseInt(pageSize),
      }),
    ]);

    res.json({
      success: true,
      data: { list: appointments, total, page: parseInt(page), pageSize: parseInt(pageSize) },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        counselor: true,
        timeSlot: true,
        operationLogs: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!appointment) {
      return res.status(404).json({ success: false, message: '预约不存在' });
    }
    res.json({ success: true, data: appointment });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { timeSlotId, clientName, clientPhone, clientEmail, reason } = req.body;

    if (!timeSlotId || !clientName || !clientPhone || !reason) {
      return res.status(400).json({ success: false, message: '请填写完整信息' });
    }

    const slot = await prisma.timeSlot.findUnique({
      where: { id: parseInt(timeSlotId) },
      include: { appointments: true },
    });

    if (!slot || !slot.isActive) {
      return res.status(400).json({ success: false, message: '时段无效' });
    }

    const isFull = slot.bookedCount >= slot.capacity;

    const result = await prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.create({
        data: {
          timeSlotId: slot.id,
          counselorId: slot.counselorId,
          clientName,
          clientPhone,
          clientEmail,
          reason,
          isWaitlisted: isFull,
          status: isFull ? 'PENDING' : 'CONFIRMED',
          lastOperation: isFull ? '加入候补' : '创建预约',
          lastOperatedAt: new Date(),
        },
      });

      if (!isFull) {
        await tx.timeSlot.update({
          where: { id: slot.id },
          data: { bookedCount: { increment: 1 } },
        });
      }

      await tx.operationLog.create({
        data: {
          appointmentId: appointment.id,
          action: isFull ? '加入候补' : '创建预约',
          operator: '客户端',
          remark: isFull ? '因时段已满加入候补' : '在线预约',
        },
      });

      return appointment;
    });

    res.json({
      success: true,
      data: result,
      message: isFull ? '已加入候补名单' : '预约成功',
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/confirm', async (req, res, next) => {
  try {
    const { operator = '管理员' } = req.body;
    await prisma.$transaction(async (tx) => {
      const apt = await tx.appointment.update({
        where: { id: parseInt(req.params.id) },
        data: { status: 'CONFIRMED' },
      });
      if (apt.isWaitlisted) {
        await tx.timeSlot.update({
          where: { id: apt.timeSlotId },
          data: { bookedCount: { increment: 1 } },
        });
      }
      await logOperation(tx, apt.id, '确认预约', operator, '');
    });
    res.json({ success: true, message: '已确认' });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/checkin', async (req, res, next) => {
  try {
    const { operator = '前台' } = req.body;
    await prisma.$transaction(async (tx) => {
      const apt = await tx.appointment.update({
        where: { id: parseInt(req.params.id) },
        data: { status: 'CHECKED_IN', checkInTime: new Date() },
      });
      await logOperation(tx, apt.id, '到店核销', operator, '');
    });
    res.json({ success: true, message: '已核销到店' });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/complete', async (req, res, next) => {
  try {
    const { operator = '咨询师' } = req.body;
    await prisma.$transaction(async (tx) => {
      const apt = await tx.appointment.update({
        where: { id: parseInt(req.params.id) },
        data: { status: 'COMPLETED', checkOutTime: new Date() },
      });
      await logOperation(tx, apt.id, '完成咨询', operator, '');
    });
    res.json({ success: true, message: '咨询已完成' });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/noshow', async (req, res, next) => {
  try {
    const { operator = '管理员', reason = '' } = req.body;
    await prisma.$transaction(async (tx) => {
      const apt = await tx.appointment.update({
        where: { id: parseInt(req.params.id) },
        data: { status: 'NO_SHOW', noShowReason: reason },
      });
      if (!apt.isWaitlisted) {
        await tx.timeSlot.update({
          where: { id: apt.timeSlotId },
          data: { bookedCount: { decrement: 1 } },
        });
      }
      await logOperation(tx, apt.id, '标记爽约', operator, reason);
    });
    res.json({ success: true, message: '已标记爽约' });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/cancel', async (req, res, next) => {
  try {
    const { operator = '用户', reason = '' } = req.body;
    await prisma.$transaction(async (tx) => {
      const apt = await tx.appointment.update({
        where: { id: parseInt(req.params.id) },
        data: { status: 'CANCELLED' },
      });
      if (!apt.isWaitlisted && apt.status !== 'NO_SHOW' && apt.status !== 'COMPLETED') {
        await tx.timeSlot.update({
          where: { id: apt.timeSlotId },
          data: { bookedCount: { decrement: 1 } },
        });
      }
      await logOperation(tx, apt.id, '取消预约', operator, reason);
    });
    res.json({ success: true, message: '已取消' });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/waitlist-expire', async (req, res, next) => {
  try {
    const { operator = '系统' } = req.body;
    await prisma.$transaction(async (tx) => {
      const apt = await tx.appointment.update({
        where: { id: parseInt(req.params.id) },
        data: { waitlistExpired: true, status: 'CANCELLED' },
      });
      await logOperation(tx, apt.id, '候补超时', operator, '候补等待超时自动取消');
    });
    res.json({ success: true, message: '候补已超时' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
