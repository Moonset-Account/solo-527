import type { NextRequest } from 'next/server';
import type { Context } from './trpc';
import { prisma } from './db';
import { UserRole } from '@prisma/client';

export async function createTRPCContext(req: NextRequest): Promise<Context> {
  const userId = req.headers.get('x-user-id');
  const userRole = req.headers.get('x-user-role') as UserRole | null;
  const userEmail = req.headers.get('x-user-email');
  const userName = req.headers.get('x-user-name');

  if (userId && userRole) {
    return {
      user: {
        id: userId,
        role: userRole,
        email: userEmail || '',
        name: userName || '',
      },
    };
  }

  const demoUsers = await prisma.user.findFirst({
    where: { role: UserRole.ADMIN },
  });

  if (demoUsers) {
    return {
      user: {
        id: demoUsers.id,
        role: demoUsers.role,
        email: demoUsers.email,
        name: demoUsers.name,
      },
    };
  }

  return { user: null };
}
