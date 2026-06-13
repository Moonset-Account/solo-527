import type { HttpContext } from '@adonisjs/core/http'
import Sale from '#models/sale'
import ExceptionRecord from '#models/exception_record'
import ProcessRecord from '#models/process_record'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

export default class ReportsController {
  async profitReport({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const storeId = request.input('store_id')
    const startDate = request.input('start_date')
    const endDate = request.input('end_date')
    const groupBy = request.input('group_by', 'day')

    let targetStoreId = user.storeId
    if (!targetStoreId && storeId) {
      targetStoreId = Number(storeId)
    }

    if (!targetStoreId) {
      return response.badRequest({ message: '请指定门店' })
    }

    let start = startDate ? DateTime.fromISO(startDate) : DateTime.now().minus({ days: 30 })
    let end = endDate ? DateTime.fromISO(endDate) : DateTime.now()

    const saleQuery = Sale.query().where('storeId', targetStoreId)
    saleQuery.where('saleDate', '>=', start.toSQLDate()!)
    saleQuery.where('saleDate', '<=', end.toSQLDate()!)

    const sales = await saleQuery
      .select(
        db.raw("DATE(sale_date) as date"),
        db.raw('SUM(total_amount) as total_amount'),
        db.raw('SUM(cost_amount) as cost_amount'),
        db.raw('SUM(profit_amount) as profit_amount'),
        db.raw('SUM(discount_amount) as discount_amount'),
        db.raw('SUM(order_count) as order_count'),
        db.raw('COUNT(*) as record_count')
      )
      .groupByRaw("DATE(sale_date)")
      .orderByRaw("DATE(sale_date) DESC")

    const exceptionQuery = ExceptionRecord.query().where('storeId', targetStoreId)
    exceptionQuery.where('createdAt', '>=', start.toJSDate())
    exceptionQuery.where('createdAt', '<=', end.endOf('day').toJSDate())

    const exceptions = await exceptionQuery
      .select(
        db.raw("DATE(created_at) as date"),
        db.raw('SUM(CASE WHEN loss_amount IS NOT NULL THEN loss_amount ELSE 0 END) as loss_amount'),
        db.raw('COUNT(*) as exception_count')
      )
      .groupByRaw("DATE(created_at)")
      .orderByRaw("DATE(created_at) DESC")

    const cashFlowQuery = ProcessRecord.query()
      .where('storeId', targetStoreId)
      .where('type', 'cash_flow')
    cashFlowQuery.where('createdAt', '>=', start.toJSDate())
    cashFlowQuery.where('createdAt', '<=', end.endOf('day').toJSDate())

    const cashFlows = await cashFlowQuery
      .select(
        db.raw("DATE(created_at) as date"),
        db.raw('SUM(CASE WHEN data->>\'flowType\' = \'income\' THEN amount ELSE 0 END) as income'),
        db.raw('SUM(CASE WHEN data->>\'flowType\' = \'expense\' THEN amount ELSE 0 END) as expense')
      )
      .groupByRaw("DATE(created_at)")
      .orderByRaw("DATE(created_at) DESC")

    const dailyData = new Map()

    for (const sale of sales) {
      const date = String(sale.$extras.date)
      if (!dailyData.has(date)) {
        dailyData.set(date, { date })
      }
      const data = dailyData.get(date)
      data.salesAmount = Number(sale.$extras.total_amount || 0)
      data.costAmount = Number(sale.$extras.cost_amount || 0)
      data.profitAmount = Number(sale.$extras.profit_amount || 0)
      data.discountAmount = Number(sale.$extras.discount_amount || 0)
      data.orderCount = Number(sale.$extras.order_count || 0)
      data.saleRecordCount = Number(sale.$extras.record_count || 0)
    }

    for (const exp of exceptions) {
      const date = String(exp.$extras.date)
      if (!dailyData.has(date)) {
        dailyData.set(date, { date })
      }
      const data = dailyData.get(date)
      data.lossAmount = Number(exp.$extras.loss_amount || 0)
      data.exceptionCount = Number(exp.$extras.exception_count || 0)
    }

    for (const cf of cashFlows) {
      const date = String(cf.$extras.date)
      if (!dailyData.has(date)) {
        dailyData.set(date, { date })
      }
      const data = dailyData.get(date)
      data.cashIncome = Number(cf.$extras.income || 0)
      data.cashExpense = Number(cf.$extras.expense || 0)
    }

    const dailyList = Array.from(dailyData.values()).sort((a, b) => b.date.localeCompare(a.date))

    let totalSales = 0
    let totalCost = 0
    let totalProfit = 0
    let totalDiscount = 0
    let totalLoss = 0
    let totalOrders = 0
    let totalCashIncome = 0
    let totalCashExpense = 0

    for (const day of dailyList) {
      totalSales += day.salesAmount || 0
      totalCost += day.costAmount || 0
      totalProfit += day.profitAmount || 0
      totalDiscount += day.discountAmount || 0
      totalLoss += day.lossAmount || 0
      totalOrders += day.orderCount || 0
      totalCashIncome += day.cashIncome || 0
      totalCashExpense += day.cashExpense || 0
    }

    const netProfit = totalProfit - totalLoss

    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0

    return response.ok({
      summary: {
        totalSales,
        totalCost,
        totalProfit,
        totalDiscount,
        totalLoss,
        netProfit,
        totalOrders,
        avgOrderValue,
        totalCashIncome,
        totalCashExpense,
        dateRange: {
          start: start.toISODate(),
          end: end.toISODate(),
        },
      },
      daily: dailyList,
    })
  }
}
