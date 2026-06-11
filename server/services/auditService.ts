import { AuditLogModel as ALM } from "@/server/models/AuditLog";
import { getRedis, redisKeys } from "@/server/db/redis";
import type { AuditAction, AuditLog as AuditLogType, AuditTargetType, User } from "@/shared/types";
import { formatDateTime } from "@/shared/utils";

const AuditLogModel: any = ALM;

let flushTimer: NodeJS.Timeout | null = null;

export async function writeAudit(
  user: Pick<User, "id" | "name">,
  action: AuditAction,
  targetType: AuditTargetType,
  targetId: string,
  detail: Record<string, any> = {},
  ip?: string
) {
  const log: Omit<AuditLogType, "id"> = {
    userId: user.id,
    userName: user.name,
    action,
    targetType,
    targetId,
    detail,
    ip,
    createdAt: formatDateTime(new Date()),
  };
  const redis = getRedis();
  try {
    if (redis.status === "ready") {
      await redis.rpush(redisKeys.auditBuffer, JSON.stringify(log));
      scheduleFlush();
    } else {
      await AuditLogModel.create(log);
    }
  } catch {
    await AuditLogModel.create(log);
  }
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(async () => {
    flushTimer = null;
    await flushAuditBuffer();
  }, 5000);
}

export async function flushAuditBuffer() {
  const redis = getRedis();
  if (redis.status !== "ready") return;
  const batch: string[] = [];
  let item: string | null;
  while ((item = await redis.lpop(redisKeys.auditBuffer))) {
    batch.push(item);
  }
  if (batch.length === 0) return;
  try {
    const docs = batch.map((s) => JSON.parse(s));
    await AuditLogModel.insertMany(docs, { ordered: false });
  } catch (e) {
    console.error("[Audit] Flush failed:", (e as Error).message);
  }
}

export async function queryAuditLogsByTarget(targetType: AuditTargetType, targetId: string, limit = 10) {
  const logs = await AuditLogModel.find({ targetType, targetId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return logs.map((l) => ({ ...l, id: l._id.toString() })) as AuditLogType[];
}

export async function queryAuditLogsByUser(userId: string, limit = 20) {
  const logs = await AuditLogModel.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return logs.map((l) => ({ ...l, id: l._id.toString() })) as AuditLogType[];
}
