import { auth } from '@clerk/nextjs';
import { prisma } from './prisma';
import { Role } from '@prisma/client';

export async function getCurrentUser() {
  const { userId } = auth();
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('未登录');
  }
  return user;
}

export async function requireRole(roles: Role[]) {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    throw new Error('权限不足');
  }
  return user;
}

export async function requireLegalRole() {
  return requireRole([Role.LEGAL, Role.ADMIN]);
}

export async function requireAdminRole() {
  return requireRole([Role.ADMIN]);
}

export async function requireProBonoLawyerRole() {
  return requireRole([Role.PRO_BONO_LAWYER, Role.ADMIN]);
}

export async function syncClerkUser(clerkUserId: string, email: string, name?: string) {
  const existingUser = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
  });

  if (existingUser) {
    return existingUser;
  }

  return prisma.user.create({
    data: {
      clerkId: clerkUserId,
      email,
      name,
    },
  });
}
