import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import TimeSlot from 'App/Models/TimeSlot'
import Staff from 'App/Models/Staff'
import { DateTime } from 'luxon'

export default class TimeSlotsController {
  public async index({ request, response }: HttpContextContract) {
    const page = Number(request.input('page', 1))
    const perPage = Number(request.input('perPage', 50))
    const startDate = request.input('startDate', '')
    const endDate = request.input('endDate', '')
    const staffId = request.input('staffId', '')
    const status = request.input('status', '')

    let query = TimeSlot.query()
      .preload('staff')
      .preload('service')

    if (startDate) query.where('slot_date', '>=', startDate)
    if (endDate) query.where('slot_date', '<=', endDate)
    if (staffId) query.where('staff_id', Number(staffId))
    if (status) query.where('status', status)

    query.orderBy('slot_date', 'asc').orderBy('start_time', 'asc')
    const data = await query.paginate(page, perPage)
    return response.ok({ data })
  }

  public async calendar({ request, response }: HttpContextContract) {
    const startDate = request.input('startDate', DateTime.now().toISODate())
    const endDate = request.input('endDate', DateTime.now().plus({ days: 13 }).toISODate())

    const slots = await TimeSlot.query()
      .preload('staff')
      .preload('service')
      .whereBetween('slot_date', [startDate, endDate])
      .orderBy('slot_date', 'asc')
      .orderBy('start_time', 'asc')

    const staffList = await Staff.query().where('is_active', true)

    const byDate: Record<string, any> = {}
    for (const slot of slots) {
      const date = slot.slotDate.toISODate()
      if (!byDate[date]) byDate[date] = []
      byDate[date].push(slot)
    }

    return response.ok({
      data: {
        byDate,
        staffList,
        startDate,
        endDate,
      },
    })
  }

  public async available({ request, response }: HttpContextContract) {
    const date = request.input('date', DateTime.now().toISODate())
    const staffId = request.input('staffId', '')
    const serviceId = request.input('serviceId', '')

    let query = TimeSlot.query()
      .preload('staff')
      .preload('service')
      .where('slot_date', date)
      .where('status', '!=', 'disabled')
      .whereRaw('booked_count < capacity')

    if (staffId) query.where('staff_id', Number(staffId))
    if (serviceId) query.where('service_id', Number(serviceId))

    query.orderBy('start_time', 'asc')
    const data = await query
    return response.ok({ data })
  }

  public async store({ request, response }: HttpContextContract) {
    const data = request.only(['slotDate', 'startTime', 'endTime', 'staffId', 'serviceId', 'capacity'])
    const slot = await TimeSlot.create({
      ...data,
      slotDate: DateTime.fromISO(data.slotDate),
      capacity: Number(data.capacity || 1),
      bookedCount: 0,
      status: 'available',
    })
    await slot.load('staff')
    await slot.load('service')
    return response.created({ data: slot, message: '时段创建成功' })
  }

  public async bulkCreate({ request, response }: HttpContextContract) {
    const { startDate, endDate, staffIds, serviceId, startTime, endTime, interval, capacity } = request.all()
    const created: any[] = []
    const intervalMin = Number(interval || 30)

    const start = DateTime.fromISO(startDate)
    const end = DateTime.fromISO(endDate)

    for (let d = 0; d <= end.diff(start, 'days').days; d++) {
      const currentDate = start.plus({ days: d })
      if (currentDate.weekday === 7) continue

      const [sh, sm] = (startTime || '09:00').split(':').map(Number)
      const [eh, em] = (endTime || '18:00').split(':').map(Number)
      const startMin = sh * 60 + sm
      const endMin = eh * 60 + em

      for (const staffId of staffIds || []) {
        for (let t = startMin; t + intervalMin <= endMin; t += intervalMin) {
          const sH = Math.floor(t / 60)
          const sM = t % 60
          const eT = t + intervalMin
          const eH = Math.floor(eT / 60)
          const eM = eT % 60

          const slot = await TimeSlot.create({
            slotDate: currentDate,
            startTime: `${String(sH).padStart(2, '0')}:${String(sM).padStart(2, '0')}`,
            endTime: `${String(eH).padStart(2, '0')}:${String(eM).padStart(2, '0')}`,
            staffId: Number(staffId),
            serviceId: Number(serviceId),
            capacity: Number(capacity || 1),
            bookedCount: 0,
            status: 'available',
          })
          created.push(slot)
        }
      }
    }

    return response.created({ data: created, count: created.length, message: `成功创建 ${created.length} 个时段` })
  }

  public async update({ params, request, response }: HttpContextContract) {
    const slot = await TimeSlot.findOrFail(params.id)
    const data = request.only(['slotDate', 'startTime', 'endTime', 'staffId', 'serviceId', 'capacity', 'status'])
    slot.merge({
      ...data,
      slotDate: data.slotDate ? DateTime.fromISO(data.slotDate) : undefined,
      capacity: data.capacity ? Number(data.capacity) : undefined,
    })
    await slot.save()
    await slot.load('staff')
    await slot.load('service')
    return response.ok({ data: slot, message: '时段更新成功' })
  }

  public async destroy({ params, response }: HttpContextContract) {
    const slot = await TimeSlot.findOrFail(params.id)
    await slot.delete()
    return response.ok({ message: '时段已删除' })
  }
}
