import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import ConfigService from 'App/Services/ConfigService'
import ReminderConfig from 'App/Models/ReminderConfig'
import ConfigDictionary from 'App/Models/ConfigDictionary'
import CacheService from 'App/Services/CacheService'
import { schema } from '@ioc:Adonis/Core/Validator'

export default class ConfigsController {
  public async getStatusDict({ request, response }: HttpContextContract) {
    const dictType = request.input('dictType')
    const data = await ConfigService.getStatusDict(dictType)
    return response.json({ data })
  }

  public async updateStatusDict({ request, response }: HttpContextContract) {
    const validationSchema = schema.create({
      dictType: schema.string(),
      items: schema.array().members(
        schema.object().members({
          dictKey: schema.string(),
          dictValue: schema.string(),
          label: schema.string(),
          color: schema.string.optional(),
          sortOrder: schema.number.optional(),
        })
      ),
    })

    const data = await request.validate({ schema: validationSchema })
    await ConfigService.updateStatusDict(data.dictType, data.items)

    return response.json({ message: '状态字典更新成功' })
  }

  public async getReminderFrequency({ response }: HttpContextContract) {
    const configs = await ReminderConfig.query().orderBy('id', 'asc')
    return response.json({ data: configs })
  }

  public async updateReminderFrequency({ request, response }: HttpContextContract) {
    const validationSchema = schema.create({
      items: schema.array().members(
        schema.object().members({
          id: schema.number(),
          frequencyMinutes: schema.number(),
          isEnabled: schema.boolean(),
          sendEmail: schema.boolean.optional(),
          sendSms: schema.boolean.optional(),
          sendInApp: schema.boolean.optional(),
          customMessage: schema.string.optional(),
        })
      ),
    })

    const data = await request.validate({ schema: validationSchema })

    for (const item of data.items) {
      const config = await ReminderConfig.find(item.id)
      if (config) {
        config.merge(item)
        await config.save()
      }
    }

    await CacheService.invalidatePattern('warning:rate:*')
    return response.json({ message: '提醒频率更新成功' })
  }

  public async getAll({ response }: HttpContextContract) {
    const [statusDict, reminderConfigs] = await Promise.all([
      ConfigService.getStatusDict(),
      ReminderConfig.query().orderBy('id', 'asc'),
    ])

    const dictTypes = await ConfigDictionary.query()
      .select('dictType')
      .distinct()
      .orderBy('dictType', 'asc')

    return response.json({
      statusDict,
      reminderConfigs,
      dictTypes: dictTypes.map((d) => d.dictType),
    })
  }
}
