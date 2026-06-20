import { Op } from 'sequelize'
import models from '../Models/index.js'
import sequelize from '../../config/database.js'

const { TourSchedule, Tour, InventoryLog, User } = models

export async function getSummary(params = {}) {
  const today = new Date().toISOString().split('T')[0]

  const schedules = await TourSchedule.findAll({
    where: {
      tourDate: { [Op.gte]: today },
      status: { [Op.ne]: 'cancelled' },
    },
    include: [
      { model: Tour, as: 'tour', attributes: ['id', 'name', 'code'] },
    ],
    order: [['tourDate', 'ASC'], ['startTime', 'ASC']],
  })

  const list = schedules.map((s) => {
    const remaining = (s.capacity || 0) - (s.booked || 0)
    const rate = s.capacity > 0 ? Math.round((s.booked / s.capacity) * 10000) / 100 : 0
    return {
      ...s.toJSON(),
      remaining,
      occupancyRate: rate,
    }
  })

  const totalCapacity = schedules.reduce((sum, s) => sum + (s.capacity || 0), 0)
  const totalBooked = schedules.reduce((sum, s) => sum + (s.booked || 0), 0)

  const lowInventory = list.filter((s) => s.remaining <= 5)
  const highOccupancy = list.filter((s) => s.occupancyRate >= 80)

  return {
    list,
    summary: {
      totalSchedules: schedules.length,
      totalCapacity,
      totalBooked,
      totalRemaining: totalCapacity - totalBooked,
      overallRate: totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0,
      lowInventoryCount: lowInventory.length,
      highOccupancyCount: highOccupancy.length,
    },
  }
}

export async function getDetail(scheduleId) {
  const schedule = await TourSchedule.findByPk(scheduleId, {
    include: [
      { model: Tour, as: 'tour', attributes: ['id', 'name', 'code'] },
    ],
  })

  if (!schedule) {
    throw new Error('排期不存在')
  }

  const remaining = (schedule.capacity || 0) - (schedule.booked || 0)
  const rate = schedule.capacity > 0 ? Math.round((schedule.booked / schedule.capacity) * 10000) / 100 : 0

  return {
    ...schedule.toJSON(),
    remaining,
    occupancyRate: rate,
  }
}

export async function getLogs(scheduleId, params = {}) {
  const { page = 1, pageSize = 20 } = params

  const where = { scheduleId }

  const { count, rows } = await InventoryLog.findAndCountAll({
    where,
    include: [
      { model: User, as: 'operator', attributes: ['id', 'name'] },
    ],
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

export async function adjustInventory(scheduleId, data = {}, operatorId) {
  const { changeType, quantity, remark } = data

  if (!changeType || !quantity) {
    throw new Error('缺少必要参数')
  }

  const t = await sequelize.transaction()

  try {
    const schedule = await TourSchedule.findByPk(scheduleId, { transaction: t })
    if (!schedule) {
      throw new Error('排期不存在')
    }

    const beforeQuantity = schedule.booked

    let changeQuantity
    let afterQuantity

    if (changeType === 'add') {
      changeQuantity = Math.abs(quantity)
      afterQuantity = beforeQuantity + changeQuantity
    } else if (changeType === 'reduce') {
      changeQuantity = -Math.abs(quantity)
      afterQuantity = Math.max(0, beforeQuantity - Math.abs(quantity))
    } else {
      throw new Error('无效的调整类型')
    }

    if (afterQuantity > schedule.capacity) {
      throw new Error('调整后库存超过容量')
    }

    await schedule.update({ booked: afterQuantity }, { transaction: t })

    await InventoryLog.create(
      {
        scheduleId,
        changeType: 'manual',
        changeQuantity,
        beforeQuantity,
        afterQuantity,
        operatorId,
        remark: remark || '手动调整库存',
      },
      { transaction: t }
    )

    await t.commit()

    return getDetail(scheduleId)
  } catch (error) {
    await t.rollback()
    throw error
  }
}

export default {
  getSummary,
  getDetail,
  getLogs,
  adjustInventory,
}
