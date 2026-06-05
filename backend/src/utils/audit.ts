import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';

export async function logAudit(
  userId: string | null,
  action: string,
  resourceType: string,
  resourceId: string | null,
  beforeData: any = null,
  afterData: any = null,
  ipAddress: string = '127.0.0.1'
) {
  await db('audit_logs').insert({
    id: uuidv4(),
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    before_data: beforeData ? JSON.stringify(beforeData) : null,
    after_data: afterData ? JSON.stringify(afterData) : null,
    ip_address: ipAddress,
    created_at: new Date().toISOString()
  });
}
