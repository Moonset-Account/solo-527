import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Customer from 'App/Models/Customer'
import Booking from 'App/Models/Booking'

export default class CustomersController {
  public async index({ request, response }: HttpContextContract) {
    const page = Number(request.input('page', 1))
    const perPage = Number(request.input('perPage', 20))
    const keyword = request.input('keyword', '')
    const sort = request.input('sort', '-noShowRate')

    let query = Customer.query()

    if (keyword) {
      query.where('name', 'like', `%${keyword}%`)
        .orWhere('phone', 'like', `%${keyword}%`)
    }

    if (sort.startsWith('-')) {
      query.orderBy(sort.substring(1), 'desc')
    } else {
      query.orderBy(sort, 'asc')
    }

    const data = await query.paginate(page, perPage)
    return response.ok({ data })
  }

  public async store({ request, response }: HttpContextContract) {
    const data = request.only(['name', 'phone', 'gender', 'age', 'medicalHistory'])
    const customer = await Customer.create({
      ...data,
      age: data.age ? Number(data.age) : null,
    })
    return response.created({ data: customer, message: '客户创建成功' })
  }

  public async show({ params, response }: HttpContextContract) {
    const customer = await Customer.findOrFail(params.id)
    return response.ok({ data: customer })
  }

  public async update({ params, request, response }: HttpContextContract) {
    const customer = await Customer.findOrFail(params.id)
    const data = request.only(['name', 'phone', 'gender', 'age', 'medicalHistory'])
    customer.merge({
      ...data,
      age: data.age ? Number(data.age) : null,
    })
    await customer.save()
    return response.ok({ data: customer, message: '客户更新成功' })
  }

  public async destroy({ params, response }: HttpContextContract) {
    const customer = await Customer.findOrFail(params.id)
    await customer.delete()
    return response.ok({ message: '客户已删除' })
  }

  public async getBookings({ params, request, response }: HttpContextContract) {
    const page = Number(request.input('page', 1))
    const perPage = Number(request.input('perPage', 10))
    const data = await Booking.query()
      .where('customer_id', params.id)
      .preload('staff')
      .preload('service')
      .orderBy('booking_date', 'desc')
      .paginate(page, perPage)
    return response.ok({ data })
  }
}
