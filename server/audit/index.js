/**
 * 审计日志模块 - 记录所有重要变更
 */
const { getDb } = require('../db');
const { uuid, now, stringifyIfNeeded } = require('../utils/common');

const ENTITY_TYPES = {
  MEETING: 'meeting',
  ACTION_ITEM: 'action_item',
  SPEAKER: 'speaker',
  TOPIC: 'topic',
  REVIEW_TASK: 'review_task',
  MODEL: 'registered_model',
  TRAINING_TASK: 'training_task',
  DATASET: 'dataset',
};

const ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  ROLLBACK: 'rollback',
  CONFIRM: 'confirm',
  SYNC: 'sync',
  EXTRACT: 'extract',
  REVIEW: 'review',
  PROMOTE: 'promote',
};

function log(entityType, entityId, action, opts) {
  const safeOpts = opts || {};
  const { oldValue = null, newValue = null, operatorId = null, operatorName = 'system' } = safeOpts;
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO audit_logs (id, entity_type, entity_id, action, old_value, new_value, operator_id, operator_name, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    uuid(),
    entityType,
    entityId,
    action,
    stringifyIfNeeded(oldValue),
    stringifyIfNeeded(newValue),
    operatorId,
    operatorName,
    now()
  );
}

function query(entityType = null, entityId = null, limit = 100, offset = 0) {
  const db = getDb();
  let sql = 'SELECT * FROM audit_logs WHERE 1=1';
  const params = [];
  if (entityType) { sql += ' AND entity_type = ?'; params.push(entityType); }
  if (entityId) { sql += ' AND entity_id = ?'; params.push(entityId); }
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  return db.prepare(sql).all(...params);
}

module.exports = { ENTITY_TYPES, ACTIONS, log, query };
