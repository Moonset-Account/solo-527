import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cacheGet, cacheSet, cacheDelPattern } from '@/lib/redis'
import { createLog } from '@/lib/logger'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { BillStatus } from '@prisma/client'
import type { BillSummary, PaginatedResult } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const status = searchParams.get('status') as BillStatus | null
    const type = searchParams.get('type')
    const keyword = searchParams.get('keyword')
    const apartmentId = searchParams.get('apartmentId')

    const cacheKey = `bills:${session.user.id}:${session.user.role}:${page}:${pageSize}:${status || 'all'}:${type || 'all'}:${keyword || 'none'}:${apartmentId || 'all'}`
    const cached = await cacheGet<PaginatedResult<BillSummary>>(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const where: Record<string, unknown> = {}

    if (session.user.role === 'RESIDENT') {
      where.residentId = session.user.id
    }
    if (status) where.status = status
    if (type) where.type = type
    if (apartmentId) where.apartmentId = apartmentId
    if (keyword) {
      where.OR = [
        { billNo: { contains: keyword } },
        { title: { contains: keyword } },
        { apartment: { unitNumber: { contains: keyword } } },
      ]
    }

    const [total, bills] = await Promise.all([
      prisma.bill.count({ where }),
      prisma.bill.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          billNo: true,
          type: true,
          title: true,
          amount: true,
          paidAmount: true,
          status: true,
          dueDate: true,
          apartment: {
            select: {
              unitNumber: true,
              building: true,
            },
          },
        },
      }),
    ])

    const result: PaginatedResult<BillSummary> = {
      data: bills.map(b => ({
        ...b,
        amount: Number(b.amount),
        paidAmount: Number(b.paidAmount),
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }

    await cacheSet(cacheKey, result, 30)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Get bills error:', error)
    return NextResponse.json({ error: 'Failed to get bills' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role === 'RESIDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const bill = await prisma.bill.create({ data })

    await createLog({
      userId: session.user.id,
      action: 'CREATE',
      targetType: 'Bill',
      targetId: bill.id,
      newValue: bill,
      detail: `创建账单 ${bill.billNo}`,
    })

    await cacheDelPattern('bills:*')

    return NextResponse.json(bill)
  } catch (error) {
    console.error('Create bill error:', error)
    return NextResponse.json({ error: 'Failed to create bill' }, { status: 500 })
  }
}
