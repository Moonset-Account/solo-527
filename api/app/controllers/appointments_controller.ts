import { HttpContext } from '@adonisjs/core/http'
import Appointment from '#models/appointment'
import AppointmentService from '#services/appointment_service'

export default class AppointmentsController {
  public async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = request.input('perPage', 20)
    const status = request.input('status')
    const date = request.input('date')
    const consultantId = request.input('consultant_id')

    const query = Appointment.query().preload('consultant').preload('items', (q) => q.preload('service'))

    if (status) query.where('status', status)
    if (date) query.where('appointmentDate', date)
    if (consultantId) query.where('consultantId', consultantId)

    const appointments = await query.orderBy('appointmentDate', 'desc').paginate(page, perPage)
    return response.ok(appointments)
  }

  public async show({ params, response }: HttpContext) {
    const appointment = await Appointment.query()
      .where('id', params.id)
      .preload('consultant')
      .preload('items', (q) => q.preload('service'))
      .firstOrFail()

    return response.ok(appointment)
  }

  public async store({ request, response }: HttpContext) {
    const data = request.only([
      'customerName',
      'customerPhone',
      'consultantId',
      'appointmentDate',
      'startTime',
      'endTime',
      'notes',
      'serviceIds',
    ])

    if (!data.customerName || !data.customerPhone || !data.consultantId || !data.appointmentDate) {
      return response.badRequest({ message: '客户姓名、电话、顾问ID和预约日期为必填项' })
    }

    if (!data.serviceIds || !Array.isArray(data.serviceIds) || data.serviceIds.length === 0) {
      return response.badRequest({ message: '至少选择一个服务项目' })
    }

    const appointment = await AppointmentService.createAppointment(data)
    return response.created(appointment)
  }

  public async startService({ params, response, auth }: HttpContext) {
    const item = await AppointmentService.startService(params.itemId, auth.user!.id)
    return response.ok(item)
  }

  public async completeService({ params, response, auth }: HttpContext) {
    const item = await AppointmentService.completeService(params.itemId, auth.user!.id)
    return response.ok(item)
  }

  public async markNoShow({ params, response, auth }: HttpContext) {
    const appointment = await AppointmentService.markNoShow(params.id, auth.user!.id)
    return response.ok(appointment)
  }

  public async update({ params, request, response }: HttpContext) {
    const appointment = await Appointment.findOrFail(params.id)
    const data = request.only(['customerName', 'customerPhone', 'appointmentDate', 'startTime', 'endTime', 'notes'])

    appointment.merge(data)
    await appointment.save()
    return response.ok(appointment)
  }

  public async destroy({ params, response }: HttpContext) {
    const appointment = await Appointment.findOrFail(params.id)

    if (appointment.status !== 'scheduled') {
      return response.badRequest({ message: '只能取消已预约的记录' })
    }

    appointment.status = 'cancelled'
    await appointment.save()
    return response.noContent()
  }
}
