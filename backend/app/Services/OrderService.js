import { Op } from 'sequelize'
import models from '../Models/index.js'
import sequelize from '../../config/database.js'

const { Order, OrderItem, TourSchedule, Tour, InventoryLog, User } = models

function generateOrderNo() {
  const date = new Date()
  const prefix = 'TO' +
    date.getFullYear().toString().slice(-2) +
    (date.getMonth() + 1).toString().padStart(2, '0') +
    date.getDate().toString().padStart(2, '0')
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return prefix + random
}

export async function getList(params = {}) {
  const {
    page = 1,
    pageSize = 20,
    keyword,
    status,
    startDate,
    endDate,
    tourId,
  } = params

  const where = {}

  if (keyword) {
    where[Op.or] = [
      { orderNo: { [Op.iLike]: `%${keyword}%` } },
      { customerName: { [Op.iLike]: `%${keyword}%` } },
      { customerPhone: { [Op.iLike]: `%${keyword}%` } },
    ]
  }

  if (status) {
    where.status = status
  }

  if (startDate) {
    where.createdAt = { [Op.gte]: new Date(startDate) }
  }

  if (endDate) {
    where.createdAt = {
      ...(where.createdAt || {}),
      [Op.lte]: new Date(endDate + ' 23:59:59'),
    }
  }

  const itemWhere = {}
  if (tourId) itemWhere.tourId = tourId

  const include = [
    {
      model: OrderItem,
      as: 'items',
      where: Object.keys(itemWhere).length > 0 ? itemWhere : undefined,
      required: !!tourId,
      include: [{ model: Tour, as: 'tour', attributes: ['id', 'name'] }],
    },
    { model: User, as: 'confirmer', attributes: ['id', 'name'] },
  ]

  const { count, rows } = await Order.findAndCountAll({
    where,
    include,
    order: [['createdAt', 'DESC']],
    limit: Number(pageSize),
    offset: (Number(page) - 1) * Number(pageSize),
    distinct: true,
  })

  return {
    list: rows.map((r) => r.toJSON()),
    total: count,
    page: Number(page),
    pageSize: Number(pageSize),
    lastPage: Math.ceil(count / Number(pageSize)),
  }
}

export async function getDetail(id) {
  const order = await Order.findByPk(id, {
    include: [
      {
        model: OrderItem,
        as: 'items',
        include: [
          { model: Tour, as: 'tour', attributes: ['id', 'name', 'code'] },
          { model: TourSchedule, as: 'schedule', attributes: ['id', 'tourDate', 'startTime', 'endTime'] },
        ],
      },
      { model: User, as: 'confirmer', attributes: ['id', 'name'] },
      { model: User, as: 'refunder', attributes: ['id', 'name'] },
    ],
  })

  if (!order) {
    throw new Error('订单不存在')
  }

  return order.toJSON()
}

export async function createOrder(data = {}, operatorId) {
  const t = await sequelize.transaction()

  try {
    const orderNo = generateOrderNo()

    const order = await Order.create(
      {
        ...data,
        orderNo,
        status: 'pending_confirmation',
      },
      { transaction: t }
    )

    let totalAmount = 0

    for (const item of data.items || []) {
      const schedule = await TourSchedule.findByPk(item.scheduleId, { transaction: t })
      if (!schedule) {
        throw new Error('排期不存在')
      }

      const available = schedule.capacity - schedule.booked
      if (available < item.quantity) {
        throw new Error('库存不足')
      }

      const tour = await Tour.findByPk(item.tourId, { transaction: t })

      const subtotal = Number(tour.price) * item.quantity
      totalAmount += subtotal

      await OrderItem.create(
        {
          orderId: order.id,
          tourId: item.tourId,
          scheduleId: item.scheduleId,
          tourName: tour.name,
          tourDate: schedule.tourDate,
          startTime: schedule.startTime,
          quantity: item.quantity,
          unitPrice: tour.price,
          subtotal,
          travelers: item.travelers || [],
        },
        { transaction: t }
      )

      const beforeQty = schedule.booked
      const afterQty = schedule.booked + item.quantity

      await schedule.update({ booked: afterQty }, { transaction: t })

      await InventoryLog.create(
        {
          scheduleId: schedule.id,
          orderId: order.id,
          changeType: 'order',
          changeQuantity: item.quantity,
          beforeQuantity: beforeQty,
          afterQuantity: afterQty,
          operatorId,
          remark: '下单扣减库存',
        },
        { transaction: t }
      )
    }

    await order.update({ totalAmount, paidAmount: totalAmount }, { transaction: t })

    await t.commit()

    return getDetail(order.id)
  } catch (error) {
    await t.rollback()
    throw error
  }
}

export async function confirmOrder(id, userId) {
  const t = await sequelize.transaction()

  try {
    const order = await Order.findByPk(id, { transaction: t })
    if (!order) {
      throw new Error('订单不存在')
    }

    if (order.status !== 'pending_confirmation') {
      throw new Error('订单状态不允许确认')
    }

    await order.update(
      {
        status: 'confirmed',
        confirmedAt: new Date(),
        confirmedBy: userId,
      },
      { transaction: t }
    )

    const items = await OrderItem.findAll({ where: { orderId: id }, transaction: t })
    for (const item of items) {
      await item.update({ status: 'confirmed' }, { transaction: t })
    }

    await t.commit()

    return getDetail(id)
  } catch (error) {
    await t.rollback()
    throw error
  }
}

export async function refundOrder(id, data = {}, userId) {
  const { reason } = data || {}
  const t = await sequelize.transaction()

  try {
    const order = await Order.findByPk(id, {
      include: [{ model: OrderItem, as: 'items' }],
      transaction: t,
    })

    if (!order) {
      throw new Error('订单不存在')
    }

    if (!['confirmed', 'completed'].includes(order.status)) {
      throw new Error('订单状态不允许退款')
    }

    for (const item of order.items) {
      const schedule = await TourSchedule.findByPk(item.scheduleId, { transaction: t })
      if (schedule) {
        const beforeQty = schedule.booked
        const afterQty = Math.max(0, schedule.booked - item.quantity)

        await schedule.update({ booked: afterQty }, { transaction: t })

        await InventoryLog.create(
          {
            scheduleId: schedule.id,
            orderId: order.id,
            orderItemId: item.id,
            changeType: 'refund',
            changeQuantity: -item.quantity,
            beforeQuantity: beforeQty,
            afterQuantity: afterQty,
            operatorId: userId,
            remark: '退款释放库存',
          },
          { transaction: t }
        )
      }

      await item.update({ status: 'refunded' }, { transaction: t })
    }

    await order.update(
      {
        status: 'refunded',
        refundAmount: order.totalAmount,
        refundReason: reason,
        refundedAt: new Date(),
        refundedBy: userId,
      },
      { transaction: t }
    )

    await t.commit()

    return getDetail(id)
  } catch (error) {
    await t.rollback()
    throw error
  }
}

export async function cancelOrder(id, data = {}, userId) {
  const { reason } = data || {}
  const t = await sequelize.transaction()

  try {
    const order = await Order.findByPk(id, {
      include: [{ model: OrderItem, as: 'items' }],
      transaction: t,
    })

    if (!order) {
      throw new Error('订单不存在')
    }

    if (!['pending_payment', 'pending_confirmation'].includes(order.status)) {
      throw new Error('订单状态不允许取消')
    }

    for (const item of order.items) {
      if (item.status !== 'cancelled') {
        const schedule = await TourSchedule.findByPk(item.scheduleId, { transaction: t })
        if (schedule) {
          const beforeQty = schedule.booked
          const afterQty = Math.max(0, schedule.booked - item.quantity)

          await schedule.update({ booked: afterQty }, { transaction: t })

          await InventoryLog.create(
            {
              scheduleId: schedule.id,
              orderId: order.id,
              orderItemId: item.id,
              changeType: 'cancel',
              changeQuantity: -item.quantity,
              beforeQuantity: beforeQty,
              afterQuantity: afterQty,
              operatorId: userId,
              remark: '取消订单释放库存',
            },
            { transaction: t }
          )
        }

        await item.update({ status: 'cancelled' }, { transaction: t })
      }
    }

    await order.update(
      {
        status: 'cancelled',
        cancelReason: reason,
        cancelledAt: new Date(),
        cancelledBy: userId,
      },
      { transaction: t }
    )

    await t.commit()

    return getDetail(id)
  } catch (error) {
    await t.rollback()
    throw error
  }
}

export default {
  getList,
  getDetail,
  createOrder,
  confirmOrder,
  refundOrder,
  cancelOrder,
}
