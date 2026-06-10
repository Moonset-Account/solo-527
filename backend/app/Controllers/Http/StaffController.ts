import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Staff from 'App/Models/Staff'
import StaffSchedule from 'App/Models/StaffSchedule'
import { DateTime } from 'luxon'

export default class StaffController {
  public async index({ request, response }: HttpContextContract) {
    const type = request.input('type', '')
    const active = request.input('active', '')
    let query = Staff.query()
    if (type) {
      query.where('type', type)
    }
    if (active) {
      query.where('is_active', active === '1')
    }
    const data = await query.orderBy('id', 'asc')
    return response.ok({ data })
  }

  public async store({ request, response }: HttpContextContract) {
    const data = request.only(['name', 'title', 'type', 'phone', 'specialties'])
    const staff = await Staff.create(data)
    return response.created({ data: staff, message: '人员创建成功' })
  }

  public async show({ params, response }: HttpContextContract) {
    const staff = await Staff.findOrFail(params.id)
    return response.ok({ data: staff })
  }

  public async update({ params, request, response }: HttpContextContract) {
    const staff = await Staff.findOrFail(params.id)
    const data = request.only(['name', 'title', 'type', 'phone', 'specialties', 'isActive'])
    staff.merge(data)
    await staff.save()
    return response.ok({ data: staff, message: '人员更新成功' })
  }

  public async destroy({ params, response }: HttpContextContract) {
    const staff = await Staff.findOrFail(params.id)
    await staff.delete()
    return response.ok({ message: '人员已删除' })
  }

  public async getSchedules({ params, request, response }: HttpContextContract) {
    const startDate = request.input('startDate', '')
    const endDate = request.input('endDate', '')

    let query = StaffSchedule.query().where('staff_id', params.id)

    if (startDate) {
      query.where('schedule_date', '>=', startDate)
    }
    if (endDate) {
      query.where('schedule_date', '<=', endDate)
    }

    const data = await query.orderBy('schedule_date', 'asc')
    return response.ok({ data })
  }

  public async addSchedule({ params, request, response }: HttpContextContract) {
    const { scheduleDate, startTime, endTime, isDayOff, note } = request.all()
    const schedule = await StaffSchedule.create({
      staffId: Number(params.id),
      scheduleDate: DateTime.fromISO(scheduleDate),
      startTime: startTime || '09:00',
      endTime: endTime || '18:00',
      isDayOff: isDayOff === true || isDayOff === 'true',
      note: note || '',
    })
    return response.created({ data: schedule, message: '排班创建成功' })
  }

  public async updateSchedule({ params, request, response }: HttpContextContract) {
    const schedule = await StaffSchedule.findOrFail(params.id)
    const data = request.only(['scheduleDate', 'startTime', 'endTime', 'isDayOff', 'note'])
    schedule.merge({
      ...data,
      scheduleDate: data.scheduleDate ? DateTime.fromISO(data.scheduleDate) : undefined,
    })
    await schedule.save()
    return response.ok({ data: schedule, message: '排班更新成功' })
  }

  public async deleteSchedule({ params, response }: HttpContextContract) {
    const schedule = await StaffSchedule.findOrFail(params.id)
    await schedule.delete()
    return response.ok({ message: '排班已删除' })
  }
}
