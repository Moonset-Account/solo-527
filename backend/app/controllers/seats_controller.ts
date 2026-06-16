import Seat from '#models/seat'
import SeatNote from '#models/seat_note'
import OperationLog from '#models/operation_log'
import {
  createSeatValidator,
  updateSeatValidator,
  querySeatValidator,
  noteValidator,
} from '#validators/seat_validator'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

export default class SeatsController {
  private normalizeStatus(status: string | undefined): string | undefined {
    if (!status) return undefined
    return status === 'inactive' ? 'suspended' : status
  }

  async index({ request, auth }: HttpContext) {
    const payload = await request.validateUsing(querySeatValidator)
    const {
      page = 1,
      perPage = 20,
      keyword,
      planId,
      isIdle,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = payload
    const status = this.normalizeStatus(payload.status)

    const query = Seat.query()

    if (keyword) {
      query.where((subquery) => {
        subquery.where('customerName', 'like', `%${keyword}%`).orWhere('seatCode', 'like', `%${keyword}%`)
      })
    }

    if (status) {
      query.where('status', status)
    }

    if (planId) {
      query.where('planId', planId)
    }

    if (isIdle !== undefined) {
      query.where('isIdle', isIdle)
    }

    query.preload('plan')

    const sortColumn = sortBy === 'createdAt' ? 'createdAt' : sortBy
    query.orderBy(sortColumn, sortOrder as 'asc' | 'desc')

    const seats = await query.paginate(page, perPage)

    const user = auth.getUserOrFail()
    await OperationLog.create({
      userId: user.id,
      userName: user.fullName || user.email,
      action: 'view_seats',
      resourceType: 'seat',
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: { page, perPage, keyword, status, planId, isIdle },
    })

    return {
      data: seats.toJSON().data,
      meta: {
        total: seats.total,
        page: seats.currentPage,
        perPage: seats.perPage,
        lastPage: seats.lastPage,
      },
    }
  }

  async show({ params, request, auth }: HttpContext) {
    const seat = await Seat.query()
      .where('id', params.id)
      .preload('plan')
      .firstOrFail()

    const user = auth.getUserOrFail()
    await OperationLog.create({
      userId: user.id,
      userName: user.fullName || user.email,
      action: 'view_seat',
      resourceType: 'seat',
      resourceId: seat.id,
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: { seatCode: seat.seatCode, customerName: seat.customerName },
    })

    return seat
  }

  async store({ request, auth }: HttpContext) {
    const payload = await request.validateUsing(createSeatValidator)
    const data = { ...payload, status: this.normalizeStatus(payload.status) || payload.status }

    const user = auth.getUserOrFail()

    const seat = await Seat.create({
      ...data,
      createdBy: user.id,
      apiCallsUsed: 0,
      isIdle: false,
      idleDays: 0,
    })

    await OperationLog.create({
      userId: user.id,
      userName: user.fullName || user.email,
      action: 'create_seat',
      resourceType: 'seat',
      resourceId: seat.id,
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: { ...data },
    })

    return seat
  }

  async update({ params, request, auth }: HttpContext) {
    const seat = await Seat.findOrFail(params.id)
    const payload = await request.validateUsing(updateSeatValidator)
    const data = { ...payload, status: this.normalizeStatus(payload.status) || payload.status }

    const oldData = seat.toJSON()
    seat.merge(data)
    await seat.save()

    const user = auth.getUserOrFail()
    await OperationLog.create({
      userId: user.id,
      userName: user.fullName || user.email,
      action: 'update_seat',
      resourceType: 'seat',
      resourceId: seat.id,
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: { old: oldData, new: data },
    })

    return seat
  }

  async destroy({ params, auth, request }: HttpContext) {
    const seat = await Seat.findOrFail(params.id)
    await seat.delete()

    const user = auth.getUserOrFail()
    await OperationLog.create({
      userId: user.id,
      userName: user.fullName || user.email,
      action: 'delete_seat',
      resourceType: 'seat',
      resourceId: seat.id,
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: { seatCode: seat.seatCode, customerName: seat.customerName },
    })

    return {
      message: '席位删除成功',
    }
  }

  async batchQuery({ request, auth }: HttpContext) {
    const payload = await request.validateUsing(querySeatValidator)
    const { customerIds, planId } = payload
    const status = this.normalizeStatus(payload.status)

    const query = Seat.query()

    if (customerIds && customerIds.length > 0) {
      query.whereIn('customerId', customerIds)
    }

    if (status) {
      query.where('status', status)
    }

    if (planId) {
      query.where('planId', planId)
    }

    query.preload('plan')

    const seats = await query.exec()

    const user = auth.getUserOrFail()
    await OperationLog.create({
      userId: user.id,
      userName: user.fullName || user.email,
      action: 'batch_query_seats',
      resourceType: 'seat',
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: { customerIds: customerIds?.length, status, planId, count: seats.length },
    })

    return {
      data: seats,
      total: seats.length,
    }
  }

  async idleList({ request, auth }: HttpContext) {
    const { page = 1, perPage = 20, sortBy = 'idleDays', sortOrder = 'desc', keyword } = request.all()

    const query = Seat.query()
      .where('isIdle', true)
      .preload('plan')

    if (keyword) {
      query.where((q) => {
        q.where('customerName', 'like', `%${keyword}%`).orWhere('seatCode', 'like', `%${keyword}%`)
      })
    }

    const sortColumn = sortBy === 'idleDays' ? 'idleDays' : sortBy
    query.orderBy(sortColumn, sortOrder as 'asc' | 'desc')

    const seats = await query.paginate(page, perPage)

    const totalCount = await Seat.query().where('isIdle', true).count('* as total').first()
    const over7Days = await Seat.query().where('isIdle', true).andWhere('idleDays', '>=', 7).count('* as total').first()
    const over15Days = await Seat.query().where('isIdle', true).andWhere('idleDays', '>=', 15).count('* as total').first()
    const over30Days = await Seat.query().where('isIdle', true).andWhere('idleDays', '>=', 30).count('* as total').first()

    const user = auth.getUserOrFail()
    await OperationLog.create({
      userId: user.id,
      userName: user.fullName || user.email,
      action: 'view_idle_seats',
      resourceType: 'seat',
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: { page, perPage, total: seats.total },
    })

    return {
      data: seats.toJSON().data,
      meta: {
        total: seats.total,
        page: seats.currentPage,
        perPage: seats.perPage,
        lastPage: seats.lastPage,
      },
      stats: {
        total: Number(totalCount?.$extras.total || 0),
        over7Days: Number(over7Days?.$extras.total || 0),
        over15Days: Number(over15Days?.$extras.total || 0),
        over30Days: Number(over30Days?.$extras.total || 0),
      },
    }
  }

  async addNote({ params, request, auth }: HttpContext) {
    const seat = await Seat.findOrFail(params.id)
    const user = auth.getUserOrFail()
    const data = await request.validateUsing(noteValidator)

    const note = await SeatNote.create({
      seatId: seat.id,
      operatorId: user.id,
      type: data.type || 'note',
      content: data.content,
      result: data.result,
    })

    await OperationLog.create({
      userId: user.id,
      userName: user.fullName || user.email,
      action: 'add_seat_note',
      resourceType: 'seat',
      resourceId: seat.id,
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: { noteId: note.id, type: data.type, content: data.content, result: data.result },
    })

    return note
  }

  async getNotes({ params, request, auth }: HttpContext) {
    const seat = await Seat.findOrFail(params.id)
    const { page = 1, perPage = 20 } = request.all()

    const notes = await SeatNote.query()
      .where('seatId', seat.id)
      .preload('operator')
      .orderBy('createdAt', 'desc')
      .paginate(page, perPage)

    const user = auth.getUserOrFail()
    await OperationLog.create({
      userId: user.id,
      userName: user.fullName || user.email,
      action: 'view_seat_notes',
      resourceType: 'seat',
      resourceId: seat.id,
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: { page, perPage, total: notes.total },
    })

    return {
      data: notes.toJSON().data,
      meta: {
        total: notes.total,
        page: notes.currentPage,
        perPage: notes.perPage,
        lastPage: notes.lastPage,
      },
    }
  }

  async updateIdleStatus({ params, request, auth }: HttpContext) {
    const seat = await Seat.findOrFail(params.id)
    const { isIdle } = request.only(['isIdle'])

    seat.isIdle = isIdle
    if (!isIdle) {
      seat.idleDays = 0
      seat.lastActivityAt = DateTime.now()
    }
    await seat.save()

    const user = auth.getUserOrFail()
    await OperationLog.create({
      userId: user.id,
      userName: user.fullName || user.email,
      action: 'update_seat_idle_status',
      resourceType: 'seat',
      resourceId: seat.id,
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: { isIdle, seatCode: seat.seatCode, idleDays: seat.idleDays },
    })

    return seat
  }
}
