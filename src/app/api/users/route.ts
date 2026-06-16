import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cacheGet, cacheSet } from '@/lib/redis'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { Role } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role === 'RESIDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') as Role | null

    const cacheKey = `users:${role || 'all'}`
    const cached = await cacheGet(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const where: Record<string, unknown> = {}
    if (role) where.role = role

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    await cacheSet(cacheKey, users, 120)

    return NextResponse.json(users)
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json({ error: 'Failed to get users' }, { status: 500 })
  }
}
