import { pool } from "./db.js";
import type { Request } from "express";

interface AuditLogInput {
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(input: AuditLogInput) {
  const { userId, action, resourceType, resourceId, oldValue, newValue, ipAddress, userAgent } = input;
  
  await pool.query(
    `INSERT INTO audit_logs 
     (user_id, action, resource_type, resource_id, old_value, new_value, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [userId, action, resourceType, resourceId, oldValue ? JSON.stringify(oldValue) : null, 
     newValue ? JSON.stringify(newValue) : null, ipAddress, userAgent]
  );
}

export function logAction(req: Request, input: Omit<AuditLogInput, "ipAddress" | "userAgent">) {
  const ipAddress = req.ip || 
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress;
  
  return createAuditLog({
    ...input,
    ipAddress,
    userAgent: req.headers["user-agent"],
  });
}
