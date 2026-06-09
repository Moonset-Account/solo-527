/**
 * 回滚模块 - 支持实体级别的快照和回滚
 */
const { getDb } = require('../db');
const audit = require('../audit');
const { uuid, now, parseJsonSafe, stringifyIfNeeded } = require('../utils/common');
const logger = require('../utils/logger');

const SNAPSHOT_TABLES = {
  meeting: 'meetings',
  action_item: 'action_items',
  speaker: 'speakers',
  topic: 'topics',
  review_task: 'review_tasks',
};

function snapshot(entityType, entityId, reason = null, operatorId = null) {
  const db = getDb();
  const table = SNAPSHOT_TABLES[entityType];
  if (!table) throw new Error(`Unknown entity type: ${entityType}`);

  const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(entityId);
  if (!row) throw new Error(`${entityType} ${entityId} not found for snapshot`);

  const stmt = db.prepare(`
    INSERT INTO rollback_records (id, entity_type, entity_id, snapshot_value, reason, rollback_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const id = uuid();
  stmt.run(id, entityType, entityId, stringifyIfNeeded(row), reason, operatorId, now());
  return id;
}

function rollback(snapshotId, operatorId = null, operatorName = 'system') {
  const db = getDb();
  const record = db.prepare('SELECT * FROM rollback_records WHERE id = ?').get(snapshotId);
  if (!record) throw new Error(`Snapshot ${snapshotId} not found`);

  const table = SNAPSHOT_TABLES[record.entity_type];
  const snapshot = parseJsonSafe(record.snapshot_value);
  if (!snapshot || !table) throw new Error(`Invalid snapshot data`);

  const tx = db.transaction(() => {
    const existing = db.prepare(`SELECT id FROM ${table} WHERE id = ?`).get(record.entity_id);
    if (existing) {
      const keys = Object.keys(snapshot).filter(k => k !== 'id');
      const sets = keys.map(k => `${k} = ?`).join(', ');
      const values = keys.map(k => snapshot[k]);
      values.push(record.entity_id);
      db.prepare(`UPDATE ${table} SET ${sets} WHERE id = ?`).run(...values);
    } else {
      const keys = Object.keys(snapshot);
      const placeholders = keys.map(() => '?').join(', ');
      db.prepare(`INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`).run(
        ...keys.map(k => snapshot[k])
      );
    }

    audit.log(record.entity_type, record.entity_id, audit.ACTIONS.ROLLBACK, {
      oldValue: { snapshotId },
      newValue: snapshot,
      operatorId,
      operatorName,
    });
  });

  tx();
  logger.info(`[rollback] Rolled back ${record.entity_type} ${record.entity_id} via snapshot ${snapshotId}`);
  return snapshot;
}

function listRollbacks(entityType = null, entityId = null, limit = 50) {
  const db = getDb();
  let sql = 'SELECT * FROM rollback_records WHERE 1=1';
  const params = [];
  if (entityType) { sql += ' AND entity_type = ?'; params.push(entityType); }
  if (entityId) { sql += ' AND entity_id = ?'; params.push(entityId); }
  sql += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit);
  return db.prepare(sql).all(...params);
}

module.exports = { snapshot, rollback, listRollbacks };
