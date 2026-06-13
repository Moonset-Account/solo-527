import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserModel as UM } from "@/server/models/User";
import { getRedis, redisKeys } from "@/server/db/redis";
import { demoStore, demoSessions } from "@/server/db/demoData";
import { isMongoReady } from "@/server/db/mongo";
import type { User, UserRole } from "@/shared/types";

const UserModel: any = UM;

const SESSION_TTL = 7 * 24 * 3600;

function getSecret() {
  return process.env.SESSION_SECRET || "beiqiao-scheduling-dev-secret-key-2026";
}

function toSessionUser(u: any): User {
  return {
    id: u._id?.toString() || u.id,
    username: u.username,
    name: u.name,
    role: u.role as UserRole,
    avatar: u.avatar || "",
  };
}

export async function login(username: string, password: string, ip?: string) {
  let user: any = null;
  if (isMongoReady()) {
    try {
      user = (await UserModel.findOne({ username }).lean()) as any;
    } catch {}
  }
  if (!user) {
    user = demoStore.findOne("users", { username });
  }
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  const sid = jwt.sign({ uid: user._id?.toString() || user.id }, getSecret(), { expiresIn: "7d" });
  const sessionData = toSessionUser(user);
  demoSessions.set(sid, sessionData as any);
  try {
    const redis = getRedis();
    if (redis.status === "ready") {
      await redis.hset(redisKeys.session(sid), sessionData as any);
      await redis.expire(redisKeys.session(sid), SESSION_TTL);
    }
  } catch {}
  return { sid, user: sessionData };
}

export async function getUserBySession(sid?: string): Promise<User | null> {
  if (!sid) return null;
  const demo = demoSessions.get(sid);
  if (demo) return demo as User;
  try {
    const redis = getRedis();
    if (redis.status === "ready") {
      const data = await redis.hgetall(redisKeys.session(sid));
      if (data && data.id) {
        await redis.expire(redisKeys.session(sid), SESSION_TTL);
        return {
          id: data.id,
          username: data.username,
          name: data.name,
          role: data.role as UserRole,
          avatar: data.avatar,
        };
      }
    }
    if (isMongoReady()) {
      const decoded = jwt.verify(sid, getSecret()) as { uid: string };
      const user = (await UserModel.findById(decoded.uid).lean()) as any;
      if (!user) return null;
      return toSessionUser(user);
    }
  } catch {
    return null;
  }
  return null;
}

export async function logout(sid: string) {
  const redis = getRedis();
  if (redis.status === "ready") {
    await redis.del(redisKeys.session(sid));
  }
}

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}

export function hasRole(user: User | null, ...roles: UserRole[]) {
  if (!user) return false;
  return roles.includes(user.role);
}
