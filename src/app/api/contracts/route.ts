import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cacheGet, cacheSet } from '@/lib/redis'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const apartmentId = searchParams.get('apartmentId')

    const cacheKey = `contracts:${session.user.id}:${apartmentId || 'all'}`
    const cached = await cacheGet(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const where: Record<string, unknown> = {}
    if (apartmentId) where.apartmentId = apartmentId

    if (session.user.role === 'RESIDENT') {
      const userApts = await prisma.apartment.findMany({
        where: { residents: { some: { id: session.user.id } } },
        select: { id: true },
      })
      where.apartmentId = { in: userApts.map(a => a.id) }
    }

    const contracts = await prisma.contract.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        apartment: { select: { unitNumber: true, building: true } },
        attachments: {
          select: {
            id: true,
            fileName: true,
            fileUrl: true,
            fileType: true,
            fileSize: true,
            uploadedAt: true,
          },
        },
      },
    })

    const result = contracts.map(c => ({
      ...c,
      rentAmount: Number(c.rentAmount),
      depositAmount: Number(c.depositAmount),
    }))

    await cacheSet(cacheKey, result, 120)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Get contracts error:', error)
    return NextResponse.json({ error: 'Failed to get contracts' }, { status: 500 })
  }
}
