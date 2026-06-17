import type { HttpContext } from '@adonisjs/core/http'
import Order from '#models/order'
import OrderLog from '#models/order_log'
import env from '#start/env'
import { createOrderValidator, orderListValidator } from '#validators/order'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import OrderEvaluation from '#models/order_evaluation'

export default class OrdersController {
  async generateOrderNo(): Promise<string> {
    const date = DateTime.now().toFormat('yyyyMMdd')
    const prefix = `ORD${date}`

    const lastOrder = await Order.query()
      .where('orderNo', 'like', `${prefix}%`)
      .orderBy('id', 'desc')
      .first()

    let sequence = 1
    if (lastOrder) {
      const seqStr = lastOrder.orderNo.slice(prefix.length)
      sequence = parseInt(seqStr, 10) + 1
    }

    return `${prefix}${sequence.toString().padStart(4, '0')}`
  }

  async create({ request, response, auth }: HttpContext) {
    const data = await request.validateUsing(createOrderValidator)
    const user = auth.user!

    const orderNo = await this.generateOrderNo()

    const isDemo = env.get('ENABLE_DEMO_DATA', false) === 'true'

    const order = await db.transaction(async (trx) => {
      const order = await Order.create({
        orderNo,
        userId: user.id,
        deviceType: data.deviceType,
        faultDescription: data.faultDescription,
        faultPhotos: data.faultPhotos || [],
        address: data.address,
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        appointmentTime: data.appointmentTime,
        communityId: data.communityId,
        channel: data.channel,
        status: 'pending',
        remark: data.remark,
        isDemo,
      }, { client: trx })

      await OrderLog.create({
        orderId: order.id,
        operatorId: user.id,
        action: 'create',
        content: '用户创建订单',
      }, { client: trx })

      return order
    })

    return response.status(201).json({
      message: '订单创建成功',
      data: order,
    })
  }

  async myOrders({ request, response, auth }: HttpContext) {
    const { page = 1, perPage = 10, status } = await request.validateUsing(orderListValidator)
    const user = auth.user!

    const query = Order.query()
      .where('userId', user.id)
      .orderBy('createdAt', 'desc')

    if (status) {
      query.where('status', status)
    }

    const orders = await query.paginate(page, perPage)

    return response.json({
      data: orders.toJSON(),
    })
  }

  async show({ params, response, auth }: HttpContext) {
    const user = auth.user!

    const order = await Order.query()
      .where('id', params.id)
      .where('userId', user.id)
      .preload('technician')
      .preload('logs', (logsQuery) => {
        logsQuery.orderBy('createdAt', 'desc')
      })
      .preload('evaluation')
      .first()

    if (!order) {
      return response.status(404).json({ message: '订单不存在' })
    }

    return response.json({ data: order })
  }

  async cancel({ params, request, response, auth }: HttpContext) {
    const { reason } = request.only(['reason']) as { reason?: string }
    const user = auth.user!

    const order = await Order.query()
      .where('id', params.id)
      .where('userId', user.id)
      .first()

    if (!order) {
      return response.status(404).json({ message: '订单不存在' })
    }

    if (order.status !== 'pending') {
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
        operatorId: user.id,
        action: 'cancel',
        content: reason ? `用户取消订单，原因：${reason}` : '用户取消订单',
      }, { client: trx })
    })

    return response.json({
      message: '订单已取消',
      data: order,
    })
  }

  async evaluate({ params, request, response, auth }: HttpContext) {
    const { rating, content, isRepurchase, channel } = request.only([
      'rating',
      'content',
      'isRepurchase',
      'channel',
    ]) as {
      rating: number
      content?: string
      isRepurchase?: boolean
      channel?: string
    }
    const user = auth.user!

    const order = await Order.query()
      .where('id', params.id)
      .where('userId', user.id)
      .first()

    if (!order) {
      return response.status(404).json({ message: '订单不存在' })
    }

    if (order.status !== 'completed') {
      return response
        .status(400)
        .json({ message: '只有已完成的订单才能评价' })
    }

    const existingEvaluation = await OrderEvaluation.query()
      .where('orderId', order.id)
      .first()

    if (existingEvaluation) {
      return response
        .status(400)
        .json({ message: '该订单已评价过' })
    }

    const evaluation = await OrderEvaluation.create({
      orderId: order.id,
      rating,
      content,
      isRepurchase: isRepurchase || false,
      channel,
    })

    return response.status(201).json({
      message: '评价成功',
      data: evaluation,
    })
  }
}
