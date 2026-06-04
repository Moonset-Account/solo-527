import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { UserRole } from "@/lib/types";
import prisma from "./prisma";

export const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key";

export interface JWTPayload {
  userId: number;
  username: string;
  role: UserRole;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  const cookieToken = req.cookies.get("token")?.value;
  if (cookieToken) {
    return cookieToken;
  }

  return null;
}

export type AuthResult =
  | { user: JWTPayload; error: null }
  | { user: null; error: { status: number; message: string } };

export async function authenticateRequest(
  req: NextRequest
): Promise<AuthResult> {
  const token = getTokenFromRequest(req);
  if (!token) {
    return {
      user: null,
      error: { status: 401, message: "未提供认证令牌" },
    };
  }

  const payload = verifyToken(token);
  if (!payload) {
    return {
      user: null,
      error: { status: 401, message: "认证令牌无效或已过期" },
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user) {
    return {
      user: null,
      error: { status: 401, message: "用户不存在" },
    };
  }

  return { user: payload, error: null };
}

export function requireRole(
  user: JWTPayload,
  allowedRoles: UserRole[]
): { allowed: boolean; error?: string } {
  if (!allowedRoles.includes(user.role)) {
    return {
      allowed: false,
      error: "权限不足，需要角色: " + allowedRoles.join(" 或 "),
    };
  }
  return { allowed: true };
}

export function createAuthResponse(
  error: { status: number; message: string }
) {
  return Response.json(
    { success: false, error: error.message },
    { status: error.status }
  );
}
