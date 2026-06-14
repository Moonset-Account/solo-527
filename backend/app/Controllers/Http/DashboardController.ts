import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Order from 'App/Models/Order'
import Subscription from 'App/Models/Subscription'
import BrandPartnership from 'App/Models/BrandPartnership'
import RefundException from 'App/Models/RefundException'
import SponsorshipBenefit from 'App/Models/SponsorshipBenefit'
import WarningService from 'App/Services/WarningService'
import CacheService from 'App/Services/CacheService'
import { DateTime } from 'luxon'

export default class DashboardController {
  public async overview({ request, response }: HttpContextContract) {
    const cacheKey = 'dashboard:overview'
    const cached = await CacheService.get(cacheKey)
    if (cached && !request.input('refresh')) {
      return response.json(cached)
    }

    const today = DateTime.now()
    const startOfMonth = today.startOf('month')
    const startOfLastMonth = today.minus({ months: 1 }).startOf('month')
    const endOfLastMonth = today.minus({ months: 1 }).endOf('month')

    const [
      totalRevenue,
      monthRevenue,
      lastMonthRevenue,
      totalOrders,
      monthOrders,
      activeSubscriptions,
      totalSubscriptions,
      activePartnerships,
      pendingRefunds,
      pendingBenefits,
    ] = await Promise.all([
      Order.query().where('paymentStatus', 'paid').sum('amount as total').first(),
      Order.query().where('paymentStatus', 'paid').where('createdAt', '>=', startOfMonth.toISO()!).sum('amount as total').first(),
      Order.query().where('paymentStatus', 'paid').whereBetween('createdAt', [startOfLastMonth.toISO()!, endOfLastMonth.toISO()!]).sum('amount as total').first(),
      Order.query().count('* as total').first(),
      Order.query().where('createdAt', '>=', startOfMonth.toISO()!).count('* as total').first(),
      Subscription.query().where('status', 'active').count('* as total').first(),
      Subscription.query().count('* as total').first(),
      BrandPartnership.query().where('status', 'active').count('* as total').first(),
      RefundException.query().whereIn('status', ['pending', 'processing']).count('* as total').first(),
      SponsorshipBenefit.query().where('deliveryStatus', 'pending').count('* as total').first(),
    ])

    const revenueGrowth = lastMonthRevenue.$extras.total > 0
      ? ((Number(monthRevenue.$extras.total) - Number(lastMonthRevenue.$extras.total)) / Number(lastMonthRevenue.$extras.total)) * 100
      : 0

    const result = {
      totalRevenue: Number(totalRevenue.$extras.total) || 0,
      monthRevenue: Number(monthRevenue.$extras.total) || 0,
      lastMonthRevenue: Number(lastMonthRevenue.$extras.total) || 0,
      revenueGrowth: revenueGrowth.toFixed(2),
      totalOrders: Number(totalOrders.$extras.total) || 0,
      monthOrders: Number(monthOrders.$extras.total) || 0,
      activeSubscriptions: Number(activeSubscriptions.$extras.total) || 0,
      totalSubscriptions: Number(totalSubscriptions.$extras.total) || 0,
      activePartnerships: Number(activePartnerships.$extras.total) || 0,
      pendingRefunds: Number(pendingRefunds.$extras.total) || 0,
      pendingBenefits: Number(pendingBenefits.$extras.total) || 0,
    }

    await CacheService.set(cacheKey, result, 30)
    return response.json(result)
  }

  public async retention({ request, response }: HttpContextContract) {
    const cacheKey = 'dashboard:retention'
    const cached = await CacheService.get(cacheKey)
    if (cached && !request.input('refresh')) {
      return response.json(cached)
    }

    const periods = 6
    const monthlyData: any[] = []

    for (let i = periods - 1; i >= 0; i--) {
      const month = DateTime.now().minus({ months: i })
      const startOfMonth = month.startOf('month')
      const endOfMonth = month.endOf('month')

      const [newSubs, activeSubs, renewedSubs, churnedSubs, revenue] = await Promise.all([
        Subscription.query()
          .whereBetween('startDate', [startOfMonth.toISO()!, endOfMonth.toISO()!])
          .count('* as total').first(),
        Subscription.query()
          .where('status', 'active')
          .where('startDate', '<=', endOfMonth.toISO()!)
          .where((q) => {
            q.whereNull('endDate').orWhere('endDate', '>=', startOfMonth.toISO()!)
          })
          .count('* as total').first(),
        Subscription.query()
          .where('status', 'active')
          .where('autoRenew', true)
          .whereBetween('nextBillingDate', [startOfMonth.toISO()!, endOfMonth.toISO()!])
          .count('* as total').first(),
        Subscription.query()
          .where('status', 'cancelled')
          .whereBetween('cancelledAt', [startOfMonth.toISO()!, endOfMonth.toISO()!])
          .count('* as total').first(),
        Order.query()
          .where('paymentStatus', 'paid')
          .where('type', 'subscription')
          .whereBetween('paidAt', [startOfMonth.toISO()!, endOfMonth.toISO()!])
          .sum('amount as total').first(),
      ])

      const activeNum = Number(activeSubs.$extras.total) || 0
      const churnedNum = Number(churnedSubs.$extras.total) || 0
      const churnRate = activeNum > 0 ? ((churnedNum / activeNum) * 100).toFixed(2) : '0.00'
      const renewalRate = Number(newSubs.$extras.total) > 0
        ? ((Number(renewedSubs.$extras.total) / Number(newSubs.$extras.total)) * 100).toFixed(2)
        : '0.00'

      monthlyData.push({
        month: month.toFormat('yyyy-MM'),
        label: month.toFormat('yyyy年MM月'),
        newSubscriptions: Number(newSubs.$extras.total) || 0,
        activeSubscriptions: activeNum,
        renewedSubscriptions: Number(renewedSubs.$extras.total) || 0,
        churnedSubscriptions: churnedNum,
        churnRate,
        renewalRate,
        revenue: Number(revenue.$extras.total) || 0,
      })
    }

    const result = { monthlyData }
    await CacheService.set(cacheKey, result, 60)
    return response.json(result)
  }

  public async warnings({ request, response }: HttpContextContract) {
    const status = request.input('status')
    const level = request.input('level')
    const type = request.input('type')
    const warnings = await WarningService.getWarnings({ status, level, type })
    return response.json(warnings)
  }

  public async exportData({ request, response }: HttpContextContract) {
    const exportType = request.input('type', 'orders')
    const startDate = request.input('startDate')
    const endDate = request.input('endDate')

    let data: any[] = []
    let filename = ''
    let headers = []

    switch (exportType) {
      case 'orders': {
        const query = Order.query()
          .preload('user')
          .preload('partnership')
          .orderBy('createdAt', 'desc')
        if (startDate) query.where('createdAt', '>=', startDate)
        if (endDate) query.where('createdAt', '<=', endDate)
        const orders = await query
        data = orders.map((o) => ({
          订单号: o.orderNo,
          类型: o.type,
          金额: o.amount,
          币种: o.currency,
          支付方式: o.paymentMethod || '-',
          订单状态: o.status,
          支付状态: o.paymentStatus,
          支付时间: o.paidAt ? o.paidAt.toFormat('yyyy-MM-dd HH:mm:ss') : '-',
          交易流水号: o.transactionId || '-',
          创建时间: o.createdAt.toFormat('yyyy-MM-dd HH:mm:ss'),
          备注: o.remark || '-',
        }))
        filename = `订单明细_${DateTime.now().toFormat('yyyyMMdd')}.csv`
        headers = Object.keys(data[0] || {})
        break
      }
      case 'subscriptions': {
        const query = Subscription.query().preload('user').preload('plan').orderBy('createdAt', 'desc')
        if (startDate) query.where('createdAt', '>=', startDate)
        if (endDate) query.where('createdAt', '<=', endDate)
        const subs = await query
        data = subs.map((s) => ({
          用户: s.user?.username || '-',
          套餐: s.plan?.name || '-',
          状态: s.status,
          计费周期: s.billingCycle,
          金额: s.amount,
          开始时间: s.startDate.toFormat('yyyy-MM-dd HH:mm:ss'),
          到期时间: s.endDate ? s.endDate.toFormat('yyyy-MM-dd HH:mm:ss') : '-',
          下次扣款: s.nextBillingDate ? s.nextBillingDate.toFormat('yyyy-MM-dd HH:mm:ss') : '-',
          自动续费: s.autoRenew ? '是' : '否',
        }))
        filename = `订阅明细_${DateTime.now().toFormat('yyyyMMdd')}.csv`
        headers = Object.keys(data[0] || {})
        break
      }
      case 'refunds': {
        const query = RefundException.query()
          .preload('order')
          .preload('handler')
          .orderBy('createdAt', 'desc')
        if (startDate) query.where('createdAt', '>=', startDate)
        if (endDate) query.where('createdAt', '<=', endDate)
        const refunds = await query
        data = refunds.map((r) => ({
          ID: r.id,
          关联订单: r.order?.orderNo || '-',
          异常类型: r.exceptionType,
          状态: r.status,
          退款金额: r.refundAmount,
          原因: r.reason || '-',
          描述: r.description || '-',
          处理人: r.handler?.username || '-',
          处理结论: r.handlerConclusion || '-',
          处理时间: r.handledAt ? r.handledAt.toFormat('yyyy-MM-dd HH:mm:ss') : '-',
          创建时间: r.createdAt.toFormat('yyyy-MM-dd HH:mm:ss'),
        }))
        filename = `退款异常明细_${DateTime.now().toFormat('yyyyMMdd')}.csv`
        headers = Object.keys(data[0] || {})
        break
      }
      default: {
        return response.status(400).json({ message: '无效的导出类型' })
      }
    }

    const csvContent = this.toCSV(headers, data)

    response.header('Content-Type', 'text/csv; charset=utf-8')
    response.header('Content-Disposition', `attachment; filename="${filename}"`)
    response.header('X-Accel-Buffering', 'no')

    return response.send('\uFEFF' + csvContent)
  }

  private toCSV(headers: string[], data: any[]): string {
    if (data.length === 0) return headers.join(',')
    const headerRow = headers.join(',')
    const dataRows = data.map((row) =>
      headers.map((h) => {
        const val = row[h]
        if (val === null || val === undefined) return ''
        const str = String(val).replace(/"/g, '""')
        return /[",\n]/.test(str) ? `"${str}"` : str
      }).join(',')
    )
    return [headerRow, ...dataRows].join('\n')
  }
}
