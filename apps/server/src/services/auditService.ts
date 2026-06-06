import { query } from '../db';

interface AuditLogParams {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
}

export const createAuditLog = async (params: AuditLogParams) => {
  const { userId, action, entityType, entityId, oldValue, newValue, ipAddress, userAgent } = params;
  
  await query(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_value, new_value, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [userId, action, entityType, entityId, oldValue ? JSON.stringify(oldValue) : null, newValue ? JSON.stringify(newValue) : null, ipAddress, userAgent]
  );
};

export const getAuditLogs = async (entityType?: string, entityId?: string, limit = 100, offset = 0) => {
  let queryText = `
    SELECT al.*, u.username, u.real_name
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
  `;
  const params: any[] = [];
  
  if (entityType) {
    params.push(entityType);
    queryText += ` WHERE al.entity_type = $${params.length}`;
  }
  
  if (entityId) {
    params.push(entityId);
    queryText += params.length === 1 ? ' WHERE' : ' AND';
    queryText += ` al.entity_id = $${params.length}`;
  }
  
  queryText += ` ORDER BY al.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);
  
  const result = await query(queryText, params);
  return result.rows;
};
