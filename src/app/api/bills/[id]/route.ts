import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cacheGet, cacheSet } from '@/lib/redis'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { generateOrderNo, formatCurrency } from '@/lib/utils'
import { createLog } from '@/lib/logger'
import { PaymentMethod } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cacheKey = `bill:${params.id}:${session.user.id}`
    const cached = await cacheGet(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const bill = await prisma.bill.findUnique({
      where: { id: params.id },
      include: {
        apartment: true,
        resident: {
          select: { id: true, name: true, phone: true },
        },
        payments: {
          orderBy: { paidAt: 'desc' },
          select: {
            id: true,
            amount: true,
            method: true,
            paidAt: true,
            transactionNo: true,
          },
        },
      },
    })

    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 })
    }

    if (session.user.role === 'RESIDENT' && bill.residentId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = {
      ...bill,
      amount: Number(bill.amount),
      paidAmount: Number(bill.paidAmount),
      remainingAmount: Number(bill.amount) - Number(bill.paidAmount),
      formattedAmount: formatCurrency(bill.amount),
      formattedPaidAmount: formatCurrency(bill.paidAmount),
      payments: bill.payments.map(p => ({
        ...p,
        amount: Number(p.amount),
      })),
    }

    await cacheSet(cacheKey, result, 60)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Get bill detail error:', error)
    return NextResponse.json({ error: 'Failed to get bill detail' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount, method } = await request.json()

    const bill = await prisma.bill.findUnique({ where: { id: params.id } })
    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 })
    }

    if (session.user.role === 'RESIDENT' && bill.residentId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const remaining = Number(bill.amount) - Number(bill.paidAmount)
    if (amount > remaining) {
      return NextResponse.json({ error: 'Payment amount exceeds remaining balance' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          billId: params.id,
          userId: session.user.id,
          amount,
          method: method as PaymentMethod,
          transactionNo: generateOrderNo('TXN'),
        },
      })

      const newPaidAmount = Number(bill.paidAmount) + amount
      const newStatus = newPaidAmount >= Number(bill.amount) ? 'PAID' : 'PARTIAL'

      const updatedBill = await tx.bill.update({
        where: { id: params.id },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus,
          paidDate: newStatus === 'PAID' ? new Date() : bill.paidDate,
        },
      })

      return { payment, updatedBill }
    })

    await createLog({
      userId: session.user.id,
      action: 'PAY',
      targetType: 'Bill',
      targetId: params.id,
      newValue: { amount, method, transactionNo: result.payment.transactionNo },
      detail: `账单 ${bill.billNo} 支付 ${formatCurrency(amount)}`,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Pay bill error:', error)
    return NextResponse.json({ error: 'Payment failed' }, { status: 500 })
  }
}
