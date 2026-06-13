import type { HttpContext } from '@adonisjs/core/http'
import Store from '#models/store'

export default class StoresController {
  async index({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)
    const keyword = request.input('keyword', '')

    const query = Store.query().where('isActive', true)

    if (user.role === 'store_manager' || user.role === 'staff') {
      query.where('id', user.storeId!)
    }

    if (keyword) {
      query.where((q) => {
        q.where('name', 'like', `%${keyword}%`)
        q.orWhere('code', 'like', `%${keyword}%`)
      })
    }

    query.orderBy('id', 'desc')
    const stores = await query.paginate(page, limit)

    return response.ok(stores)
  }

  async show({ params, response }: HttpContext) {
    const store = await Store.findOrFail(params.id)
    return response.ok(store)
  }
}
