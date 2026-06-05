import AuditLog from '@/models/AuditLog';
import dbConnect from '@/lib/db';

export async function createAuditLog(
  module: 'team' | 'schedule' | 'referee' | 'score' | 'appeal' | 'venue' | 'user',
  action: string,
  operatorId: string,
  targetId?: string,
  detail?: Record<string, unknown>
) {
  await dbConnect();
  return AuditLog.create({
    operatorId,
    module,
    action,
    targetId,
    detail,
  });
}
