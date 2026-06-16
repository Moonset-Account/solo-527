import RenewalList from '#models/renewal_list'
import Seat from '#models/seat'
import User from '#models/user'
import OperationLog from '#models/operation_log'
import SeatNote from '#models/seat_note'
import {
  indexRenewalListValidator,
  storeRenewalListValidator,
  updateRenewalListValidator,
  assignRenewalListValidator,
  followUpValidator,
  batchImportValidator,
} from '#validators/renewal_list_validator'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

export default class RenewalListsController {
  async index({ request, auth, serialize }: HttpContext) {
    const {
      page = 1,
      perPage = 20,
      status,
      priority,
      assignedTo,
      keyword,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = await request.validateUsing(indexRenewalListValidator)

    const query = RenewalList.query()

    if (status) {
      query.where('status', status)
    }

    if (priority) {
      query.where('priority', priority)
    }

    if (assignedTo) {
      query.where('assignedTo', assignedTo)
    }

    if (keyword) {
      query.where((q) => {
        q.where('customerName', 'like', `%${keyword}%`)
          .orWhere('customerId', 'like', `%${keyword}%`)
          .orWhere('planName', 'like', `%${keyword}%`)
      })
    }

    query.preload('assignedUser')
    query.preload('seat')
    query.orderBy(sortBy, sortOrder)

    const lists = await query.paginate(page, perPage)

    const user = auth.getUserOrFail()
    await OperationLog.create({
      userId: user.id,
      userName: user.fullName || user.email,
      action: 'view_renewal_list',
      resourceType: 'renewal_list',
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: { page, perPage, status, priority, assignedTo, keyword },
    })

    return serialize(lists)
  }

  async show({ request, auth, serialize }: HttpContext) {
    const id = request.param('id')

    const item = await RenewalList.query()
      .where('id', id)
      .preload('assignedUser')
      .preload('seat')
      .firstOrFail()

    const followUps = await SeatNote.query()
      .where('seatId', item.seatId)
      .where('type', 'note')
      .orderBy('createdAt', 'desc')
      .limit(20)

    const user = auth.getUserOrFail()
    await OperationLog.create({
      userId: user.id,
      userName: user.fullName || user.email,
      action: 'view_renewal_list_item',
      resourceType: 'renewal_list',
      resourceId: Number(id),
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: { id },
    })

    return serialize({
      ...item.serialize(),
      followUps,
    })
  }

  async store({ request, auth, serialize }: HttpContext) {
    const data = await request.validateUsing(storeRenewalListValidator)

    const _seat = await Seat.findOrFail(data.seatId)

    const renewalList = await RenewalList.create({
      seatId: data.seatId,
      customerId: data.customerId,
      customerName: data.customerName,
      planName: data.planName,
      expiryDate: data.expiryDate,
      status: data.status || 'pending',
      priority: data.priority || 'medium',
      assignedTo: data.assignedTo || null,
      nextFollowUpAt: data.nextFollowUpAt || null,
      notes: data.notes || null,
    })

    await renewalList.load('assignedUser')
    await renewalList.load('seat')

    const user = auth.getUserOrFail()
    await OperationLog.create({
      userId: user.id,
      userName: user.fullName || user.email,
      action: 'create_renewal_list_item',
      resourceType: 'renewal_list',
      resourceId: renewalList.id,
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: {
        ...data,
        expiryDate: data.expiryDate.toISOString(),
      },
    })

    return serialize(renewalList)
  }

  async update({ request, auth, serialize }: HttpContext) {
    const id = request.param('id')
    const data = await request.validateUsing(updateRenewalListValidator)

    const item = await RenewalList.findOrFail(id)

    item.merge({
      customerId: data.customerId,
      customerName: data.customerName,
      planName: data.planName,
      expiryDate: data.expiryDate,
      status: data.status,
      priority: data.priority,
      nextFollowUpAt: data.nextFollowUpAt ?? undefined,
      notes: data.notes ?? undefined,
    })

    await item.save()

    const user = auth.getUserOrFail()
    await OperationLog.create({
      userId: user.id,
      userName: user.fullName || user.email,
      action: 'update_renewal_list_item',
      resourceType: 'renewal_list',
      resourceId: Number(id),
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: {
        id,
        ...data,
        expiryDate: data.expiryDate?.toISOString(),
      },
    })

    return serialize(item)
  }

  async destroy({ request, auth }: HttpContext) {
    const id = request.param('id')

    const item = await RenewalList.findOrFail(id)
    await item.delete()

    const user = auth.getUserOrFail()
    await OperationLog.create({
      userId: user.id,
      userName: user.fullName || user.email,
      action: 'delete_renewal_list_item',
      resourceType: 'renewal_list',
      resourceId: Number(id),
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: { id, customerName: item.customerName },
    })

    return {
      message: '续费名单删除成功',
    }
  }

  async assign({ request, auth, serialize }: HttpContext) {
    const id = request.param('id')
    const { assignedTo } = await request.validateUsing(assignRenewalListValidator)

    const item = await RenewalList.findOrFail(id)
    const assignee = await User.findOrFail(assignedTo)

    item.assignedTo = assignedTo
    await item.save()

    await item.load('assignedUser')

    const user = auth.getUserOrFail()
    await OperationLog.create({
      userId: user.id,
      userName: user.fullName || user.email,
      action: 'assign_renewal_list_item',
      resourceType: 'renewal_list',
      resourceId: Number(id),
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: { id, assignedTo, assigneeName: assignee.fullName || assignee.email },
    })

    return serialize(item)
  }

  async followUp({ request, auth, serialize }: HttpContext) {
    const id = request.param('id')
    const { content, nextFollowUpAt, status } = await request.validateUsing(followUpValidator)

    const item = await RenewalList.findOrFail(id)
    const user = auth.getUserOrFail()

    await db.transaction(async () => {
      await SeatNote.create({
        seatId: item.seatId,
        type: 'note',
        content,
        operatorId: user.id,
      })

      item.lastFollowUpAt = DateTime.now()
      if (nextFollowUpAt !== undefined) {
        item.nextFollowUpAt = nextFollowUpAt
      }
      if (status) {
        item.status = status
      }

      await item.save()
    })

    await item.load('assignedUser')

    await OperationLog.create({
      userId: user.id,
      userName: user.fullName || user.email,
      action: 'follow_up_renewal_list_item',
      resourceType: 'renewal_list',
      resourceId: Number(id),
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: {
        id,
        content,
        nextFollowUpAt: nextFollowUpAt?.toISO(),
        status,
      },
    })

    return serialize(item)
  }

  async stats({ request, auth, serialize }: HttpContext) {
    const { startDate, endDate } = request.qs()

    const start = startDate ? DateTime.fromISO(startDate) : DateTime.now().startOf('month')
    const end = endDate ? DateTime.fromISO(endDate) : DateTime.now()

    const convertedCount = await RenewalList.query()
      .where('status', 'converted')
      .whereBetween('updatedAt', [start.toISO(), end.toISO()])
      .count('* as total')
      .first()

    const lostCount = await RenewalList.query()
      .where('status', 'lost')
      .whereBetween('updatedAt', [start.toISO(), end.toISO()])
      .count('* as total')
      .first()

    const followingCount = await RenewalList.query()
      .where('status', 'following')
      .count('* as total')
      .first()

    const pendingCount = await RenewalList.query()
      .where('status', 'pending')
      .count('* as total')
      .first()

    const totalCount = await RenewalList.query().count('* as total').first()

    const user = auth.getUserOrFail()
    await OperationLog.create({
      userId: user.id,
      userName: user.fullName || user.email,
      action: 'view_renewal_stats',
      resourceType: 'renewal_list',
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: { startDate: start.toISODate(), endDate: end.toISODate() },
    })

    return serialize({
      total: Number(totalCount?.$extras.total || 0),
      converted: Number(convertedCount?.$extras.total || 0),
      lost: Number(lostCount?.$extras.total || 0),
      following: Number(followingCount?.$extras.total || 0),
      pending: Number(pendingCount?.$extras.total || 0),
      conversionRate:
        Number(totalCount?.$extras.total || 0) > 0
          ? (Number(convertedCount?.$extras.total || 0) / Number(totalCount?.$extras.total || 0)) *
            100
          : 0,
      period: {
        startDate: start.toISODate(),
        endDate: end.toISODate(),
      },
    })
  }

  async batchImport({ request, auth, serialize }: HttpContext) {
    const { items } = await request.validateUsing(batchImportValidator)

    const results = await db.transaction(async () => {
      const successItems: any[] = []
      const failedItems: any[] = []

      for (const item of items) {
        try {
          const existing = await RenewalList.query().where('seatId', item.seatId).first()
          if (existing) {
            failedItems.push({ ...item, error: '席位已在续费名单中' })
            continue
          }

          const renewalList = await RenewalList.create({
            seatId: item.seatId,
            customerId: item.customerId,
            customerName: item.customerName,
            planName: item.planName,
            expiryDate: item.expiryDate,
            priority: item.priority || 'medium',
            status: 'pending',
          })

          successItems.push(renewalList)
        } catch (error) {
          failedItems.push({ ...item, error: error.message })
        }
      }

      return { successItems, failedItems }
    })

    const user = auth.getUserOrFail()
    await OperationLog.create({
      userId: user.id,
      userName: user.fullName || user.email,
      action: 'batch_import_renewal_list',
      resourceType: 'renewal_list',
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: {
        total: items.length,
        successCount: results.successItems.length,
        failedCount: results.failedItems.length,
      },
    })

    return serialize({
      successCount: results.successItems.length,
      failedCount: results.failedItems.length,
      failedItems: results.failedItems,
    })
  }

  async export({ request, auth, response }: HttpContext) {
    const { status, priority, assignedTo, keyword } = request.qs()

    const query = RenewalList.query()

    if (status) {
      query.where('status', status)
    }

    if (priority) {
      query.where('priority', priority)
    }

    if (assignedTo) {
      query.where('assignedTo', assignedTo)
    }

    if (keyword) {
      query.where((q) => {
        q.where('customerName', 'like', `%${keyword}%`)
          .orWhere('customerId', 'like', `%${keyword}%`)
          .orWhere('planName', 'like', `%${keyword}%`)
      })
    }

    query.preload('assignedUser')
    query.orderBy('createdAt', 'desc')

    const items = await query

    const csvData = [
      ['ID', '客户ID', '客户名称', '套餐名称', '到期日期', '状态', '优先级', '跟进人', '上次跟进时间', '下次跟进时间', '备注'],
      ...items.map((item) => [
        item.id,
        item.customerId,
        item.customerName,
        item.planName,
        item.expiryDate.toISODate(),
        item.status,
        item.priority,
        item.assignedUser?.fullName || item.assignedUser?.email || '',
        item.lastFollowUpAt?.toISO() || '',
        item.nextFollowUpAt?.toISO() || '',
        item.notes || '',
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')

    const user = auth.getUserOrFail()
    await OperationLog.create({
      userId: user.id,
      userName: user.fullName || user.email,
      action: 'export_renewal_list',
      resourceType: 'renewal_list',
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: { status, priority, assignedTo, keyword, count: items.length },
    })

    response.header('Content-Type', 'text/csv; charset=utf-8')
    response.header('Content-Disposition', `attachment; filename="renewal_list_${Date.now()}.csv"`)

    return '\uFEFF' + csvData
  }
}
