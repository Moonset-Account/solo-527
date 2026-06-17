import type { HttpContext } from '@adonisjs/core/http'
import Order from '#models/order'
import OrderLog from '#models/order_log'
import Technician from '#models/technician'
import AttendanceRecord from '#models/attendance_record'
import {
  orderListValidator,
  assignOrderValidator,
  rescheduleValidator,
  updateOrderValidator,
} from '#validators/order'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

export default class AdminOrdersController {
  async index({ request, response }: HttpContext) {
    const {
      page = 1,
      perPage = 10,
      status,
      keyword,
      startDate,
      endDate,
    } = await request.validateUsing(orderListValidator)

    const query = Order.query()
      .where('isDemo', false)
      .orderBy('createdAt', 'desc')

    if (status) {
      query.where('status', status)
    }

    if (keyword) {
      query.where((subQuery) => {
        subQuery
          .where('orderNo', 'like', `%${keyword}%`)
          .orWhere('contactName', 'like', `%${keyword}%`)
          .orWhere('contactPhone', 'like', `%${keyword}%`)
          .orWhere('address', 'like', `%${keyword}%`)
      })
    }

    if (startDate) {
      query.where('appointmentTime', '>=', startDate)
    }

    if (endDate) {
      query.where('appointmentTime', '<=', endDate)
    }

    const orders = await query
      .preload('user')
      .preload('technician')
      .paginate(page, perPage)

    return response.json({
      data: orders.toJSON(),
    })
  }

  async show({ params, response }: HttpContext) {
    const order = await Order.query()
      .where('id', params.id)
      .preload('user')
      .preload('technician')
      .preload('logs', (logsQuery) => {
        logsQuery.orderBy('createdAt', 'desc').preload('operator')
      })
      .preload('evaluation')
      .first()

    if (!order) {
      return response.status(404).json({ message: '订单不存在' })
    }

    return response.json({ data: order })
  }

  async assign({ params, request, response, auth }: HttpContext) {
    const { technicianId } = await request.validateUsing(assignOrderValidator)
    const admin = auth.user!

    const order = await Order.find(params.id)
    if (!order) {
      return response.status(404).json({ message: '订单不存在' })
    }

    if (order.status !== 'pending') {
      return response
        .status(400)
        .json({ message: '只有待分配的订单才能分配师傅' })
    }

    const technician = await Technician.find(technicianId)
    if (!technician) {
      return response.status(404).json({ message: '师傅不存在' })
    }

    if (technician.status !== 'active') {
      return response
        .status(400)
        .json({ message: '该师傅当前不可接单' })
    }

    const appointmentDate = order.appointmentTime.toISODate()
    const dayOrdersCount = await Order.query()
      .where('technicianId', technicianId)
      .whereRaw('DATE(appointment_time) = ?', [appointmentDate])
      .where('status', '!=', 'cancelled')
      .count('* as total')

    const count = parseInt(dayOrdersCount[0].$extras.total, 10)

    if (count >= technician.dailyLimit) {
      return response
        .status(400)
        .json({ message: '该师傅当日订单已满，请选择其他师傅或改约' })
    }

    await db.transaction(async (trx) => {
      order.technicianId = technicianId
      order.status = 'assigned'
      order.useTransaction(trx)
      await order.save()

      await OrderLog.create({
        orderId: order.id,
        operatorId: admin.id,
        action: 'assign',
        content: `分配师傅：${technician.name}`,
      }, { client: trx })

      await AttendanceRecord.create({
        technicianId: technicianId,
        orderId: order.id,
        scheduledTime: order.appointmentTime,
      }, { client: trx })
    })

    return response.json({
      message: '订单分配成功',
      data: order,
    })
  }

  async reschedule({ params, request, response, auth }: HttpContext) {
    const { appointmentTime, reason } = await request.validateUsing(rescheduleValidator)
    const admin = auth.user!

    const order = await Order.find(params.id)
    if (!order) {
      return response.status(404).json({ message: '订单不存在' })
    }

    if (order.status === 'completed' || order.status === 'cancelled') {
      return response
        .status(400)
        .json({ message: '当前订单状态不能改约' })
    }

    const oldTime = order.appointmentTime.toFormat('yyyy-MM-dd HH:mm')
    const newTime = DateTime.fromJSDate(appointmentTime).toFormat('yyyy-MM-dd HH:mm')

    await db.transaction(async (trx) => {
      order.appointmentTime = appointmentTime
      order.useTransaction(trx)
      await order.save()

      if (order.technicianId) {
        const record = await AttendanceRecord.query()
          .where('orderId', order.id)
          .first()

        if (record) {
          record.scheduledTime = appointmentTime
          record.useTransaction(trx)
          await record.save()
        }
      }

      await OrderLog.create({
        orderId: order.id,
        operatorId: admin.id,
        action: 'reschedule',
        content: `改约：${oldTime} → ${newTime}${reason ? `，原因：${reason}` : ''}`,
      }, { client: trx })
    })

    return response.json({
      message: '改约成功',
      data: order,
    })
  }

  async cancel({ params, request, response, auth }: HttpContext) {
    const { reason } = request.only(['reason']) as { reason?: string }
    const admin = auth.user!

    const order = await Order.find(params.id)
    if (!order) {
      return response.status(404).json({ message: '订单不存在' })
    }

    if (order.status === 'completed' || order.status === 'cancelled') {
      return response
        .status(400)
        .json({ message: '当前订单状态不能取消' })
    }

    await db.transaction(async (trx) => {
      order.status = 'cancelled'
      order.useTransaction(trx)
      await order.save()

      await OrderLog.create({
        orderId: order.id,
        operatorId: admin.id,
        action: 'admin_cancel',
        content: reason ? `管理员取消订单，原因：${reason}` : '管理员取消订单',
      }, { client: trx })
    })

    return response.json({
      message: '订单已取消',
      data: order,
    })
  }

  async updateStatus({ params, request, response, auth }: HttpContext) {
    const { status, price, remark } = await request.validateUsing(updateOrderValidator)
    const admin = auth.user!

    const order = await Order.find(params.id)
    if (!order) {
      return response.status(404).json({ message: '订单不存在' })
    }

    const oldStatus = order.status

    await db.transaction(async (trx) => {
      if (status) {
        order.status = status
      }
      if (price !== undefined) {
        order.price = price
      }
      if (remark !== undefined) {
        order.remark = remark
      }
      order.useTransaction(trx)
      await order.save()

      let content = '更新订单信息'
      if (status && status !== oldStatus) {
        content = `状态变更：${oldStatus} → ${status}`
      }

      await OrderLog.create({
        orderId: order.id,
        operatorId: admin.id,
        action: 'update',
        content,
      }, { client: trx })
    })

    return response.json({
      message: '订单更新成功',
      data: order,
    })
  }

  async checkTechnicianLoad({ request, response }: HttpContext) {
    const { technicianId, date } = request.qs() as { technicianId: string; date: string }

    if (!technicianId || !date) {
      return response
        .status(400)
        .json({ message: '请提供 technicianId 和 date 参数' })
    }

    const technician = await Technician.find(technicianId)
    if (!technician) {
      return response.status(404).json({ message: '师傅不存在' })
    }

    const dayOrders = await Order.query()
      .where('technicianId', parseInt(technicianId, 10))
      .whereRaw('DATE(appointment_time) = ?', [date])
      .where('status', '!=', 'cancelled')
      .count('* as total')

    const count = parseInt(dayOrders[0].$extras.total, 10)

    return response.json({
      data: {
        technicianId: technician.id,
        name: technician.name,
        dailyLimit: technician.dailyLimit,
        currentLoad: count,
        remaining: technician.dailyLimit - count,
        isAvailable: count < technician.dailyLimit,
      },
    })
  }
}
