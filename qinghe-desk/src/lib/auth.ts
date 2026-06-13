import { prisma } from "./prisma";

export async function getCurrentOperator(): Promise<{ id: string; name: string; role: string }> {
  try {
    const { auth } = await import("@clerk/nextjs/server");
    const sessionAuth = auth();
    const clerkUserId = sessionAuth.userId;
    if (clerkUserId) {
      const found = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
      if (found) return { id: found.id, name: found.name, role: found.role };
    }
  } catch {
    // Clerk not configured or not available, fall through
  }
  const fallback = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (fallback) return { id: fallback.id, name: fallback.name, role: fallback.role };
  return { id: "clerk_admin_001", name: "系统管理员", role: "ADMIN" };
}
