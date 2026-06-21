import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import PromptVersion from '#models/prompt_version'
import {
  promptIndexSchema,
  promptStoreSchema,
  promptUpdateSchema,
} from '#validators/index'
import { successResponse } from '../utils/helpers.js'
import { paginate, buildPaginationMeta } from '../utils/helpers.js'
import { BusinessException } from '#exceptions/handler'
import db from '@adonisjs/lucid/services/db'

export default class PromptsController {
  async index({ request, response }: HttpContext) {
    const payload = await request.validateUsing(promptIndexSchema)
    const { page, perPage, limit, offset } = paginate(payload.page, payload.perPage)

    const query = PromptVersion.query().whereNull('deletedAt')

    if (payload.keyword) {
      query.where((builder) => {
        builder
          .whereILike('name', `%${payload.keyword}%`)
          .orWhereILike('systemPrompt', `%${payload.keyword}%`)
      })
    }

    if (payload.promptType) {
      query.where('promptType', payload.promptType)
    }

    if (payload.isActive !== undefined) {
      query.where('isActive', payload.isActive)
    }

    const cloneQuery = query.clone()
    const total = await cloneQuery.count('* as total')
    const totalCount = Number(total[0].$extras.total || 0)

    const prompts = await query.orderBy('createdAt', 'desc').limit(limit).offset(offset).exec()

    const data = prompts.map((prompt) => ({
      id: prompt.id,
      name: prompt.name,
      promptType: prompt.promptType,
      version: prompt.version,
      systemPrompt: prompt.systemPrompt.substring(0, 100) + (prompt.systemPrompt.length > 100 ? '...' : ''),
      parameters: prompt.parameters,
      isActive: prompt.isActive,
      createdBy: prompt.createdBy,
      updatedBy: prompt.updatedBy,
      createdAt: prompt.createdAt,
      updatedAt: prompt.updatedAt,
    }))

    return response.json(successResponse(data, 'ok', buildPaginationMeta(totalCount, page, perPage)))
  }

  async store({ request, auth, response }: HttpContext) {
    const payload = await request.validateUsing(promptStoreSchema)
    const userId = auth.user!.id

    const prompt = await PromptVersion.create({
      name: payload.name,
      promptType: payload.promptType,
      version: payload.version,
      systemPrompt: payload.systemPrompt,
      userPromptTemplate: payload.userPromptTemplate || null,
      parameters: payload.parameters || {},
      isActive: payload.isActive ?? false,
      createdBy: userId,
      updatedBy: userId,
    })

    if (prompt.isActive) {
      await PromptVersion.query()
        .where('promptType', prompt.promptType)
        .where('id', '!=', prompt.id)
        .whereNull('deletedAt')
        .update({ isActive: false })
    }

    return response.status(201).json(
      successResponse(
        {
          id: prompt.id,
          name: prompt.name,
          promptType: prompt.promptType,
          version: prompt.version,
          systemPrompt: prompt.systemPrompt,
          userPromptTemplate: prompt.userPromptTemplate,
          parameters: prompt.parameters,
          isActive: prompt.isActive,
          createdBy: prompt.createdBy,
          createdAt: prompt.createdAt,
        },
        '提示词版本创建成功',
      ),
    )
  }

  async show({ params, response }: HttpContext) {
    const id = Number(params.id)

    const prompt = await PromptVersion.query().where('id', id).whereNull('deletedAt').first()

    if (!prompt) {
      throw new BusinessException('提示词版本不存在', 4004, 404)
    }

    return response.json(
      successResponse({
        id: prompt.id,
        name: prompt.name,
        promptType: prompt.promptType,
        version: prompt.version,
        systemPrompt: prompt.systemPrompt,
        userPromptTemplate: prompt.userPromptTemplate,
        parameters: prompt.parameters,
        isActive: prompt.isActive,
        createdBy: prompt.createdBy,
        updatedBy: prompt.updatedBy,
        createdAt: prompt.createdAt,
        updatedAt: prompt.updatedAt,
      }),
    )
  }

  async update({ params, request, auth, response }: HttpContext) {
    const id = Number(params.id)
    const payload = await request.validateUsing(promptUpdateSchema)
    const userId = auth.user!.id

    const prompt = await PromptVersion.query().where('id', id).whereNull('deletedAt').first()

    if (!prompt) {
      throw new BusinessException('提示词版本不存在', 4004, 404)
    }

    if (payload.name !== undefined) prompt.name = payload.name
    if (payload.promptType !== undefined) prompt.promptType = payload.promptType
    if (payload.systemPrompt !== undefined) prompt.systemPrompt = payload.systemPrompt
    if (payload.userPromptTemplate !== undefined) prompt.userPromptTemplate = payload.userPromptTemplate
    if (payload.parameters !== undefined) prompt.parameters = payload.parameters
    if (payload.isActive !== undefined) prompt.isActive = payload.isActive
    prompt.updatedBy = userId

    if (prompt.isActive) {
      await PromptVersion.query()
        .where('promptType', prompt.promptType)
        .where('id', '!=', prompt.id)
        .whereNull('deletedAt')
        .update({ isActive: false })
    }

    await prompt.save()

    return response.json(
      successResponse(
        {
          id: prompt.id,
          name: prompt.name,
          promptType: prompt.promptType,
          version: prompt.version,
          systemPrompt: prompt.systemPrompt,
          userPromptTemplate: prompt.userPromptTemplate,
          parameters: prompt.parameters,
          isActive: prompt.isActive,
          updatedAt: prompt.updatedAt,
        },
        '提示词版本更新成功',
      ),
    )
  }

  async destroy({ params, auth, response }: HttpContext) {
    const id = Number(params.id)
    const userId = auth.user!.id

    const prompt = await PromptVersion.query().where('id', id).whereNull('deletedAt').first()

    if (!prompt) {
      throw new BusinessException('提示词版本不存在', 4004, 404)
    }

    prompt.deletedAt = DateTime.now()
    prompt.updatedBy = userId
    await prompt.save()

    return response.json(successResponse(null, '提示词版本删除成功'))
  }

  async publish({ params, auth, response }: HttpContext) {
    const id = Number(params.id)
    const userId = auth.user!.id

    const prompt = await PromptVersion.query().where('id', id).whereNull('deletedAt').first()

    if (!prompt) {
      throw new BusinessException('提示词版本不存在', 4004, 404)
    }

    const trx = await db.transaction()

    try {
      await PromptVersion.query({ client: trx })
        .where('promptType', prompt.promptType)
        .whereNull('deletedAt')
        .update({ isActive: false })

      prompt.isActive = true
      prompt.updatedBy = userId
      await prompt.save()

      await trx.commit()

      return response.json(
        successResponse(
          {
            id: prompt.id,
            name: prompt.name,
            promptType: prompt.promptType,
            version: prompt.version,
            isActive: prompt.isActive,
          },
          '提示词版本发布成功',
        ),
      )
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }
}
