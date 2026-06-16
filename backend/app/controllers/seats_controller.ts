import Seat from '#models/seat'
import SeatNote from '#models/seat_note'
import OperationLogService from '#services/operation_log_service'
import {
  createSeatSchema,
  updateSeatSchema,
  querySeatSchema,
  noteSchema,
} from '#validators/seat_validator'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

export default class SeatsController {
  async index({ request, auth }: HttpContext) {
    const {
      page = 1,
      perPage = 20,
      keyword,
      status,
      planId,
      isIdle,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = await request.validateUsing(querySeatSchema)

    const query = Seat.query()

    if (keyword) {
      query.where((subquery) => {
        subquery.where('customer_name', 'like', `%${keyword}%`).orWhere('seat_code', 'like', `%${keyword}%`)
      })
    }

    if (status) {
      query.where('status', status)
    }

    if (planId) {
      query.where('plan_id', planId)
    }

    if (isIdle !== undefined) {
      query.where('is_idle', isIdle)
    }

    query.preload('plan')

    const sortColumn = sortBy === 'createdAt' ? 'created_at' : sortBy
    query.orderBy(sortColumn, sortOrder)

    const seats = await query.paginate(page, perPage)

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

  async show({ params }: HttpContext) {
    const seat = await Seat.query()
      .where('id', params.id)
      .preload('plan')
      .firstOrFail()

    return seat
  }

  async store({ request, auth }: HttpContext) {
    const data = await request.validateUsing(createSeatSchema)

    const user = auth.getUserOrFail()

    const seat = await Seat.create({
      ...data,
      createdBy: user.id,
      apiCallsUsed: 0,
      isIdle: false,
      idleDays: 0,
    })

    await OperationLogService.log(
      { auth, request } as HttpContext,
      'create',
      'seat',
      seat.id,
      data
    )

    return seat
  }

  async update({ params, request, auth }: HttpContext) {
    const seat = await Seat.findOrFail(params.id)
    const data = await request.validateUsing(updateSeatSchema)

    const oldData = seat.toJSON()
    seat.merge(data)
    await seat.save()

    await OperationLogService.log(
      { auth, request } as HttpContext,
      'update',
      'seat',
      seat.id,
      { old: oldData, new: data }
    )

    return seat
  }

  async destroy({ params, auth, request }: HttpContext) {
    const seat = await Seat.findOrFail(params.id)
    await seat.delete()

    await OperationLogService.log(
      { auth, request } as HttpContext,
      'delete',
      'seat',
      seat.id,
      { seatCode: seat.seatCode, customerName: seat.customerName }
    )

    return {
      message: 'Seat deleted successfully',
    }
  }

  async batchQuery({ request }: HttpContext) {
    const { customerIds, status, planId } = await request.validateUsing(querySeatSchema)

    const query = Seat.query()

    if (customerIds && customerIds.length > 0) {
      query.whereIn('customer_id', customerIds)
    }

    if (status) {
      query.where('status', status)
    }

    if (planId) {
      query.where('plan_id', planId)
    }

    query.preload('plan')

    const seats = await query.exec()

    return {
      data: seats,
      total: seats.length,
    }
  }

  async idleList({ request }: HttpContext) {
    const { page = 1, perPage = 20, sortBy = 'idleDays', sortOrder = 'desc' } = request.all()

    const query = Seat.query()
      .where('is_idle', true)
      .preload('plan')

    const sortColumn = sortBy === 'idleDays' ? 'idle_days' : sortBy
    query.orderBy(sortColumn, sortOrder)

    const seats = await query.paginate(page, perPage)

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

  async addNote({ params, request, auth }: HttpContext) {
    const seat = await Seat.findOrFail(params.id)
    const user = auth.getUserOrFail()
    const data = await request.validateUsing(noteSchema)

    const note = await SeatNote.create({
      seatId: seat.id,
      operatorId: user.id,
      type: data.type || 'note',
      content: data.content,
      result: data.result,
    })

    await OperationLogService.log(
      { auth, request } as HttpContext,
      'add_note',
      'seat',
      seat.id,
      { noteId: note.id, type: data.type, content: data.content }
    )

    return note
  }

  async getNotes({ params, request }: HttpContext) {
    const seat = await Seat.findOrFail(params.id)
    const { page = 1, perPage = 20 } = request.all()

    const notes = await SeatNote.query()
      .where('seat_id', seat.id)
      .preload('operator')
      .orderBy('created_at', 'desc')
      .paginate(page, perPage)

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

    await OperationLogService.log(
      { auth, request } as HttpContext,
      'update_idle_status',
      'seat',
      seat.id,
      { isIdle, seatCode: seat.seatCode }
    )

    return seat
  }
}
