import type { HttpContext } from '@adonisjs/core/http'
import Rectification from '#models/rectification'
import RectificationNote from '#models/rectification_note'
import { schema, rules } from '@adonisjs/validator'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

export default class RectificationsController {
  async index({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)
    const storeId = request.input('store_id')
    const status = request.input('status')
    const level = request.input('level')
    const assignedTo = request.input('assigned_to')
    const isOverdue = request.input('is_overdue')

    const query = Rectification.query()
      .preload('creator')
      .preload('assignee')
      .preload('closer')
      .preload('store')

    if (user.storeId) {
      query.where('storeId', user.storeId)
    } else if (storeId) {
      query.where('storeId', storeId)
    }

    if (status) {
      query.where('status', status)
    }
    if (level) {
      query.where('level', level)
    }
    if (assignedTo) {
      query.where('assignedTo', assignedTo)
    }
    if (isOverdue === 'true') {
      query.where('status', '!=', 'closed')
      query.where('deadline', '<', DateTime.now().toJSDate())
    }

    query.orderBy('createdAt', 'desc')

    const rectifications = await query.paginate(page, limit)
    return response.ok(rectifications)
  }

  async show({ params, response }: HttpContext) {
    const rectification = await Rectification.query()
      .where('id', params.id)
      .preload('creator')
      .preload('assignee')
      .preload('closer')
      .preload('store')
      .preload('notes', (notesQuery) => {
        notesQuery.preload('creator').orderBy('createdAt', 'desc')
      })
      .firstOrFail()

    return response.ok(rectification)
  }

  async store({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const data = await request.validateUsing(
      schema.create({
        storeId: schema.number(),
        sourceId: schema.number.optional(),
        sourceType: schema.string.optional(),
        title: schema.string([rules.maxLength(200)]),
        description: schema.string(),
        level: schema.enum(['low', 'medium', 'high', 'critical']),
        deadline: schema.date.optional(),
        assignedTo: schema.number.optional(),
        remark: schema.string.optional(),
      })
    )

    const rectification = await Rectification.create({
      ...data,
      createdBy: user.id,
      status: 'pending',
      isClosedLoop: false,
    })

    await rectification.load('creator')
    await rectification.load('assignee')

    return response.created(rectification)
  }

  async update({ params, request, response, auth }: HttpContext) {
    const rectification = await Rectification.findOrFail(params.id)
    const user = auth.getUserOrFail()

    const data = await request.validateUsing(
      schema.create({
        title: schema.string.optional([rules.maxLength(200)]),
        description: schema.string.optional(),
        level: schema.enum.optional(['low', 'medium', 'high', 'critical']),
        status: schema.enum.optional(['pending', 'in_progress', 'resolved', 'closed', 'overdue']),
        deadline: schema.date.optional(),
        handlingResult: schema.string.optional(),
        remark: schema.string.optional(),
        assignedTo: schema.number.optional(),
        note: schema.string.optional(),
      })
    )

    const trx = await db.transaction()

    try {
      rectification.useTransaction(trx)

      const updateData: any = { ...data }
      delete updateData.note

      if (data.status === 'in_progress' && rectification.status === 'pending') {
        updateData.status = 'in_progress'
      }

      if (data.status === 'overdue' && rectification.status !== 'closed' && rectification.status !== 'resolved') {
        updateData.status = 'overdue'
      }

      rectification.merge(updateData)
      await rectification.save()

      if (data.note) {
        await RectificationNote.create({
          rectificationId: rectification.id,
          content: data.note,
          createdBy: user.id,
        }, { client: trx })
      }

      await trx.commit()

      await rectification.load('creator')
      await rectification.load('assignee')

      return response.ok(rectification)
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  async close({ params, request, response, auth }: HttpContext) {
    const rectification = await Rectification.findOrFail(params.id)
    const user = auth.getUserOrFail()

    const data = await request.validateUsing(
      schema.create({
        handlingResult: schema.string(),
        remark: schema.string.optional(),
        isClosedLoop: schema.boolean.optional(),
      })
    )

    const trx = await db.transaction()

    try {
      rectification.useTransaction(trx)

      rectification.status = 'closed'
      rectification.closedBy = user.id
      rectification.closedAt = DateTime.now()
      rectification.handlingResult = data.handlingResult
      rectification.remark = data.remark || rectification.remark
      rectification.isClosedLoop = data.isClosedLoop ?? true

      await rectification.save()

      await RectificationNote.create({
        rectificationId: rectification.id,
        content: `整改闭环完成。处理结果：${data.handlingResult}`,
        createdBy: user.id,
      }, { client: trx })

      await trx.commit()

      await rectification.load('closer')
      await rectification.load('creator')

      return response.ok(rectification)
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  async statistics({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const storeId = request.input('store_id')
    const startDate = request.input('start_date')
    const endDate = request.input('end_date')

    const query = Rectification.query()

    if (user.storeId) {
      query.where('storeId', user.storeId)
    } else if (storeId) {
      query.where('storeId', storeId)
    }

    if (startDate) {
      query.where('createdAt', '>=', DateTime.fromISO(startDate).toJSDate())
    }
    if (endDate) {
      query.where('createdAt', '<=', DateTime.fromISO(endDate).endOf('day').toJSDate())
    }

    const allRectifications = await query.clone()

    const total = await allRectifications.clone().count('* as total')
    const pending = await allRectifications.clone().where('status', 'pending').count('* as count')
    const inProgress = await allRectifications.clone().where('status', 'in_progress').count('* as count')
    const resolved = await allRectifications.clone().where('status', 'resolved').count('* as count')
    const closed = await allRectifications.clone().where('status', 'closed').count('* as count')
    const overdue = await allRectifications.clone().where('status', 'overdue').count('* as count')

    const closedLoopCount = await allRectifications.clone().where('isClosedLoop', true).count('* as count')
    const notClosedLoopCount = await allRectifications.clone().where('status', 'closed').where('isClosedLoop', false).count('* as count')

    const now = DateTime.now()
    const overdueUnclosed = await allRectifications.clone()
      .where('status', '!=', 'closed')
      .where('deadline', '<', now.toJSDate())
      .count('* as count')

    const levelStats = await allRectifications.clone()
      .select('level')
      .groupBy('level')
      .count('* as count')

    return response.ok({
      total: Number(total[0]?.total || 0),
      byStatus: {
        pending: Number(pending[0]?.count || 0),
        inProgress: Number(inProgress[0]?.count || 0),
        resolved: Number(resolved[0]?.count || 0),
        closed: Number(closed[0]?.count || 0),
        overdue: Number(overdue[0]?.count || 0),
      },
      closedLoop: {
        total: Number(closedLoopCount[0]?.count || 0),
        notClosed: Number(notClosedLoopCount[0]?.count || 0),
        rate: Number(closed[0]?.count || 0) > 0
          ? Number(((Number(closedLoopCount[0]?.count || 0) / Number(closed[0]?.count || 0)) * 100).toFixed(2))
          : 0,
      },
      overdue: {
        unclosed: Number(overdueUnclosed[0]?.count || 0),
      },
      byLevel: levelStats.map(item => ({
        level: item.level,
        count: Number(item.count),
      })),
    })
  }
}
