import type { HttpContext } from '@adonisjs/core/http'
import PriceRule from '#models/price_rule'
import { createPriceRuleValidator, updatePriceRuleValidator } from '#validators/price_rule'

export default class PriceRulesController {
  async index({ request, response }: HttpContext) {
    const { page = 1, perPage = 10, deviceType, isActive } = request.qs() as {
      page?: number
      perPage?: number
      deviceType?: string
      isActive?: string
    }

    const query = PriceRule.query().orderBy('id', 'desc')

    if (deviceType) {
      query.where('deviceType', deviceType)
    }

    if (isActive !== undefined) {
      query.where('isActive', isActive === 'true')
    }

    const rules = await query.paginate(page, perPage)

    return response.json({
      data: rules.toJSON(),
    })
  }

  async all({ response }: HttpContext) {
    const rules = await PriceRule.query()
      .where('isActive', true)
      .orderBy('deviceType', 'asc')

    return response.json({
      data: rules,
    })
  }

  async show({ params, response }: HttpContext) {
    const rule = await PriceRule.find(params.id)
    if (!rule) {
      return response.status(404).json({ message: '价格规则不存在' })
    }

    return response.json({ data: rule })
  }

  async store({ request, response }: HttpContext) {
    const data = await request.validateUsing(createPriceRuleValidator)

    const rule = await PriceRule.create(data)

    return response.status(201).json({
      message: '价格规则创建成功',
      data: rule,
    })
  }

  async update({ params, request, response }: HttpContext) {
    const rule = await PriceRule.find(params.id)
    if (!rule) {
      return response.status(404).json({ message: '价格规则不存在' })
    }

    const data = await request.validateUsing(updatePriceRuleValidator)

    rule.merge(data)
    await rule.save()

    return response.json({
      message: '价格规则更新成功',
      data: rule,
    })
  }

  async destroy({ params, response }: HttpContext) {
    const rule = await PriceRule.find(params.id)
    if (!rule) {
      return response.status(404).json({ message: '价格规则不存在' })
    }

    await rule.delete()

    return response.json({ message: '价格规则已删除' })
  }
}
