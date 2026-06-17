import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from './prisma'
import type { UserRole } from '@prisma/client'

export async function getCurrentUser() {
  const user = await currentUser()
  if (!user) return null

  const email = user.emailAddresses[0]?.emailAddress
  if (!email) return null

  let dbUser = await prisma.user.findUnique({
    where: { clerkId: user.id },
  })

  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        clerkId: user.id,
        email,
        name: user.fullName || user.firstName || email.split('@')[0],
      },
    })
  } else if (!dbUser.name && user.fullName) {
    dbUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: { name: user.fullName },
    })
  }

  return dbUser
}

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('未登录')
  }
  return user
}

export async function requireRole(roles: UserRole[]) {
  const user = await requireUser()
  if (!roles.includes(user.role)) {
    throw new Error('权限不足')
  }
  return user
}

export async function requireAdmin() {
  return requireRole(['ADMIN'])
}

export async function requireRepresentativeOrAdmin() {
  return requireRole(['REPRESENTATIVE', 'ADMIN'])
}

export async function createAuditLog(
  action: string,
  entityType: string,
  entityId?: string,
  detail?: Record<string, unknown>,
  request?: Request,
) {
  const { userId: clerkId } = await auth()
  const user = clerkId
    ? await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
    : null

  const ipAddress = request?.headers.get('x-forwarded-for')?.split(',')[0] || undefined
  const userAgent = request?.headers.get('user-agent') || undefined

  return prisma.auditLog.create({
    data: {
      action,
      entityType,
      entityId,
      detail: detail as never,
      userId: user?.id,
      ipAddress,
      userAgent,
    },
  })
}
