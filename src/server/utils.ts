import crypto from "crypto";
import { getDB } from "./db";

export function generateId(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function generateQRCode(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function validatePlateNumber(plate: string): boolean {
  const pattern = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-HJ-NP-Z0-9]{4,5}[A-HJ-NP-Z0-9挂学警港澳]$/;
  return pattern.test(plate.toUpperCase());
}

export function checkBlacklist(plateNumber: string): { blocked: boolean; reason?: string } {
  const db = getDB();
  const result = db
    .prepare(
      "SELECT * FROM blacklist WHERE plate_number = ? AND is_active = 1 AND (expires_at IS NULL OR expires_at > ?)"
    )
    .get(plateNumber.toUpperCase(), Date.now()) as any;

  if (result) {
    return { blocked: true, reason: result.reason };
  }
  return { blocked: false };
}

export function writeAuditLog(
  action: string,
  entityType: string,
  entityId: string,
  operator: string,
  operatorRole: string,
  oldValue?: any,
  newValue?: any,
  remark?: string
) {
  const db = getDB();
  const id = generateId();
  const now = Date.now();

  db.prepare(
    `INSERT INTO audit_logs (id, action, entity_type, entity_id, operator, operator_role, old_value, new_value, remark, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    action,
    entityType,
    entityId,
    operator,
    operatorRole,
    oldValue ? JSON.stringify(oldValue) : null,
    newValue ? JSON.stringify(newValue) : null,
    remark || null,
    now
  );
}

export function createNotification(
  type: string,
  message: string,
  visitorId?: string,
  recordId?: string
) {
  const db = getDB();
  const id = generateId();
  const now = Date.now();

  db.prepare(
    `INSERT INTO notifications (id, type, visitor_id, record_id, message, is_read, created_at)
     VALUES (?, ?, ?, ?, ?, 0, ?)`
  ).run(id, type, visitorId || null, recordId || null, message, now);
}

export function checkTimeoutVehicles() {
  const db = getDB();
  const now = Date.now();

  const timeoutRecords = db
    .prepare(
      `SELECT pr.*, v.name, v.phone, v.building, v.host_name, v.end_time
       FROM parking_records pr
       JOIN visitors v ON pr.visitor_id = v.id
       WHERE pr.status = 'parked'
       AND v.end_time < ?
       AND pr.exit_time IS NULL`
    )
    .all(now) as any[];

  for (const record of timeoutRecords) {
    const existingNotification = db
      .prepare(
        "SELECT * FROM notifications WHERE type = 'timeout' AND record_id = ? AND is_read = 0"
      )
      .get(record.id);

    if (!existingNotification) {
      createNotification(
        "timeout",
        `车辆 ${record.plate_number} 已超时，允许停放至 ${new Date(record.end_time).toLocaleString()}，接待人：${record.host_name}`,
        record.visitor_id,
        record.id
      );

      db.prepare("UPDATE parking_records SET status = 'timeout' WHERE id = ?").run(record.id);
    }
  }

  return timeoutRecords;
}
