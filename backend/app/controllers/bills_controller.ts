import Bill from '#models/bill'
import Seat from '#models/seat'
import OperationLog from '#models/operation_log'
import DailyUsage from '#models/daily_usage'
import {
  createBillSchema,
  updateBillSchema,
  queryBillSchema,
  generateBillsSchema,
} from '#validators/bill_validator'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

function generateBillNo(): string {
  const now = DateTime.now()
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0')
  return `BILL${now.toFormat('yyyyMMddHHmmss')}${random}`
}

export default class BillsController {
  async index({ request, auth, serialize }: HttpContext) {
    const payload = await request.validateUsing(queryBillSchema)
    const page = payload.page || 1
    const perPage = payload.perPage || 20

    const query = Bill.query().preload('seat')

    if (payload.seatId) {
      query.where('seatId', payload.seatId)
    }

    if (payload.customerId) {
      query.where('customerId', payload.customerId)
    }

    if (payload.customerName) {
      query.where('customerName', 'like', `%${payload.customerName}%`)
    }

    if (payload.status) {
      query.where('status', payload.status)
    }

    if (payload.billingMonth) {
      query.where('billingMonth', payload.billingMonth)
    }

    if (payload.startDate) {
      query.where('periodStart', '>=', DateTime.fromISO(payload.startDate).toFormat('yyyy-MM-dd'))
    }

    if (payload.endDate) {
      query.where('periodEnd', '<=', DateTime.fromISO(payload.endDate).toFormat('yyyy-MM-dd'))
    }

    if (payload.keyword) {
      query.where((q) => {
        q.where('billNo', 'like', `%${payload.keyword}%`)
        q.orWhere('customerName', 'like', `%${payload.keyword}%`)
        q.orWhere('customerId', 'like', `%${payload.keyword}%`)
      })
    }

    query.orderBy('createdAt', 'desc')

    const bills = await query.paginate(page, perPage)

    const user = auth.getUserOrFail()
    await OperationLog.create({
      userId: user.id,
      userName: user.fullName,
      action: 'view_bill_list',
      resourceType: 'bill',
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: { ...payload, page, perPage },
    })

    return serialize(bills)
  }

  async show({ request, auth, serialize }: HttpContext) {
    const id = request.param('id')

    const bill = await Bill.query().where('id', id).preload('seat').firstOrFail()

    const user = auth.getUserOrFail()
    await OperationLog.create({
      userId: user.id,
      userName: user.fullName,
      action: 'view_bill_detail',
      resourceType: 'bill',
      resourceId: bill.id,
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: { billId: id, billNo: bill.billNo },
    })

    return serialize(bill)
  }

  async store({ request, auth, serialize }: HttpContext) {
    const payload = await request.validateUsing(createBillSchema)

    const seat = await Seat.query().where('id', payload.seatId).preload('plan').firstOrFail()

    const bill = new Bill()
    bill.billNo = generateBillNo()
    bill.seatId = payload.seatId
    bill.customerId = seat.customerId
    bill.customerName = seat.customerName
    bill.planName = seat.plan?.name || ''
    bill.billingMonth = payload.billingMonth
    bill.periodStart = DateTime.fromISO(payload.periodStart)
    bill.periodEnd = DateTime.fromISO(payload.periodEnd)
    bill.amount = payload.amount
    bill.apiCallsUsed = payload.apiCallsUsed || 0
    bill.status = payload.status || 'draft'
    bill.dueDate = payload.dueDate ? DateTime.fromISO(payload.dueDate) : null
    bill.remark = payload.remark || null
    bill.createdBy = auth.user?.id || null

    await bill.save()

    const user = auth.getUserOrFail()
    await OperationLog.create({
      userId: user.id,
      userName: user.fullName,
      action: 'create_bill',
      resourceType: 'bill',
      resourceId: bill.id,
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: { ...payload, billNo: bill.billNo },
    })

    return serialize(bill)
  }

  async update({ request, auth, serialize }: HttpContext) {
    const id = request.param('id')
    const payload = await request.validateUsing(updateBillSchema)

    const bill = await Bill.findOrFail(id)
    const oldData = bill.toJSON()

    if (payload.status !== undefined) {
      bill.status = payload.status
      if (payload.status === 'paid' && !bill.paidAt) {
        bill.paidAt = DateTime.now()
      }
    }

    if (payload.amount !== undefined) {
      bill.amount = payload.amount
    }

    if (payload.dueDate !== undefined) {
      bill.dueDate = payload.dueDate ? DateTime.fromISO(payload.dueDate) : null
    }

    if (payload.paidAt !== undefined) {
      bill.paidAt = payload.paidAt ? DateTime.fromISO(payload.paidAt) : null
    }

    if (payload.remark !== undefined) {
      bill.remark = payload.remark
    }

    if (payload.apiCallsUsed !== undefined) {
      bill.apiCallsUsed = payload.apiCallsUsed
    }

    await bill.save()

    const user = auth.getUserOrFail()
    await OperationLog.create({
      userId: user.id,
      userName: user.fullName,
      action: 'update_bill',
      resourceType: 'bill',
      resourceId: bill.id,
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: {
        billId: id,
        billNo: bill.billNo,
        oldData,
        newData: payload,
      },
    })

    return serialize(bill)
  }

  async destroy({ request, auth, serialize }: HttpContext) {
    const id = request.param('id')

    const bill = await Bill.findOrFail(id)
    const billNo = bill.billNo

    await bill.delete()

    const user = auth.getUserOrFail()
    await OperationLog.create({
      userId: user.id,
      userName: user.fullName,
      action: 'delete_bill',
      resourceType: 'bill',
      resourceId: bill.id,
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: { billId: id, billNo },
    })

    return serialize({
      message: '账单删除成功',
    })
  }

  async generate({ request, auth, serialize }: HttpContext) {
    const payload = await request.validateUsing(generateBillsSchema)

    const billingMonth = payload.billingMonth
    const monthDate = DateTime.fromFormat(billingMonth, 'yyyy-MM')
    const periodStart = monthDate.startOf('month')
    const periodEnd = monthDate.endOf('month')

    const seatQuery = Seat.query().where('status', 'active').preload('plan')

    if (payload.seatIds && payload.seatIds.length > 0) {
      seatQuery.whereIn('id', payload.seatIds)
    }

    const seats = await seatQuery

    const trx = await db.transaction()
    const generatedBills: Bill[] = []

    try {
      for (const seat of seats) {
        const existingBill = await Bill.query()
          .where('seatId', seat.id)
          .where('billingMonth', billingMonth)
          .first()

        if (existingBill) {
          continue
        }

        const usageStats = await DailyUsage.query()
          .where('seatId', seat.id)
          .whereBetween('statDate', [periodStart.toFormat('yyyy-MM-dd'), periodEnd.toFormat('yyyy-MM-dd')])
          .select(db.raw('COALESCE(SUM(total_calls), 0) as total_calls'))
          .first()

        const apiCallsUsed = Number(usageStats?.$extras.total_calls || 0)

        let amount = seat.plan?.priceMonthly || 0

        const bill = new Bill()
        bill.useTransaction(trx)
        bill.billNo = generateBillNo()
        bill.seatId = seat.id
        bill.customerId = seat.customerId
        bill.customerName = seat.customerName
        bill.planName = seat.plan?.name || ''
        bill.billingMonth = billingMonth
        bill.periodStart = periodStart
        bill.periodEnd = periodEnd
        bill.amount = amount
        bill.apiCallsUsed = apiCallsUsed
        bill.status = 'draft'
        bill.createdBy = auth.user?.id || null

        await bill.save()
        generatedBills.push(bill)
      }

      await trx.commit()
    } catch (error) {
      await trx.rollback()
      throw error
    }

    const user = auth.getUserOrFail()
    await OperationLog.create({
      userId: user.id,
      userName: user.fullName,
      action: 'generate_bills',
      resourceType: 'bill',
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: {
        billingMonth,
        seatCount: seats.length,
        generatedCount: generatedBills.length,
        seatIds: payload.seatIds,
      },
    })

    return serialize({
      message: `成功生成 ${generatedBills.length} 条账单`,
      generatedCount: generatedBills.length,
      totalSeats: seats.length,
      bills: generatedBills,
    })
  }

  async export({ request, auth, response }: HttpContext) {
    const { status, billingMonth, startDate, endDate, keyword } = request.qs()

    const query = Bill.query().preload('seat')

    if (status) {
      query.where('status', status)
    }

    if (billingMonth) {
      query.where('billingMonth', billingMonth)
    }

    if (startDate) {
      query.where('periodStart', '>=', DateTime.fromISO(startDate).toFormat('yyyy-MM-dd'))
    }

    if (endDate) {
      query.where('periodEnd', '<=', DateTime.fromISO(endDate).toFormat('yyyy-MM-dd'))
    }

    if (keyword) {
      query.where((q) => {
        q.where('billNo', 'like', `%${keyword}%`)
        q.orWhere('customerName', 'like', `%${keyword}%`)
        q.orWhere('customerId', 'like', `%${keyword}%`)
      })
    }

    query.orderBy('createdAt', 'desc')

    const bills = await query

    const csvData = [
      ['账单编号', '客户ID', '客户名称', '套餐名称', '账期', '开始日期', '结束日期', '金额', 'API调用量', '状态', '到期日期', '支付时间', '备注'],
    ]

    for (const bill of bills) {
      csvData.push([
        bill.billNo,
        bill.customerId,
        bill.customerName,
        bill.planName,
        bill.billingMonth,
        bill.periodStart.toFormat('yyyy-MM-dd'),
        bill.periodEnd.toFormat('yyyy-MM-dd'),
        bill.amount.toString(),
        bill.apiCallsUsed.toString(),
        bill.status,
        bill.dueDate ? bill.dueDate.toFormat('yyyy-MM-dd') : '',
        bill.paidAt ? bill.paidAt.toFormat('yyyy-MM-dd HH:mm:ss') : '',
        bill.remark || '',
      ])
    }

    const csvContent = csvData.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')

    const user = auth.getUserOrFail()
    await OperationLog.create({
      userId: user.id,
      userName: user.fullName,
      action: 'export_bills',
      resourceType: 'bill',
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: { status, billingMonth, startDate, endDate, keyword, count: bills.length },
    })

    response.header('Content-Type', 'text/csv; charset=utf-8')
    response.header(
      'Content-Disposition',
      `attachment; filename="bills_${DateTime.now().toFormat('yyyyMMddHHmmss')}.csv"`
    )

    return `\ufeff${csvContent}`
  }
}
