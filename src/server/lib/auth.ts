import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { cookies } from 'next/headers';
import { redis } from './redis';
import { prisma } from './prisma';
import type { User } from '@prisma/client';

export const SESSION_COOKIE = 'wmc_session';
export const SESSION_TTL = 60 * 60 * 8; // 8 小时

export interface SessionData {
  sid: string;
  userId: string;
  role: User['role'];
  username: string;
  name: string;
  createdAt: number;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

function sessionKey(sid: string) {
  return `session:${sid}`;
}

export async function createSession(user: User): Promise<string> {
  const sid = nanoid(32);
  const data: SessionData = {
    sid,
    userId: user.id,
    role: user.role,
    username: user.username,
    name: user.name,
    createdAt: Date.now(),
  };
  try {
    await redis.set(sessionKey(sid), JSON.stringify(data), 'EX', SESSION_TTL);
  } catch {
    // Redis 不可用时降级为无状态 cookie (仅开发环境)
  }
  return sid;
}

export async function destroySession(sid: string): Promise<void> {
  try {
    await redis.del(sessionKey(sid));
  } catch {}
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = cookies();
  const sid = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sid) return null;

  try {
    const raw = await redis.get(sessionKey(sid));
    if (!raw) return null;
    const data = JSON.parse(raw) as SessionData;
    // 续期
    await redis.expire(sessionKey(sid), SESSION_TTL);
    return data;
  } catch {
    return null;
  }
}

export function setSessionCookie(sid: string) {
  cookies().set(SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL,
  });
}

export function clearSessionCookie() {
  cookies().delete(SESSION_COOKIE);
}

export async function requireAuth(): Promise<SessionData> {
  const session = await getSession();
  if (!session) {
    throw new Error('UNAUTHORIZED');
  }
  return session;
}

export async function requireRole(
  allowedRoles: Array<User['role']>
): Promise<SessionData> {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.role as User['role'])) {
    throw new Error('FORBIDDEN');
  }
  return session;
}

export async function getUserFromSession(): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;
  return prisma.user.findUnique({ where: { id: session.userId } });
}
