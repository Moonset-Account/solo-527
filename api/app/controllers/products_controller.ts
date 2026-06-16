import { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product'
import ChangeLogService from '#services/change_log_service'

export default class ProductsController {
  public async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = request.input('perPage', 20)
    const category = request.input('category')
    const status = request.input('status')
    const search = request.input('search')

    const query = Product.query()

    if (category) query.where('category', category)
    if (status) query.where('status', status)
    if (search) {
      query.where((builder) => {
        builder.where('name', 'ilike', `%${search}%`).orWhere('sku', 'ilike', `%${search}%`)
      })
    }

    const products = await query.orderBy('createdAt', 'desc').paginate(page, perPage)
    return response.ok(products)
  }

  public async show({ params, response }: HttpContext) {
    const product = await Product.query()
      .where('id', params.id)
      .preload('evaluations')
      .preload('restockAlerts', (q) => q.where('status', 'pending'))
      .firstOrFail()

    return response.ok(product)
  }

  public async store({ request, response, auth }: HttpContext) {
    const data = request.only([
      'name',
      'sku',
      'category',
      'brand',
      'description',
      'unit',
      'costPrice',
      'retailPrice',
      'currentStock',
      'safetyStock',
      'maxStock',
      'status',
    ])

    const product = await Product.create(data)

    await ChangeLogService.logChange(
      'product',
      product.id,
      'create',
      null,
      null,
      null,
      auth.user!.id
    )

    return response.created(product)
  }

  public async update({ params, request, response, auth }: HttpContext) {
    const product = await Product.findOrFail(params.id)
    const oldValues = product.toJSON()

    const data = request.only([
      'name',
      'sku',
      'category',
      'brand',
      'description',
      'unit',
      'costPrice',
      'retailPrice',
      'safetyStock',
      'maxStock',
      'status',
    ])

    product.merge(data)
    await product.save()

    await ChangeLogService.logEntityChanges('product', product.id, oldValues, data, auth.user!.id)

    return response.ok(product)
  }

  public async destroy({ params, response }: HttpContext) {
    const product = await Product.findOrFail(params.id)
    await product.delete()
    return response.noContent()
  }
}
