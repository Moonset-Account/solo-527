import { db } from '../db';
import { operationLogs } from '../db/schema';

export async function logOperation(
  userId: number | null,
  action: string,
  module: string,
  targetId: number | null = null,
  details: Record<string, unknown> | null = null,
  ip: string | null = null
) {
  await db.insert(operationLogs).values({
    userId,
    action,
    module,
    targetId,
    details: details as any,
    ip: ip || null,
  });
}
