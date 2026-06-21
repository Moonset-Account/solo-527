import type { HttpContext } from '@adonisjs/core/http'
import KnowledgeRetrievalService from '#services/knowledge_retrieval_service'
import {
  knowledgeIndexSchema,
  knowledgeStoreSchema,
  knowledgeUpdateSchema,
  knowledgeSearchSchema,
} from '#validators/index'
import { successResponse } from '../utils/helpers.js'
import { DateTime } from 'luxon'

export default class KnowledgeController {
  private knowledgeService: KnowledgeRetrievalService

  constructor() {
    this.knowledgeService = KnowledgeRetrievalService.getInstance()
  }

  async index({ request, response }: HttpContext) {
    const payload = await request.validateUsing(knowledgeIndexSchema)

    const result = await this.knowledgeService.index({
      page: payload.page,
      perPage: payload.perPage,
      keyword: payload.keyword,
      category: payload.category,
      tag: payload.tag,
      isActive: payload.isActive,
    })

    const data = result.data.map((item) => ({
      id: item.id,
      title: item.title,
      content: item.content.substring(0, 200) + (item.content.length > 200 ? '...' : ''),
      category: item.category,
      tags: item.tags,
      isActive: item.isActive,
      createdBy: item.createdBy,
      updatedBy: item.updatedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }))

    return response.json(successResponse(data, 'ok', result.pagination))
  }

  async store({ request, auth, response }: HttpContext) {
    const payload = await request.validateUsing(knowledgeStoreSchema)
    const userId = auth.user!.id

    const item = await this.knowledgeService.store({
      title: payload.title,
      content: payload.content,
      category: payload.category,
      tags: payload.tags,
      isActive: payload.isActive,
      createdBy: userId,
    })

    return response.status(201).json(
      successResponse(
        {
          id: item.id,
          title: item.title,
          content: item.content,
          category: item.category,
          tags: item.tags,
          isActive: item.isActive,
          createdBy: item.createdBy,
          createdAt: item.createdAt,
        },
        '知识库条目创建成功',
      ),
    )
  }

  async show({ params, response }: HttpContext) {
    const id = Number(params.id)
    const item = await this.knowledgeService.show(id)

    return response.json(
      successResponse({
        id: item.id,
        title: item.title,
        content: item.content,
        category: item.category,
        tags: item.tags,
        isActive: item.isActive,
        embedding: item.embedding,
        createdBy: item.createdBy,
        updatedBy: item.updatedBy,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }),
    )
  }

  async update({ params, request, auth, response }: HttpContext) {
    const id = Number(params.id)
    const payload = await request.validateUsing(knowledgeUpdateSchema)
    const userId = auth.user!.id

    const item = await this.knowledgeService.update(id, {
      title: payload.title,
      content: payload.content,
      category: payload.category,
      tags: payload.tags,
      isActive: payload.isActive,
      updatedBy: userId,
    })

    return response.json(
      successResponse(
        {
          id: item.id,
          title: item.title,
          content: item.content,
          category: item.category,
          tags: item.tags,
          isActive: item.isActive,
          updatedBy: item.updatedBy,
          updatedAt: item.updatedAt,
        },
        '知识库条目更新成功',
      ),
    )
  }

  async destroy({ params, auth, response }: HttpContext) {
    const id = Number(params.id)
    const userId = auth.user!.id

    await this.knowledgeService.destroy(id, userId)

    return response.json(successResponse(null, '知识库条目删除成功'))
  }

  async search({ request, response }: HttpContext) {
    const payload = await request.validateUsing(knowledgeSearchSchema)

    const { items, scores } = await this.knowledgeService.searchKnowledgeBase(
      payload.query,
      payload.topK || 5,
      payload.category,
    )

    const data = items.map((item) => ({
      id: item.id,
      title: item.title,
      content: item.content,
      category: item.category,
      tags: item.tags,
      similarityScore: scores[item.id] || 0,
      isActive: item.isActive,
    }))

    return response.json(successResponse(data, '检索成功'))
  }
}
