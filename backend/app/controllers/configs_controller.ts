import type { HttpContext } from '@adonisjs/core/http'
import Config from '#models/config'
import ConfigHistory from '#models/config_history'
import { updateConfigValidator, configHistoryValidator } from '#validators/config'
import db from '@adonisjs/lucid/services/db'

export default class ConfigsController {
  async index({ response }: HttpContext) {
    const configs = await Config.query()
      .orderBy('key', 'asc')

    return response.json({
      data: configs,
    })
  }

  async show({ params, response }: HttpContext) {
    const config = await Config.query()
      .where('key', params.key)
      .first()

    if (!config) {
      return response.status(404).json({ message: '配置不存在' })
    }

    return response.json({ data: config })
  }

  async update({ params, request, response, auth }: HttpContext) {
    const { value, description, changeReason } = await request.validateUsing(updateConfigValidator)
    const user = auth.user!

    const config = await Config.query()
      .where('key', params.key)
      .first()

    if (!config) {
      return response.status(404).json({ message: '配置不存在' })
    }

    const oldValue = config.value

    await db.transaction(async (trx) => {
      if (value !== undefined) {
        config.value = value
      }
      if (description !== undefined) {
        config.description = description
      }
      config.updatedBy = user.id
      config.useTransaction(trx)
      await config.save()

      if (oldValue !== value) {
        await ConfigHistory.create({
          configKey: config.key,
          oldValue,
          newValue: value,
          changeReason,
          operatorId: user.id,
        }, { client: trx })
      }
    })

    return response.json({
      message: '配置更新成功',
      data: config,
    })
  }

  async create({ request, response, auth }: HttpContext) {
    const { key, value, description } = request.only([
      'key',
      'value',
      'description',
    ]) as {
      key: string
      value?: string
      description?: string
    }
    const user = auth.user!

    if (!key) {
      return response
        .status(400)
        .json({ message: '配置键名不能为空' })
    }

    const existing = await Config.query()
      .where('key', key)
      .first()

    if (existing) {
      return response
        .status(400)
        .json({ message: '配置键名已存在' })
    }

    const config = await Config.create({
      key,
      value,
      description,
      updatedBy: user.id,
    })

    return response.status(201).json({
      message: '配置创建成功',
      data: config,
    })
  }

  async history({ request, response }: HttpContext) {
    const { page = 1, perPage = 10, configKey } = await request.validateUsing(configHistoryValidator)

    const query = ConfigHistory.query()
      .orderBy('createdAt', 'desc')

    if (configKey) {
      query.where('configKey', configKey)
    }

    const history = await query
      .preload('operator')
      .paginate(page, perPage)

    return response.json({
      data: history.toJSON(),
    })
  }

  async getValue({ params, response }: HttpContext) {
    const config = await Config.query()
      .where('key', params.key)
      .first()

    if (!config) {
      return response.json({ data: null })
    }

    return response.json({ data: config.value })
  }
}
