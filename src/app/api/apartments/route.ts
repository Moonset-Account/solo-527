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

    const cacheKey = `apartments:${session.user.id}:${session.user.role}`
    const cached = await cacheGet(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const where: Record<string, unknown> = {}

    if (session.user.role === 'RESIDENT') {
      where.residents = { some: { id: session.user.id } }
    }

    const apartments = await prisma.apartment.findMany({
      where,
      select: {
        id: true,
        unitNumber: true,
        building: true,
        floor: true,
        room: true,
        area: true,
        residents: {
          select: { id: true, name: true, phone: true },
        },
      },
      orderBy: { unitNumber: 'asc' },
    })

    await cacheSet(cacheKey, apartments, 300)

    return NextResponse.json(apartments)
  } catch (error) {
    console.error('Get apartments error:', error)
    return NextResponse.json({ error: 'Failed to get apartments' }, { status: 500 })
  }
}
