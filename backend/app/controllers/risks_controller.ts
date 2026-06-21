import type { HttpContext } from '@adonisjs/core/http'
import RiskSample from '#models/risk_sample'
import { riskIndexSchema, riskMarkNegativeSchema } from '#validators/index'
import { successResponse } from '../utils/helpers.js'
import { paginate, buildPaginationMeta } from '../utils/helpers.js'
import { BusinessException } from '#exceptions/handler'
import { DateTime } from 'luxon'

export default class RisksController {
  async index({ request, response }: HttpContext) {
    const payload = await request.validateUsing(riskIndexSchema)
    const { page, perPage, limit, offset } = paginate(payload.page, payload.perPage)

    const query = RiskSample.query().whereNull('deletedAt').preload('creator', (q) => q.select('id', 'username', 'fullName'))

    if (payload.riskLevel) {
      query.where('riskLevel', payload.riskLevel)
    }

    if (payload.category) {
      query.where('category', payload.category)
    }

    if (payload.keyword) {
      query.where((builder) => {
        builder
          .whereILike('title', `%${payload.keyword}%`)
          .orWhereILike('content', `%${payload.keyword}%`)
          .orWhereILike('riskDescription', `%${payload.keyword}%`)
      })
    }

    const cloneQuery = query.clone()
    const total = await cloneQuery.count('* as total')
    const totalCount = Number(total[0].$extras.total || 0)

    const samples = await query.orderBy('createdAt', 'desc').limit(limit).offset(offset).exec()

    const data = samples.map((sample) => ({
      id: sample.id,
      title: sample.title,
      content: sample.content.substring(0, 100) + (sample.content.length > 100 ? '...' : ''),
      riskLevel: sample.riskLevel,
      category: sample.category,
      riskDescription: sample.riskDescription,
      correctHandling: sample.correctHandling,
      tags: sample.tags,
      isActive: sample.isActive,
      creator: sample.creator
        ? {
            id: sample.creator.id,
            username: sample.creator.username,
            fullName: sample.creator.fullName,
          }
        : null,
      createdAt: sample.createdAt,
      updatedAt: sample.updatedAt,
    }))

    return response.json(successResponse(data, 'ok', buildPaginationMeta(totalCount, page, perPage)))
  }

  async markNegative({ request, auth, response }: HttpContext) {
    const payload = await request.validateUsing(riskMarkNegativeSchema)
    const userId = auth.user!.id

    const sample = await RiskSample.create({
      title: payload.title,
      content: payload.content,
      riskLevel: payload.riskLevel,
      category: payload.category || null,
      riskDescription: payload.riskDescription,
      correctHandling: payload.correctHandling || null,
      tags: payload.tags || [],
      isActive: true,
      createdBy: userId,
      updatedBy: userId,
    })

    return response.status(201).json(
      successResponse(
        {
          id: sample.id,
          title: sample.title,
          content: sample.content,
          riskLevel: sample.riskLevel,
          category: sample.category,
          riskDescription: sample.riskDescription,
          correctHandling: sample.correctHandling,
          tags: sample.tags,
          isActive: sample.isActive,
          createdAt: sample.createdAt,
        },
        '风险样本创建成功',
      ),
    )
  }

  async show({ params, response }: HttpContext) {
    const id = Number(params.id)

    const sample = await RiskSample.query()
      .where('id', id)
      .whereNull('deletedAt')
      .preload('creator', (q) => q.select('id', 'username', 'fullName'))
      .first()

    if (!sample) {
      throw new BusinessException('风险样本不存在', 4004, 404)
    }

    return response.json(
      successResponse({
        id: sample.id,
        title: sample.title,
        content: sample.content,
        riskLevel: sample.riskLevel,
        category: sample.category,
        riskDescription: sample.riskDescription,
        correctHandling: sample.correctHandling,
        tags: sample.tags,
        isActive: sample.isActive,
        creator: sample.creator
          ? {
              id: sample.creator.id,
              username: sample.creator.username,
              fullName: sample.creator.fullName,
            }
          : null,
        createdAt: sample.createdAt,
        updatedAt: sample.updatedAt,
      }),
    )
  }

  async update({ params, request, auth, response }: HttpContext) {
    const id = Number(params.id)
    const payload = await request.validateUsing(riskMarkNegativeSchema)
    const userId = auth.user!.id

    const sample = await RiskSample.query().where('id', id).whereNull('deletedAt').first()

    if (!sample) {
      throw new BusinessException('风险样本不存在', 4004, 404)
    }

    sample.title = payload.title
    sample.content = payload.content
    sample.riskLevel = payload.riskLevel
    sample.category = payload.category || null
    sample.riskDescription = payload.riskDescription
    sample.correctHandling = payload.correctHandling || null
    sample.tags = payload.tags || []
    sample.updatedBy = userId

    await sample.save()

    return response.json(
      successResponse(
        {
          id: sample.id,
          title: sample.title,
          content: sample.content,
          riskLevel: sample.riskLevel,
          category: sample.category,
          riskDescription: sample.riskDescription,
          correctHandling: sample.correctHandling,
          tags: sample.tags,
          updatedAt: sample.updatedAt,
        },
        '风险样本更新成功',
      ),
    )
  }

  async destroy({ params, auth, response }: HttpContext) {
    const id = Number(params.id)
    const userId = auth.user!.id

    const sample = await RiskSample.query().where('id', id).whereNull('deletedAt').first()

    if (!sample) {
      throw new BusinessException('风险样本不存在', 4004, 404)
    }

    sample.deletedAt = DateTime.now()
    sample.updatedBy = userId

    await sample.save()

    return response.json(successResponse(null, '风险样本删除成功'))
  }
}
