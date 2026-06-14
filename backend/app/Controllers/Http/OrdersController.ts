import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Order from 'App/Models/Order'
import OrderNode from 'App/Models/OrderNode'
import OrderComment from 'App/Models/OrderComment'
import OrderAttachment from 'App/Models/OrderAttachment'
import RevisionService from 'App/Services/RevisionService'
import Application from '@ioc:Adonis/Core/Application'
import { schema } from '@ioc:Adonis/Core/Validator'
import { DateTime } from 'luxon'
import fs from 'fs/promises'

export default class OrdersController {
  public async index({ request, response }: HttpContextContract) {
    const page = request.input('page', 1)
    const perPage = request.input('perPage', 20)
    const type = request.input('type')
    const status = request.input('status')
    const paymentStatus = request.input('paymentStatus')
    const startDate = request.input('startDate')
    const endDate = request.input('endDate')
    const keyword = request.input('keyword')

    const query = Order.query().preload('user').preload('partnership')
    if (type) query.where('type', type)
    if (status) query.where('status', status)
    if (paymentStatus) query.where('paymentStatus', paymentStatus)
    if (startDate) query.where('createdAt', '>=', startDate)
    if (endDate) query.where('createdAt', '<=', endDate)
    if (keyword) {
      query.where('orderNo', 'like', `%${keyword}%`)
    }

    const orders = await query.orderBy('createdAt', 'desc').paginate(page, perPage)
    return response.json(orders)
  }

  public async store({ request, response, auth }: HttpContextContract) {
    const validationSchema = schema.create({
      partnershipId: schema.number.optional(),
      type: schema.string.optional(),
      amount: schema.number(),
      currency: schema.string.optional(),
      paymentMethod: schema.string.optional(),
      status: schema.string.optional(),
      paymentStatus: schema.string.optional(),
      remark: schema.string.optional(),
    })

    const data = await request.validate({ schema: validationSchema })
    data.orderNo = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`
    data.userId = auth.user?.id
    data.status = data.status || 'pending'
    data.paymentStatus = data.paymentStatus || 'unpaid'
    data.type = data.type || 'brand'
    data.currency = data.currency || 'CNY'

    const order = await Order.create(data)

    await OrderNode.create({
      orderId: order.id,
      nodeType: 'created',
      name: '订单创建',
      status: 'completed',
      createdBy: auth.user?.id,
      completedAt: DateTime.now(),
    })

    return response.status(201).json(order)
  }

  public async show({ params, response }: HttpContextContract) {
    const order = await Order.query()
      .where('id', params.id)
      .preload('user')
      .preload('partnership')
      .preload('nodes', (q) => q.preload('creator').orderBy('createdAt', 'asc'))
      .preload('comments', (q) => q.preload('user').orderBy('createdAt', 'desc'))
      .preload('attachments', (q) => q.preload('uploader').orderBy('createdAt', 'desc'))
      .preload('refunds')
      .firstOrFail()

    return response.json(order)
  }

  public async update({ params, request, response, auth }: HttpContextContract) {
    const order = await Order.findOrFail(params.id)
    const beforeData = order.toJSON()

    const validationSchema = schema.create({
      status: schema.string.optional(),
      paymentStatus: schema.string.optional(),
      paymentMethod: schema.string.optional(),
      remark: schema.string.optional(),
      transactionId: schema.string.optional(),
    })

    const data = await request.validate({ schema: validationSchema })

    if (data.paymentStatus === 'paid' && order.paymentStatus !== 'paid') {
      order.paidAt = DateTime.now()
    }

    order.merge(data)
    await order.save()

    await RevisionService.log(
      'order',
      order.id,
      beforeData,
      order.toJSON(),
      auth.user?.id,
      '更新订单信息'
    )

    return response.json(order)
  }

  public async destroy({ params, response, auth }: HttpContextContract) {
    const order = await Order.findOrFail(params.id)
    order.status = 'cancelled'
    await order.save()

    await RevisionService.log(
      'order',
      order.id,
      order.toJSON(),
      { ...order.toJSON(), status: 'cancelled' },
      auth.user?.id,
      '取消订单'
    )

    return response.json({ message: '订单已取消' })
  }

  public async addNode({ params, request, response, auth }: HttpContextContract) {
    const validationSchema = schema.create({
      nodeType: schema.string(),
      name: schema.string(),
      description: schema.string.optional(),
      scheduledAt: schema.date.optional(),
    })

    const data = await request.validate({ schema: validationSchema })
    const node = await OrderNode.create({
      orderId: params.id,
      nodeType: data.nodeType,
      name: data.name,
      description: data.description,
      status: 'pending',
      createdBy: auth.user?.id,
      scheduledAt: data.scheduledAt,
    })

    return response.status(201).json(node)
  }

  public async updateNode({ params, request, response }: HttpContextContract) {
    const node = await OrderNode.findOrFail(params.nodeId)
    const data = request.only(['status', 'description', 'scheduledAt', 'completedAt'])
    if (data.status === 'completed' && !data.completedAt) {
      data.completedAt = DateTime.now()
    }
    node.merge(data)
    await node.save()
    return response.json(node)
  }

  public async getHistory({ params, response }: HttpContextContract) {
    const history = await RevisionService.getHistory('order', params.id)
    const benefitHistory = await RevisionService.getHistory('sponsorship_benefit', params.id)
    return response.json([...history, ...benefitHistory].sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()))
  }

  public async addComment({ params, request, response, auth }: HttpContextContract) {
    const validationSchema = schema.create({
      content: schema.string(),
      benefitId: schema.number.optional(),
      revisionRound: schema.number.optional(),
    })

    const data = await request.validate({ schema: validationSchema })
    const comment = await OrderComment.create({
      orderId: params.id,
      benefitId: data.benefitId,
      userId: auth.user!.id,
      content: data.content,
      revisionRound: data.revisionRound || 0,
    })

    await comment.preload('user')
    return response.status(201).json(comment)
  }

  public async uploadAttachment({ params, request, response, auth }: HttpContextContract) {
    const benefitId = request.input('benefitId') ? Number(request.input('benefitId')) : undefined
    const revisionRound = request.input('revisionRound') ? Number(request.input('revisionRound')) : 0

    const attachment = request.file('file', {
      size: '100mb',
      extnames: ['jpg', 'png', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'zip', 'mp4', 'mp3'],
    })

    if (!attachment) {
      return response.status(400).json({ message: '请上传文件' })
    }

    const uploadDir = Application.tmpPath('uploads')
    await fs.mkdir(uploadDir, { recursive: true })

    await attachment.move(uploadDir)

    if (!attachment.isMoved) {
      return response.status(500).json({ message: '文件上传失败' })
    }

    const record = await OrderAttachment.create({
      orderId: params.id,
      benefitId,
      userId: auth.user!.id,
      fileName: attachment.clientName,
      filePath: `/uploads/${attachment.fileName}`,
      fileSize: attachment.size?.toString(),
      mimeType: attachment.type,
      revisionRound,
    })

    await record.preload('uploader')
    return response.status(201).json(record)
  }

  public async getAttachments({ params, response }: HttpContextContract) {
    const attachments = await OrderAttachment.query()
      .where('orderId', params.id)
      .preload('uploader')
      .orderBy('createdAt', 'desc')
    return response.json(attachments)
  }
}
