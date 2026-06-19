import { auth } from "@clerk/nextjs/server";
import { prisma } from "./prisma";
import { UserRole } from "@prisma/client";

const ADMIN_IDS = process.env.CLERK_ADMIN_USER_IDS?.split(",") || [];
const IT_MANAGER_IDS = process.env.CLERK_IT_MANAGER_USER_IDS?.split(",") || [];

export async function getCurrentUser() {
  const { userId: clerkId, sessionClaims } = auth();
  if (!clerkId) return null;

  const email = sessionClaims?.email as string | undefined;
  const firstName = sessionClaims?.firstName as string | undefined;
  const lastName = sessionClaims?.lastName as string | undefined;
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || email;

  let role: UserRole = UserRole.USER;
  if (ADMIN_IDS.includes(clerkId)) {
    role = UserRole.ADMIN;
  } else if (IT_MANAGER_IDS.includes(clerkId)) {
    role = UserRole.IT_MANAGER;
  }

  let user = await prisma.user.findUnique({
    where: { clerkId },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        clerkId,
        email: email || `user-${clerkId}@local`,
        name: fullName,
        role,
      },
    });
  } else if (user.role !== role || user.email !== email) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        role,
        email: email || user.email,
        name: fullName || user.name,
      },
    });
  }

  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("未登录");
  }
  return user;
}

export async function requirePermission(allowedRoles: UserRole[]) {
  const user = await requireUser();
  if (!allowedRoles.includes(user.role)) {
    throw new Error("权限不足");
  }
  return user;
}

export function isAdmin(role: UserRole) {
  return role === UserRole.ADMIN;
}

export function isITManagerOrAbove(role: UserRole) {
  return role === UserRole.ADMIN || role === UserRole.IT_MANAGER;
}
