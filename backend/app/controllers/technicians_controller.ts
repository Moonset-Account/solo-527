import type { HttpContext } from '@adonisjs/core/http'
import Technician from '#models/technician'
import { createTechnicianValidator, updateTechnicianValidator } from '#validators/technician'
import Order from '#models/order'
import { DateTime } from 'luxon'

export default class TechniciansController {
  async index({ request, response }: HttpContext) {
    const { page = 1, perPage = 10, status, keyword } = request.qs() as {
      page?: number
      perPage?: number
      status?: string
      keyword?: string
    }

    const query = Technician.query().orderBy('id', 'desc')

    if (status) {
      query.where('status', status)
    }

    if (keyword) {
      query.where((subQuery) => {
        subQuery
          .where('name', 'like', `%${keyword}%`)
          .orWhere('phone', 'like', `%${keyword}%`)
      })
    }

    const technicians = await query.paginate(page, perPage)

    return response.json({
      data: technicians.toJSON(),
    })
  }

  async all({ response }: HttpContext) {
    const technicians = await Technician.query()
      .where('status', 'active')
      .orderBy('name', 'asc')

    return response.json({
      data: technicians,
    })
  }

  async show({ params, response }: HttpContext) {
    const technician = await Technician.query()
      .where('id', params.id)
      .preload('user')
      .first()

    if (!technician) {
      return response.status(404).json({ message: '师傅不存在' })
    }

    return response.json({ data: technician })
  }

  async store({ request, response }: HttpContext) {
    const data = await request.validateUsing(createTechnicianValidator)

    const existing = await Technician.query()
      .where('phone', data.phone)
      .first()

    if (existing) {
      return response
        .status(400)
        .json({ message: '该手机号已被使用' })
    }

    const technician = await Technician.create({
      name: data.name,
      phone: data.phone,
      skills: data.skills || [],
      dailyLimit: data.dailyLimit || 5,
      status: data.status || 'active',
      userId: data.userId,
    })

    return response.status(201).json({
      message: '师傅创建成功',
      data: technician,
    })
  }

  async update({ params, request, response }: HttpContext) {
    const technician = await Technician.find(params.id)
    if (!technician) {
      return response.status(404).json({ message: '师傅不存在' })
    }

    const data = await request.validateUsing(updateTechnicianValidator)

    if (data.phone && data.phone !== technician.phone) {
      const existing = await Technician.query()
        .where('phone', data.phone)
        .whereNot('id', params.id)
        .first()

      if (existing) {
        return response
          .status(400)
          .json({ message: '该手机号已被使用' })
      }
    }

    technician.merge(data)
    await technician.save()

    return response.json({
      message: '师傅信息更新成功',
      data: technician,
    })
  }

  async destroy({ params, response }: HttpContext) {
    const technician = await Technician.find(params.id)
    if (!technician) {
      return response.status(404).json({ message: '师傅不存在' })
    }

    const hasOrders = await Order.query()
      .where('technicianId', params.id)
      .whereNot('status', 'cancelled')
      .first()

    if (hasOrders) {
      return response
        .status(400)
        .json({ message: '该师傅还有未完成的订单，不能删除' })
    }

    await technician.delete()

    return response.json({ message: '师傅已删除' })
  }

  async workload({ params, request, response }: HttpContext) {
    const { startDate, endDate } = request.qs() as {
      startDate?: string
      endDate?: string
    }

    const technician = await Technician.find(params.id)
    if (!technician) {
      return response.status(404).json({ message: '师傅不存在' })
    }

    const start = startDate
      ? DateTime.fromISO(startDate).startOf('day')
      : DateTime.now().startOf('day')

    const end = endDate
      ? DateTime.fromISO(endDate).endOf('day')
      : DateTime.now().plus({ days: 6 }).endOf('day')

    const orders = await Order.query()
      .where('technicianId', params.id)
      .where('appointmentTime', '>=', start.toJSDate())
      .where('appointmentTime', '<=', end.toJSDate())
      .where('status', '!=', 'cancelled')
      .orderBy('appointmentTime', 'asc')

    const dailyWorkload: Record<string, { total: number; orders: any[] }> = {}
    let current = start
    while (current <= end) {
      const dateStr = current.toISODate()
      dailyWorkload[dateStr] = { total: 0, orders: [] }
      current = current.plus({ days: 1 })
    }

    for (const order of orders) {
      const dateStr = order.appointmentTime.toISODate()
      if (dailyWorkload[dateStr]) {
        dailyWorkload[dateStr].total++
        dailyWorkload[dateStr].orders.push(order)
      }
    }

    return response.json({
      data: {
        technician: {
          id: technician.id,
          name: technician.name,
          dailyLimit: technician.dailyLimit,
        },
        dateRange: {
          start: start.toISODate(),
          end: end.toISODate(),
        },
        dailyWorkload,
      },
    })
  }
}
