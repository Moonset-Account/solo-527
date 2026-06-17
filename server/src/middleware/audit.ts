import { Context, Next } from 'hono';
import { db } from '../db';
import { auditLogs } from '../db/schema';
import { JwtPayload } from '../utils/jwt';

const AUDIT_ACTIONS = new Set([
  'product.create',
  'product.update',
  'product.delete',
  'product.status',
  'order.redeem',
  'member.points.adjust',
  'reach.create',
  'reach.execute',
  'reach.retry',
  'admin.create',
  'admin.update',
  'level.create',
  'level.update',
  'level.delete',
]);

function shouldLogAction(action: string): boolean {
  return AUDIT_ACTIONS.has(action) || action.startsWith('admin.');
}

export async function auditLogMiddleware(c: Context, next: Next) {
  await next();

  const auditAction = c.get('auditAction') as string | undefined;
  if (!auditAction || !shouldLogAction(auditAction)) {
    return;
  }

  try {
    const user = c.get('user') as JwtPayload | undefined;
    const auditData = c.get('auditData') as Record<string, unknown> | undefined;
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';

    await db.insert(auditLogs).values({
      userId: user?.type === 'admin' ? user.id : undefined,
      action: auditAction,
      resourceType: auditData?.resourceType as string | undefined,
      resourceId: auditData?.resourceId as string | undefined,
      details: auditData?.details as Record<string, unknown> | undefined,
      ipAddress: ip,
    });
  } catch (e) {
    console.error('Failed to write audit log:', e);
  }
}

export function setAuditAction(c: Context, action: string, data?: Record<string, unknown>) {
  c.set('auditAction', action);
  if (data) {
    c.set('auditData', data);
  }
}
