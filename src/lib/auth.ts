import { cache } from 'react'
import prisma from './prisma'
import type { User, UserRole } from '@prisma/client'

export const getCurrentUser = cache(async (): Promise<User> => {
  const defaultUser = await prisma.user.upsert({
    where: { email: 'supervisor@example.com' },
    update: {},
    create: {
      name: '张主管',
      email: 'supervisor@example.com',
      role: 'SUPERVISOR' as UserRole,
    },
  })
  return defaultUser
})

export const requireRole = async (...roles: UserRole[]): Promise<User> => {
  const user = await getCurrentUser()
  if (!roles.includes(user.role)) {
    throw new Error('权限不足')
  }
  return user
}
