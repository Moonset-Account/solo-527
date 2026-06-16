const express = require('express');
const dayjs = require('dayjs');
const { Parser } = require('json2csv');
const prisma = require('../prisma');

const router = express.Router();

const STATUS_LABEL = {
  PENDING: '待确认',
  CONFIRMED: '已确认',
  CHECKED_IN: '已到店',
  COMPLETED: '已完成',
  NO_SHOW: '爽约',
  CANCELLED: '已取消',
};

router.get('/appointments', async (req, res, next) => {
  try {
    const { status, counselorId, startDate, endDate, keyword, format = 'csv' } = req.query;

    const where = {};
    if (status) where.status = status;
    if (counselorId) where.counselorId = parseInt(counselorId);
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
      ];
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        counselor: true,
        timeSlot: true,
        operationLogs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    const rows = appointments.map((apt) => {
      const completed = apt.status === 'COMPLETED' || apt.status === 'CHECKED_IN';
      const noShow = apt.status === 'NO_SHOW';
      const total = completed || noShow ? 1 : 0;
      const checkInEfficiency = total > 0 ? (completed ? 100 : 0) : null;

      return {
        预约编号: apt.id,
        预约时间: dayjs(apt.createdAt).format('YYYY-MM-DD HH:mm:ss'),
        咨询日期: dayjs(apt.timeSlot.date).format('YYYY-MM-DD'),
        时段: `${apt.timeSlot.startTime}-${apt.timeSlot.endTime}`,
        服务时长: `${apt.timeSlot.duration}分钟`,
        咨询师: apt.counselor.name,
        来访人: apt.clientName,
        联系电话: apt.clientPhone,
        邮箱: apt.clientEmail || '',
        来访原因: apt.reason,
        状态: STATUS_LABEL[apt.status] || apt.status,
        到店时间: apt.checkInTime ? dayjs(apt.checkInTime).format('YYYY-MM-DD HH:mm:ss') : '',
        结束时间: apt.checkOutTime ? dayjs(apt.checkOutTime).format('YYYY-MM-DD HH:mm:ss') : '',
        是否候补: apt.isWaitlisted ? '是' : '否',
        候补是否超时: apt.waitlistExpired ? '是' : '否',
        爽约原因: apt.noShowReason || '',
        核销效率: checkInEfficiency !== null ? `${checkInEfficiency}%` : '未完成',
        候补超时: apt.waitlistExpired ? '是' : '否',
        最近一次操作: apt.lastOperation || '',
        最近操作时间: apt.lastOperatedAt ? dayjs(apt.lastOperatedAt).format('YYYY-MM-DD HH:mm:ss') : '',
      };
    });

    const filename = `预约明细_${dayjs().format('YYYYMMDD_HHmmss')}`;

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}.json`);
      return res.json(rows);
    }

    const parser = new Parser();
    const csv = parser.parse(rows);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}.csv`);
    res.write('\uFEFF');
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
