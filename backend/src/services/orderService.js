import { Op, Transaction } from 'sequelize'
import { Order, OrderItem, TourSchedule, Tour, InventoryLog, User } from '../db/models.js'
import sequelize from '../db/index.js'
import redis from '../config/redis.js'

const generateOrderNo = () => {
  const date = new Date()
  const prefix = 'TO' + date.getFullYear().toString().slice(-2) +
    (date.getMonth() + 1).toString().padStart(2, '0') +
    date.getDate().toString().padStart(2, '0')
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return prefix + random
}

export const getOrders = async (params = {}) => {
  const {
    page = 1,
    pageSize = 20,
    keyword,
    status,
    startDate,
    endDate,
    tourId
  } = params

  const where = {}

  if (keyword) {
    where[Op.or] = [
      { orderNo: { [Op.iLike]: `%${keyword}%` } },
      { customerName: { [Op.iLike]: `%${keyword}%` } },
      { customerPhone: { [Op.iLike]: `%${keyword}%` } }
    ]
  }

  if (status) {
    where.status = status
  }

  if (startDate) {
    where.createdAt = { ...where.createdAt, [Op.gte]: new Date(startDate) }
  }

  if (endDate) {
    where.createdAt = { ...where.createdAt, [Op.lte]: new Date(endDate + ' 23:59:59') }
  }

  const itemWhere = {}
  if (tourId) {
    itemWhere.tourId = tourId
  }

  const { count, rows } = await Order.findAndCountAll({
    where,
    include: [
      {
        model: OrderItem,
        as: 'items',
        where: Object.keys(itemWhere).length > 0 ? itemWhere : undefined,
        required: !!tourId,
        include: [
          { model: Tour, as: 'tour', attributes: ['id', 'name'] }
        ]
      },
      { model: User, as: 'confirmer', attributes: ['id', 'name'] }
    ],
    order: [['createdAt', 'DESC']],
    limit: pageSize,
    offset: (page - 1) * pageSize
  })

  return {
    list: rows,
    total: count,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  }
}

export const getOrderById = async (id) => {
  const order = await Order.findByPk(id, {
    include: [
      {
        model: OrderItem,
        as: 'items',
        include: [
          { model: Tour, as: 'tour', attributes: ['id', 'name', 'code'] },
          { model: TourSchedule, as: 'schedule', attributes: ['id', 'tourDate', 'startTime', 'endTime'] }
        ]
      },
      { model: User, as: 'confirmer', attributes: ['id', 'name'] },
      { model: User, as: 'refunder', attributes: ['id', 'name'] }
    ]
  })

  return order
}

export const createOrder = async (data) => {
  const t = await sequelize.transaction()

  try {
    const orderNo = generateOrderNo()

    const order = await Order.create({
      ...data,
      orderNo,
      status: 'pending_confirmation'
    }, { transaction: t })

    let totalAmount = 0

    for (const item of data.items) {
      const schedule = await TourSchedule.findByPk(item.scheduleId, { transaction: t })
      if (!schedule) {
        throw new Error('排期不存在')
      }

      const available = schedule.capacity - schedule.booked
      if (available < item.quantity) {
        throw new Error('库存不足')
      }

      const tour = await Tour.findByPk(item.tourId, { transaction: t })

      const subtotal = tour.price * item.quantity
      totalAmount += subtotal

      await OrderItem.create({
        orderId: order.id,
        tourId: item.tourId,
        scheduleId: item.scheduleId,
        tourName: tour.name,
        tourDate: schedule.tourDate,
        startTime: schedule.startTime,
        quantity: item.quantity,
        unitPrice: tour.price,
        subtotal,
        traveles: item.traveles || []
      }, { transaction: t })

      const beforeQty = schedule.booked
      const afterQty = schedule.booked + item.quantity

      await schedule.update({ booked: afterQty }, { transaction: t })

      await InventoryLog.create({
        scheduleId: schedule.id,
        orderId: order.id,
        changeType: 'order',
        quantityChange: item.quantity,
        beforeQuantity: beforeQty,
        afterQuantity: afterQty,
        remark: '下单扣减库存'
      }, { transaction: t })
    }

    await order.update({ totalAmount, paidAmount: totalAmount }, { transaction: t })

    await t.commit()

    await redis.del(`tour:schedule:list`)

    return getOrderById(order.id)
  } catch (error) {
    await t.rollback()
    throw error
  }
}

export const confirmOrder = async (id, userId) => {
  const t = await sequelize.transaction()

  try {
    const order = await Order.findByPk(id, { transaction: t })
    if (!order) {
      throw new Error('订单不存在')
    }

    if (order.status !== 'pending_confirmation') {
      throw new Error('订单状态不允许确认')
    }

    await order.update({
      status: 'confirmed',
      confirmedAt: new Date(),
      confirmedBy: userId
    }, { transaction: t })

    const items = await OrderItem.findAll({ where: { orderId: id }, transaction: t })
    for (const item of items) {
      await item.update({ status: 'confirmed' }, { transaction: t })
    }

    await t.commit()

    return getOrderById(id)
  } catch (error) {
    await t.rollback()
    throw error
  }
}

export const refundOrder = async (id, reason, userId) => {
  const t = await sequelize.transaction()

  try {
    const order = await Order.findByPk(id, {
      include: [{ model: OrderItem, as: 'items' }],
      transaction: t
    })

    if (!order) {
      throw new Error('订单不存在')
    }

    if (!['confirmed', 'in_progress'].includes(order.status)) {
      throw new Error('订单状态不允许退款')
    }

    for (const item of order.items) {
      const schedule = await TourSchedule.findByPk(item.scheduleId, { transaction: t })
      if (schedule) {
        const beforeQty = schedule.booked
        const afterQty = Math.max(0, schedule.booked - item.quantity)

        await schedule.update({ booked: afterQty }, { transaction: t })

        await InventoryLog.create({
          scheduleId: schedule.id,
          orderId: order.id,
          orderItemId: item.id,
          changeType: 'refund',
          quantityChange: -item.quantity,
          beforeQuantity: beforeQty,
          afterQuantity: afterQty,
          operatorId: userId,
          remark: '退款释放库存'
        }, { transaction: t })
      }

      await item.update({ status: 'refunded' }, { transaction: t })
    }

    await order.update({
      status: 'refunded',
      refundAmount: order.totalAmount,
      refundReason: reason,
      refundedAt: new Date(),
      refundedBy: userId
    }, { transaction: t })

    await t.commit()

    await redis.del(`tour:schedule:list`)

    return getOrderById(id)
  } catch (error) {
    await t.rollback()
    throw error
  }
}

export const cancelOrder = async (id, reason, userId) => {
  const t = await sequelize.transaction()

  try {
    const order = await Order.findByPk(id, {
      include: [{ model: OrderItem, as: 'items' }],
      transaction: t
    })

    if (!order) {
      throw new Error('订单不存在')
    }

    if (!['pending_payment', 'pending_confirmation'].includes(order.status)) {
      throw new Error('订单状态不允许取消')
    }

    for (const item of order.items) {
      const schedule = await TourSchedule.findByPk(item.scheduleId, { transaction: t })
      if (schedule && item.status !== 'cancelled') {
        const beforeQty = schedule.booked
        const afterQty = Math.max(0, schedule.booked - item.quantity)

        await schedule.update({ booked: afterQty }, { transaction: t })

        await InventoryLog.create({
          scheduleId: schedule.id,
          orderId: order.id,
          orderItemId: item.id,
          changeType: 'cancel',
          quantityChange: -item.quantity,
          beforeQuantity: beforeQty,
          afterQuantity: afterQty,
          operatorId: userId,
          remark: '取消订单释放库存'
        }, { transaction: t })
      }

      await item.update({ status: 'cancelled' }, { transaction: t })
    }

    await order.update({
      status: 'cancelled',
      cancelReason: reason,
      cancelledAt: new Date(),
      cancelledBy: userId
    }, { transaction: t })

    await t.commit()

    return getOrderById(id)
  } catch (error) {
    await t.rollback()
    throw error
  }
}
