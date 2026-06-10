import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Service from 'App/Models/Service'

export default class ServicesController {
  public async index({ request, response }: HttpContextContract) {
    const active = request.input('active', '')
    let query = Service.query()
    if (active) {
      query.where('is_active', active === '1')
    }
    const data = await query.orderBy('id', 'asc')
    return response.ok({ data })
  }

  public async store({ request, response }: HttpContextContract) {
    const data = request.only(['name', 'code', 'description', 'durationMinutes', 'price', 'capacity'])
    const service = await Service.create({
      ...data,
      durationMinutes: Number(data.durationMinutes || 30),
      price: Number(data.price || 0),
      capacity: Number(data.capacity || 1),
    })
    return response.created({ data: service, message: '服务创建成功' })
  }

  public async show({ params, response }: HttpContextContract) {
    const service = await Service.findOrFail(params.id)
    return response.ok({ data: service })
  }

  public async update({ params, request, response }: HttpContextContract) {
    const service = await Service.findOrFail(params.id)
    const data = request.only(['name', 'code', 'description', 'durationMinutes', 'price', 'capacity', 'isActive'])
    service.merge({
      ...data,
      durationMinutes: data.durationMinutes ? Number(data.durationMinutes) : undefined,
      price: data.price !== undefined ? Number(data.price) : undefined,
      capacity: data.capacity ? Number(data.capacity) : undefined,
    })
    await service.save()
    return response.ok({ data: service, message: '服务更新成功' })
  }

  public async destroy({ params, response }: HttpContextContract) {
    const service = await Service.findOrFail(params.id)
    await service.delete()
    return response.ok({ message: '服务已删除' })
  }
}
