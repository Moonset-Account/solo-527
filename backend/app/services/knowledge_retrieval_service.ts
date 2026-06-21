import KnowledgeItem from '#models/knowledge_item'
import db from '@adonisjs/lucid/services/db'
import vectorSearchAdapter from '../adapters/vector_search_adapter.js'
import type { VectorSearchResult } from '../adapters/vector_search_adapter.js'
import { paginate, buildPaginationMeta } from '../utils/helpers.js'
import { DateTime } from 'luxon'
import { BusinessException } from '#exceptions/handler'

interface KnowledgeIndexParams {
  page?: number
  perPage?: number
  keyword?: string
  category?: string
  tag?: string
  isActive?: boolean
}

interface KnowledgeStoreParams {
  title: string
  content: string
  category?: string
  tags?: string[]
  isActive?: boolean
  createdBy: number
}

interface KnowledgeUpdateParams {
  title?: string
  content?: string
  category?: string | null
  tags?: string[]
  isActive?: boolean
  updatedBy: number
}

interface PaginatedResult<T> {
  data: T[]
  pagination: any
}

export default class KnowledgeRetrievalService {
  private static instance: KnowledgeRetrievalService

  static getInstance(): KnowledgeRetrievalService {
    if (!KnowledgeRetrievalService.instance) {
      KnowledgeRetrievalService.instance = new KnowledgeRetrievalService()
    }
    return KnowledgeRetrievalService.instance
  }

  async search(query: string, topK = 5, category?: string): Promise<VectorSearchResult[]> {
    return vectorSearchAdapter.searchByText(query, topK, category)
  }

  async index(params: KnowledgeIndexParams): Promise<PaginatedResult<KnowledgeItem>> {
    const { page, perPage, limit, offset } = paginate(params.page, params.perPage)

    const query = KnowledgeItem.query().whereNull('deletedAt')

    if (params.keyword) {
      query.where((builder) => {
        builder.whereILike('title', `%${params.keyword}%`).orWhereILike('content', `%${params.keyword}%`)
      })
    }

    if (params.category) {
      query.where('category', params.category)
    }

    if (params.tag) {
      query.whereRaw('tags::text ILIKE ?', [`%${params.tag}%`])
    }

    if (params.isActive !== undefined) {
      query.where('isActive', params.isActive)
    }

    const cloneQuery = query.clone()
    const total = await cloneQuery.count('* as total')
    const totalCount = Number(total[0].$extras.total || 0)

    const data = await query.orderBy('createdAt', 'desc').limit(limit).offset(offset).exec()

    return {
      data,
      pagination: buildPaginationMeta(totalCount, page, perPage),
    }
  }

  async store(params: KnowledgeStoreParams): Promise<KnowledgeItem> {
    return KnowledgeItem.create({
      title: params.title,
      content: params.content,
      category: params.category || null,
      tags: params.tags || [],
      isActive: params.isActive ?? true,
      createdBy: params.createdBy,
      updatedBy: params.createdBy,
    })
  }

  async show(id: number): Promise<KnowledgeItem> {
    const item = await KnowledgeItem.query().where('id', id).whereNull('deletedAt').first()
    if (!item) {
      throw new BusinessException('知识库条目不存在', 4004, 404)
    }
    return item
  }

  async update(id: number, params: KnowledgeUpdateParams): Promise<KnowledgeItem> {
    const item = await this.show(id)

    const oldValues = item.toJSON()

    if (params.title !== undefined) item.title = params.title
    if (params.content !== undefined) item.content = params.content
    if (params.category !== undefined) item.category = params.category
    if (params.tags !== undefined) item.tags = params.tags
    if (params.isActive !== undefined) item.isActive = params.isActive
    item.updatedBy = params.updatedBy

    await item.save()

    return item
  }

  async destroy(id: number, deletedBy: number): Promise<void> {
    const item = await this.show(id)
    item.deletedAt = DateTime.now()
    item.updatedBy = deletedBy
    await item.save()
  }

  async searchKnowledgeBase(
    query: string,
    topK = 5,
    category?: string,
  ): Promise<{ items: KnowledgeItem[]; scores: Record<number, number> }> {
    const searchResults = await this.search(query, topK, category)
    const ids = searchResults.map((r) => r.id)
    const scores: Record<number, number> = {}
    searchResults.forEach((r) => {
      scores[r.id] = r.similarityScore
    })

    if (ids.length === 0) {
      return { items: [], scores }
    }

    const items = await KnowledgeItem.query().whereIn('id', ids).whereNull('deletedAt').where('isActive', true).exec()

    items.sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0))

    return { items, scores }
  }

  async getCategories(): Promise<string[]> {
    const result = await KnowledgeItem.query()
      .whereNull('deletedAt')
      .whereNotNull('category')
      .distinct('category')
      .select('category')
      .exec()

    return result.map((r) => r.category!).filter(Boolean)
  }

  async getStats(): Promise<{ total: number; active: number; categories: number; updatedToday: number }> {
    const totalResult = await KnowledgeItem.query().whereNull('deletedAt').count('* as total')
    const activeResult = await KnowledgeItem.query().whereNull('deletedAt').where('isActive', true).count('* as total')

    const categoriesResult = await KnowledgeItem.query()
      .whereNull('deletedAt')
      .whereNotNull('category')
      .distinct('category')
      .count('* as total')

    const todayStart = DateTime.now().startOf('day')
    const updatedTodayResult = await KnowledgeItem.query()
      .whereNull('deletedAt')
      .where('updatedAt', '>=', todayStart.toISO())
      .count('* as total')

    return {
      total: Number(totalResult[0].$extras.total || 0),
      active: Number(activeResult[0].$extras.total || 0),
      categories: Number(categoriesResult[0]?.$extras.total || 0),
      updatedToday: Number(updatedTodayResult[0].$extras.total || 0),
    }
  }
}
