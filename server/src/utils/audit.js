import AuditLog from '../models/AuditLog.js';

export const createAuditLog = async ({
  entityType,
  entityId,
  entityTitle,
  action,
  changes = [],
  operatorId,
  operatorName,
  operatorRole,
  ip,
  userAgent,
  remark,
}) => {
  try {
    const auditLog = new AuditLog({
      entityType,
      entityId,
      entityTitle,
      action,
      changes,
      operatorId,
      operatorName,
      operatorRole,
      ip,
      userAgent,
      remark,
    });
    await auditLog.save();
    return auditLog;
  } catch (error) {
    console.error('创建审计日志失败:', error);
  }
};

export const compareAndGetChanges = (oldDoc, newDoc, fields = []) => {
  const changes = [];
  const fieldsToCheck = fields.length > 0
    ? fields
    : Object.keys(newDoc.toObject ? newDoc.toObject() : newDoc);

  for (const field of fieldsToCheck) {
    const oldVal = oldDoc ? oldDoc[field] : undefined;
    const newVal = newDoc[field];

    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes.push({
        field,
        oldValue: oldVal,
        newValue: newVal,
      });
    }
  }

  return changes;
};

export default { createAuditLog, compareAndGetChanges };
