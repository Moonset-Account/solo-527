import { Op } from 'sequelize'
import models from '../Models/index.js'

const { Driver, TourSchedule, Tour, Reminder, User } = models

export async function getList(params = {}) {
  const { page = 1, pageSize = 20, status, keyword } = params

  const where = {}

  if (status) where.status = status

  if (keyword) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${keyword}%` } },
      { phone: { [Op.iLike]: `%${keyword}%` } },
      { licenseNo: { [Op.iLike]: `%${keyword}%` } },
    ]
  }

  const { count, rows } = await Driver.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: Number(pageSize),
    offset: (Number(page) - 1) * Number(pageSize),
  })

  return {
    list: rows.map((r) => r.toJSON()),
    total: count,
    page: Number(page),
    pageSize: Number(pageSize),
    lastPage: Math.ceil(count / Number(pageSize)),
  }
}

export async function create(data = {}) {
  const { name, phone, licenseNo, status, remark } = data

  if (!name || !phone) {
    throw new Error('缺少必要参数')
  }

  const driver = await Driver.create({
    name,
    phone,
    licenseNo: licenseNo || null,
    status: status || 'active',
    delayCount: 0,
    delayMinutes: 0,
    remark: remark || null,
  })

  return driver.toJSON()
}

export async function update(driverId, data = {}) {
  const driver = await Driver.findByPk(driverId)

  if (!driver) {
    throw new Error('司机不存在')
  }

  const allowedFields = [
    'name',
    'phone',
    'licenseNo',
    'status',
    'remark',
  ]

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      driver[field] = data[field]
    }
  }

  await driver.save()

  return driver.toJSON()
}

export async function deleteDriver(driverId) {
  const driver = await Driver.findByPk(driverId)

  if (!driver) {
    throw new Error('司机不存在')
  }

  const activeScheduleCount = await TourSchedule.count({
    where: {
      driverId,
      status: { [Op.in]: ['scheduled', 'confirmed', 'in_progress'] },
    },
  })

  if (activeScheduleCount > 0) {
    throw new Error('该司机还有未完成的排期，无法删除')
  }

  await driver.destroy()

  return { success: true }
}

export async function recordDelay(driverId, minutes, reason, operatorId) {
  const driver = await Driver.findByPk(driverId)

  if (!driver) {
    throw new Error('司机不存在')
  }

  const delayMinutes = Math.abs(Number(minutes) || 0)

  if (delayMinutes <= 0) {
    throw new Error('延误分钟数无效')
  }

  await driver.update({
    delayCount: (driver.delayCount || 0) + 1,
    delayMinutes: (driver.delayMinutes || 0) + delayMinutes,
  })

  await Reminder.create({
    type: 'driver_delay',
    level: delayMinutes >= 30 ? 'urgent' : delayMinutes >= 15 ? 'imminent' : 'normal',
    title: `司机延误提醒 - ${driver.name}`,
    content: `司机【${driver.name}】延误 ${delayMinutes} 分钟。原因：${reason || '未说明'}`,
    recipientRoles: ['admin', 'operator'],
    status: 'unread',
    triggeredAt: new Date(),
  })

  return driver.toJSON()
}

export default {
  getList,
  create,
  update,
  deleteDriver,
  recordDelay,
}
