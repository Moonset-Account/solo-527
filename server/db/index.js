/**
 * SQLite 数据库模块 - 使用 sql.js (纯JS实现，无需编译)
 * 包装为与 better-sqlite3 兼容的接口：prepare / get / all / run / exec / transaction / close
 */
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const logger = require('../utils/logger');

let db;
let SQL;
let dbPath;
let saveTimer = null;

async function initDb() {
  if (db) return db;

  const dbDir = path.dirname(config.db.path);
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

  SQL = await initSqlJs();
  dbPath = config.db.path;

  let buffer = null;
  try {
    if (fs.existsSync(dbPath)) {
      buffer = fs.readFileSync(dbPath);
      logger.info(`[db] Loading existing database from ${dbPath}`);
    }
  } catch (e) {
    logger.warn(`[db] Could not read db file: ${e.message}`);
  }

  db = new SQL.Database(buffer);
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA journal_mode = MEMORY');

  _createTables();
  _startAutoSave();

  logger.info(`[db] Database initialized at ${dbPath} (sql.js, in-memory + periodic flush)`);
  return { prepare, exec, pragma, transaction, close: closeDb };
}

function _startAutoSave() {
  if (saveTimer) return;
  saveTimer = setInterval(_flushToDisk, 2000);
}

function _flushToDisk() {
  if (!db) return;
  try {
    const data = db.export();
    const buf = Buffer.from(data);
    if (!fs.existsSync(path.dirname(dbPath))) fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    fs.writeFileSync(dbPath, buf);
  } catch (e) {
    logger.warn(`[db] Flush failed: ${e.message}`);
  }
}

function _rowToObject(row, columns) {
  const obj = {};
  for (let i = 0; i < columns.length; i++) obj[columns[i]] = row[i];
  return obj;
}

/**
 * 包装 Statement，提供 run / get / all 接口 (与 better-sqlite3 对齐)
 * 注意：Statement 对象可以重复 run/get/all，支持在循环中批量插入
 * 调用完后手动调用 .free() 或 GC 时会自动释放
 */
function prepare(sql) {
  let stmt = null;
  try { stmt = db.prepare(sql); } catch (e) {
    logger.error(`[db] prepare error: ${e.message} sql=${sql.slice(0, 200)}`);
    throw e;
  }
  function normalizeParams(params) {
    if (params.length === 0) return [];
    if (params.length === 1) {
      const p = params[0];
      if (Array.isArray(p)) return p;
      if (p && typeof p === 'object') return p; // named params object
      return params;
    }
    return params;
  }
  return {
    run(...params) {
      try {
        const flat = normalizeParams(params);
        if (Array.isArray(flat)) stmt.bind(flat);
        else stmt.bindAsObject(flat);
      } catch (e) {
        logger.error(`[db] bind error: ${e.message} sql=${sql.slice(0, 100)} params=${JSON.stringify(params).slice(0, 200)}`);
        throw e;
      }
      let changes = 0, lastInsertRowid = null;
      try {
        // sql.js step() 每次推进一步，INSERT/UPDATE 会修改数据库
        while (stmt.step()) {
          try {
            const info = db.exec('SELECT last_insert_rowid() AS id, changes() AS ch');
            if (info && info[0] && info[0].values && info[0].values[0]) {
              lastInsertRowid = info[0].values[0][0];
              changes = info[0].values[0][1];
            }
          } catch {}
          break;
        }
      } catch (e) {
        // 非 SELECT 语句在 step() 后就已经执行完毕，无需再处理
      }
      stmt.reset();
      return { changes: changes || 0, lastInsertRowid };
    },

    get(...params) {
      try {
        const flat = normalizeParams(params);
        if (Array.isArray(flat)) stmt.bind(flat);
        else stmt.bindAsObject(flat);
      } catch (e) {
        logger.error(`[db] bind error (get): ${e.message}`);
        throw e;
      }
      try {
        if (stmt.step()) {
          const row = stmt.getAsObject();
          stmt.reset();
          return row;
        }
      } catch {}
      stmt.reset();
      return undefined;
    },

    all(...params) {
      try {
        const flat = normalizeParams(params);
        if (Array.isArray(flat)) stmt.bind(flat);
        else stmt.bindAsObject(flat);
      } catch (e) {
        logger.error(`[db] bind error (all): ${e.message}`);
        throw e;
      }
      const results = [];
      try {
        while (stmt.step()) {
          results.push(stmt.getAsObject());
        }
      } catch {}
      stmt.reset();
      return results;
    },

    free() { try { stmt.free(); stmt = null; } catch {} },
  };
}

function exec(sqlText) {
  try {
    db.exec(sqlText);
  } catch (e) {
    logger.error(`[db] exec error: ${e.message}, sql: ${sqlText.slice(0, 200)}`);
    throw e;
  }
  return true;
}

function pragma() {
  return null;
}

function transaction(fn) {
  return function txWrapper(...args) {
    let result;
    exec('BEGIN');
    try {
      result = fn.apply(this, args);
      exec('COMMIT');
      return result;
    } catch (err) {
      try { exec('ROLLBACK'); } catch {}
      throw err;
    }
  };
}

function _createTables() {
  const tablesSql = `
    CREATE TABLE IF NOT EXISTS meetings (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, project_name TEXT,
      meeting_date TEXT NOT NULL, duration INTEGER, location TEXT,
      transcript TEXT, raw_source TEXT, status TEXT NOT NULL DEFAULT 'imported',
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL, metadata TEXT
    );
    CREATE TABLE IF NOT EXISTS speakers (
      id TEXT PRIMARY KEY, meeting_id TEXT NOT NULL, speaker_name TEXT NOT NULL,
      speaker_role TEXT, raw_alias TEXT, confirmed INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS transcript_segments (
      id TEXT PRIMARY KEY, meeting_id TEXT NOT NULL, speaker_id TEXT,
      segment_index INTEGER NOT NULL, start_time REAL, end_time REAL,
      content TEXT NOT NULL, topic_tag TEXT, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS action_items (
      id TEXT PRIMARY KEY, meeting_id TEXT NOT NULL, segment_id TEXT,
      title TEXT NOT NULL, description TEXT, assignee TEXT,
      assignee_confidence REAL, assignee_pending INTEGER DEFAULT 0, assignee_note TEXT,
      deadline TEXT, deadline_confidence REAL, deadline_pending INTEGER DEFAULT 0, deadline_note TEXT,
      priority TEXT DEFAULT 'medium', status TEXT NOT NULL DEFAULT 'extracted',
      is_milestone INTEGER DEFAULT 0, milestone_confidence REAL, milestone_note TEXT,
      project_name TEXT, parent_action_id TEXT, extracted_model TEXT,
      extraction_confidence REAL, needs_review INTEGER DEFAULT 1, review_reason TEXT,
      reviewed_by TEXT, reviewed_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS topics (
      id TEXT PRIMARY KEY, meeting_id TEXT NOT NULL, title TEXT NOT NULL,
      description TEXT, start_segment_index INTEGER, end_segment_index INTEGER, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS review_tasks (
      id TEXT PRIMARY KEY, action_item_id TEXT NOT NULL, reviewer_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending', field_type TEXT NOT NULL,
      current_value TEXT, suggested_value TEXT, confidence REAL,
      review_note TEXT, completed_at TEXT, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL,
      action TEXT NOT NULL, old_value TEXT, new_value TEXT,
      operator_id TEXT, operator_name TEXT, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS registered_models (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, version TEXT NOT NULL,
      provider TEXT NOT NULL, description TEXT, is_active INTEGER DEFAULT 0,
      metrics_summary TEXT, registered_at TEXT NOT NULL, promoted_at TEXT
    );
    CREATE TABLE IF NOT EXISTS training_tasks (
      id TEXT PRIMARY KEY, model_name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'queued',
      dataset_id TEXT, hyperparams TEXT, progress INTEGER DEFAULT 0,
      started_at TEXT, completed_at TEXT, created_at TEXT NOT NULL, error_message TEXT
    );
    CREATE TABLE IF NOT EXISTS datasets (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL,
      sample_count INTEGER DEFAULT 0, description TEXT, version TEXT, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS validation_runs (
      id TEXT PRIMARY KEY, model_id TEXT NOT NULL, dataset_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending', metrics TEXT,
      started_at TEXT, completed_at TEXT, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS rollback_records (
      id TEXT PRIMARY KEY, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL,
      snapshot_value TEXT NOT NULL, reason TEXT, rollback_by TEXT, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS task_sync_logs (
      id TEXT PRIMARY KEY, action_item_id TEXT NOT NULL, target_system TEXT NOT NULL,
      status TEXT NOT NULL, external_id TEXT, payload TEXT, response TEXT, sync_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
    CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(meeting_date);
    CREATE INDEX IF NOT EXISTS idx_speakers_meeting ON speakers(meeting_id);
    CREATE INDEX IF NOT EXISTS idx_segments_meeting ON transcript_segments(meeting_id);
    CREATE INDEX IF NOT EXISTS idx_actions_meeting ON action_items(meeting_id);
    CREATE INDEX IF NOT EXISTS idx_actions_status ON action_items(status);
    CREATE INDEX IF NOT EXISTS idx_actions_assignee ON action_items(assignee);
    CREATE INDEX IF NOT EXISTS idx_actions_review ON action_items(needs_review);
    CREATE INDEX IF NOT EXISTS idx_review_status ON review_tasks(status);
    CREATE INDEX IF NOT EXISTS idx_sync_status ON task_sync_logs(status);
  `;
  exec(tablesSql);
  // NOTE: sql.js 的 TEXT UNIQUE 约束写法不同，单独处理 registered_models (name + version 组合即可)
}

function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return { prepare, exec, pragma, transaction, close: closeDb };
}

function closeDb() {
  if (db) {
    _flushToDisk();
    if (saveTimer) { clearInterval(saveTimer); saveTimer = null; }
    try { db.close(); } catch {}
    db = null;
    initPromise = null; // 重置缓存，下次 initDb() 可重新初始化
    logger.info('[db] Database closed & flushed to disk');
  }
}

// sql.js 异步初始化需要单独处理
let initPromise = null;
function ensureInit() {
  if (!initPromise) initPromise = initDb();
  return initPromise;
}

module.exports = {
  initDb: ensureInit,
  getDb: function() {
    if (!db) {
      throw new Error('Database not initialized. Call await initDb() first.');
    }
    return { prepare, exec, pragma, transaction, close: closeDb };
  },
  closeDb,
  _rawDb: () => db,
};
