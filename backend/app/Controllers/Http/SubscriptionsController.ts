import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Subscription from 'App/Models/Subscription'
import SubscriptionPlan from 'App/Models/SubscriptionPlan'
import Order from 'App/Models/Order'
import { schema } from '@ioc:Adonis/Core/Validator'
import { DateTime } from 'luxon'

export default class SubscriptionsController {
  public async getActivePlans({ response }: HttpContextContract) {
    const plans = await SubscriptionPlan.query()
      .where('isActive', true)
      .orderBy('sortOrder', 'asc')

    return response.json(plans)
  }

  public async index({ request, response }: HttpContextContract) {
    const page = request.input('page', 1)
    const perPage = request.input('perPage', 20)
    const status = request.input('status')
    const userId = request.input('userId')
    const planId = request.input('planId')

    const query = Subscription.query().preload('user').preload('plan')
    if (status) query.where('status', status)
    if (userId) query.where('userId', userId)
    if (planId) query.where('planId', planId)

    const subscriptions = await query.orderBy('createdAt', 'desc').paginate(page, perPage)
    return response.json(subscriptions)
  }

  public async store({ request, response, auth }: HttpContextContract) {
    const validationSchema = schema.create({
      planId: schema.number(),
      billingCycle: schema.enum(['monthly', 'yearly']),
      autoRenew: schema.boolean.optional(),
    })

    const data = await request.validate({ schema: validationSchema })
    const plan = await SubscriptionPlan.findOrFail(data.planId)

    const amount = data.billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice
    const startDate = DateTime.now()
    const endDate = data.billingCycle === 'yearly'
      ? startDate.plus({ years: 1 })
      : startDate.plus({ months: 1 })

    const subscription = await Subscription.create({
      userId: auth.user!.id,
      planId: plan.id,
      status: 'pending',
      billingCycle: data.billingCycle,
      amount,
      startDate,
      endDate,
      nextBillingDate: endDate,
      autoRenew: data.autoRenew ?? true,
    })

    const order = await Order.create({
      orderNo: `SUB${Date.now()}`,
      userId: auth.user!.id,
      type: 'subscription',
      amount,
      currency: 'CNY',
      status: 'pending',
      paymentStatus: 'unpaid',
      remark: `${plan.name} - ${data.billingCycle === 'yearly' ? '年付' : '月付'}`,
    })

    return response.status(201).json({ subscription, order })
  }

  public async checkout({ request, response, auth }: HttpContextContract) {
    const validationSchema = schema.create({
      planId: schema.number(),
      billingCycle: schema.enum(['monthly', 'yearly']),
      paymentMethod: schema.string(),
    })

    const data = await request.validate({ schema: validationSchema })
    const plan = await SubscriptionPlan.findOrFail(data.planId)
    const amount = data.billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice

    const startDate = DateTime.now()
    const endDate = data.billingCycle === 'yearly'
      ? startDate.plus({ years: 1 })
      : startDate.plus({ months: 1 })

    const subscription = await Subscription.create({
      userId: auth.user!.id,
      planId: plan.id,
      status: 'active',
      billingCycle: data.billingCycle,
      amount,
      startDate,
      endDate,
      nextBillingDate: endDate,
      autoRenew: true,
    })

    const order = await Order.create({
      orderNo: `SUB${Date.now()}`,
      userId: auth.user!.id,
      type: 'subscription',
      amount,
      currency: 'CNY',
      paymentMethod: data.paymentMethod,
      status: 'completed',
      paymentStatus: 'paid',
      paidAt: DateTime.now(),
      transactionId: `TXN${Date.now()}`,
      remark: `${plan.name} 订阅付款`,
    })

    return response.status(201).json({ subscription, order, message: '订阅成功' })
  }

  public async show({ params, response }: HttpContextContract) {
    const subscription = await Subscription.query()
      .where('id', params.id)
      .preload('user')
      .preload('plan')
      .preload('refunds')
      .firstOrFail()

    return response.json(subscription)
  }

  public async update({ params, request, response }: HttpContextContract) {
    const subscription = await Subscription.findOrFail(params.id)
    const data = request.only(['status', 'autoRenew', 'cancelReason'])

    if (data.status === 'cancelled' && subscription.status !== 'cancelled') {
      subscription.cancelledAt = DateTime.now()
    }

    subscription.merge(data)
    await subscription.save()
    return response.json(subscription)
  }

  public async destroy({ params, response }: HttpContextContract) {
    const subscription = await Subscription.findOrFail(params.id)
    subscription.status = 'cancelled'
    subscription.cancelledAt = DateTime.now()
    await subscription.save()
    return response.json({ message: '订阅已取消' })
  }
}
