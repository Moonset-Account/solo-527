import type { HttpContext } from '@adonisjs/core/http'
import Ingredient from '#models/ingredient'
import { schema, rules } from '@adonisjs/validator'

export default class IngredientsController {
  async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)
    const keyword = request.input('keyword', '')
    const category = request.input('category')
    const isActive = request.input('is_active')

    const query = Ingredient.query()

    if (keyword) {
      query.where((q) => {
        q.where('name', 'like', `%${keyword}%`)
        q.orWhere('code', 'like', `%${keyword}%`)
      })
    }

    if (category) {
      query.where('category', category)
    }
    if (isActive !== undefined) {
      query.where('isActive', isActive === 'true' || isActive === true)
    }

    query.orderBy('id', 'desc')

    const ingredients = await query.paginate(page, limit)
    return response.ok(ingredients)
  }

  async show({ params, response }: HttpContext) {
    const ingredient = await Ingredient.findOrFail(params.id)
    return response.ok(ingredient)
  }

  async store({ request, response }: HttpContext) {
    const data = await request.validateUsing(
      schema.create({
        name: schema.string([rules.maxLength(100)]),
        code: schema.string([rules.maxLength(50), rules.unique({ table: 'ingredients', column: 'code' })]),
        category: schema.string.optional([rules.maxLength(50)]),
        unit: schema.string([rules.maxLength(20)]),
        unitPrice: schema.number([rules.range(0, 999999.99)]),
        specification: schema.string.optional([rules.maxLength(100)]),
        remark: schema.string.optional(),
      })
    )

    const ingredient = await Ingredient.create(data)
    return response.created(ingredient)
  }

  async update({ params, request, response }: HttpContext) {
    const ingredient = await Ingredient.findOrFail(params.id)

    const data = await request.validateUsing(
      schema.create({
        name: schema.string.optional([rules.maxLength(100)]),
        category: schema.string.optional([rules.maxLength(50)]),
        unit: schema.string.optional([rules.maxLength(20)]),
        unitPrice: schema.number.optional([rules.range(0, 999999.99)]),
        specification: schema.string.optional([rules.maxLength(100)]),
        isActive: schema.boolean.optional(),
        remark: schema.string.optional(),
      })
    )

    ingredient.merge(data)
    await ingredient.save()

    return response.ok(ingredient)
  }
}
