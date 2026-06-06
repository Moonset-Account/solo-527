import { jwtVerify, SignJWT } from "jose";
import { prisma } from "./prisma";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "hospital-wait-time-analysis-secret-key"
);

export interface AuthUser {
  id: string;
  username: string;
  roleId: string;
  departmentScopes: string[];
  permissions: string[];
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function generateToken(user: {
  id: string;
  username: string;
  roleId: string;
}): Promise<string> {
  return new SignJWT({
    sub: user.id,
    username: user.username,
    roleId: user.roleId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.sub as string;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
      },
    });

    if (!user) return null;

    return {
      id: user.id,
      username: user.username,
      roleId: user.roleId,
      departmentScopes: user.departmentScopes,
      permissions: (user.role.permissions as string[]) || [],
    };
  } catch {
    return null;
  }
}

export async function getAuthUser(
  request: NextRequest
): Promise<AuthUser | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.substring(7);
  return verifyToken(token);
}

export function hasPermission(
  user: AuthUser | null,
  permission: string
): boolean {
  if (!user) return false;
  if (user.permissions.includes("*")) return true;
  return user.permissions.includes(permission);
}

export function hasDepartmentAccess(
  user: AuthUser | null,
  deptId: string
): boolean {
  if (!user) return false;
  if (user.departmentScopes.length === 0) return true;
  return user.departmentScopes.includes(deptId);
}

export function createAuthErrorResponse(message = "未授权访问") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function createPermissionErrorResponse(message = "权限不足") {
  return NextResponse.json({ error: message }, { status: 403 });
}
