import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import SpeechTemplate from '#models/speech_template'
import SpeechTemplateVersion from '#models/speech_template_version'
import {
  templateIndexSchema,
  templateStoreSchema,
  templateUpdateSchema,
  templateCreateVersionSchema,
} from '#validators/index'
import { successResponse } from '../utils/helpers.js'
import { BusinessException } from '#exceptions/handler'
import { paginate, buildPaginationMeta } from '../utils/helpers.js'

export default class TemplatesController {
  async index({ request, response }: HttpContext) {
    const payload = await request.validateUsing(templateIndexSchema)
    const { page, perPage, limit, offset } = paginate(payload.page, payload.perPage)

    const query = SpeechTemplate.query().whereNull('deletedAt').preload('currentVersion')

    if (payload.keyword) {
      query.where((builder) => {
        builder.whereILike('name', `%${payload.keyword}%`).orWhereILike('description', `%${payload.keyword}%`)
      })
    }

    if (payload.category) {
      query.where('category', payload.category)
    }

    const cloneQuery = query.clone()
    const total = await cloneQuery.count('* as total')
    const totalCount = Number(total[0].$extras.total || 0)

    const templates = await query.orderBy('createdAt', 'desc').limit(limit).offset(offset).exec()

    const data = templates.map((tpl) => ({
      id: tpl.id,
      name: tpl.name,
      description: tpl.description,
      category: tpl.category,
      currentVersionId: tpl.currentVersionId,
      currentVersion: tpl.currentVersion
        ? {
            id: tpl.currentVersion.id,
            version: tpl.currentVersion.version,
            content: tpl.currentVersion.content,
            variables: tpl.currentVersion.variables,
            isCurrent: tpl.currentVersion.isCurrent,
            createdAt: tpl.currentVersion.createdAt,
          }
        : null,
      createdBy: tpl.createdBy,
      createdAt: tpl.createdAt,
      updatedAt: tpl.updatedAt,
    }))

    return response.json(successResponse(data, 'ok', buildPaginationMeta(totalCount, page, perPage)))
  }

  async store({ request, auth, response }: HttpContext) {
    const payload = await request.validateUsing(templateStoreSchema)
    const userId = auth.user!.id

    const trx = await db.transaction()

    try {
      const template = await SpeechTemplate.create(
        {
          name: payload.name,
          description: payload.description || null,
          category: payload.category || null,
          currentVersionId: null,
          createdBy: userId,
          updatedBy: userId,
        },
        { client: trx },
      )

      const version = await SpeechTemplateVersion.create(
        {
          speechTemplateId: template.id,
          version: payload.version,
          content: payload.content,
          variables: payload.variables || null,
          isCurrent: true,
          createdBy: userId,
        },
        { client: trx },
      )

      template.currentVersionId = version.id
      await template.save()

      await trx.commit()

      return response.status(201).json(
        successResponse(
          {
            id: template.id,
            name: template.name,
            description: template.description,
            category: template.category,
            currentVersionId: template.currentVersionId,
            currentVersion: {
              id: version.id,
              version: version.version,
              content: version.content,
              variables: version.variables,
              isCurrent: version.isCurrent,
              createdAt: version.createdAt,
            },
            createdBy: template.createdBy,
            createdAt: template.createdAt,
          },
          '话术模板创建成功',
        ),
      )
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  async show({ params, response }: HttpContext) {
    const id = Number(params.id)

    const template = await SpeechTemplate.query()
      .where('id', id)
      .whereNull('deletedAt')
      .preload('versions', (q) => q.orderBy('createdAt', 'desc'))
      .preload('currentVersion')
      .first()

    if (!template) {
      throw new BusinessException('话术模板不存在', 4004, 404)
    }

    return response.json(
      successResponse({
        id: template.id,
        name: template.name,
        description: template.description,
        category: template.category,
        currentVersionId: template.currentVersionId,
        currentVersion: template.currentVersion
          ? {
              id: template.currentVersion.id,
              version: template.currentVersion.version,
              content: template.currentVersion.content,
              variables: template.currentVersion.variables,
              isCurrent: template.currentVersion.isCurrent,
              createdBy: template.currentVersion.createdBy,
              createdAt: template.currentVersion.createdAt,
            }
          : null,
        versions: template.versions.map((v) => ({
          id: v.id,
          version: v.version,
          content: v.content.substring(0, 100) + (v.content.length > 100 ? '...' : ''),
          variables: v.variables,
          isCurrent: v.isCurrent,
          createdBy: v.createdBy,
          createdAt: v.createdAt,
        })),
        createdBy: template.createdBy,
        updatedBy: template.updatedBy,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      }),
    )
  }

  async update({ params, request, auth, response }: HttpContext) {
    const id = Number(params.id)
    const payload = await request.validateUsing(templateUpdateSchema)
    const userId = auth.user!.id

    const template = await SpeechTemplate.query().where('id', id).whereNull('deletedAt').first()

    if (!template) {
      throw new BusinessException('话术模板不存在', 4004, 404)
    }

    if (payload.name !== undefined) template.name = payload.name
    if (payload.description !== undefined) template.description = payload.description
    if (payload.category !== undefined) template.category = payload.category
    template.updatedBy = userId

    await template.save()

    return response.json(
      successResponse(
        {
          id: template.id,
          name: template.name,
          description: template.description,
          category: template.category,
          updatedAt: template.updatedAt,
        },
        '话术模板更新成功',
      ),
    )
  }

  async destroy({ params, auth, response }: HttpContext) {
    const id = Number(params.id)
    const userId = auth.user!.id

    const template = await SpeechTemplate.query().where('id', id).whereNull('deletedAt').first()

    if (!template) {
      throw new BusinessException('话术模板不存在', 4004, 404)
    }

    template.deletedAt = DateTime.now()
    template.updatedBy = userId
    await template.save()

    return response.json(successResponse(null, '话术模板删除成功'))
  }

  async createVersion({ params, request, auth, response }: HttpContext) {
    const templateId = Number(params.id)
    const payload = await request.validateUsing(templateCreateVersionSchema)
    const userId = auth.user!.id

    const template = await SpeechTemplate.query().where('id', templateId).whereNull('deletedAt').first()

    if (!template) {
      throw new BusinessException('话术模板不存在', 4004, 404)
    }

    const existingVersion = await SpeechTemplateVersion.query()
      .where('speechTemplateId', templateId)
      .where('version', payload.version)
      .first()

    if (existingVersion) {
      throw new BusinessException('版本号已存在，请使用其他版本号', 4000)
    }

    const trx = await db.transaction()

    try {
      await SpeechTemplateVersion.query({ client: trx })
        .where('speechTemplateId', templateId)
        .update({ isCurrent: false })

      const version = await SpeechTemplateVersion.create(
        {
          speechTemplateId: templateId,
          version: payload.version,
          content: payload.content,
          variables: payload.variables || null,
          isCurrent: true,
          createdBy: userId,
        },
        { client: trx },
      )

      template.currentVersionId = version.id
      template.updatedBy = userId
      await template.save()

      await trx.commit()

      return response.status(201).json(
        successResponse(
          {
            id: version.id,
            speechTemplateId: version.speechTemplateId,
            version: version.version,
            content: version.content,
            variables: version.variables,
            isCurrent: version.isCurrent,
            createdBy: version.createdBy,
            createdAt: version.createdAt,
          },
          '话术版本创建成功',
        ),
      )
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  async publishVersion({ params, auth, response }: HttpContext) {
    const templateId = Number(params.id)
    const versionId = Number(params.versionId)
    const userId = auth.user!.id

    const template = await SpeechTemplate.query().where('id', templateId).whereNull('deletedAt').first()

    if (!template) {
      throw new BusinessException('话术模板不存在', 4004, 404)
    }

    const version = await SpeechTemplateVersion.query()
      .where('id', versionId)
      .where('speechTemplateId', templateId)
      .first()

    if (!version) {
      throw new BusinessException('话术版本不存在', 4004, 404)
    }

    const trx = await db.transaction()

    try {
      await SpeechTemplateVersion.query({ client: trx })
        .where('speechTemplateId', templateId)
        .update({ isCurrent: false })

      version.isCurrent = true
      await version.save()

      template.currentVersionId = versionId
      template.updatedBy = userId
      await template.save()

      await trx.commit()

      return response.json(
        successResponse(
          {
            id: version.id,
            speechTemplateId: version.speechTemplateId,
            version: version.version,
            isCurrent: version.isCurrent,
          },
          '话术版本发布成功',
        ),
      )
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }
}
