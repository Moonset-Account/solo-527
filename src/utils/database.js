const Database = require('better-sqlite3');
const config = require('../config');
const logger = require('../utils/logger');

let dbInstance = null;

function getDb() {
  if (dbInstance) return dbInstance;

  dbInstance = new Database(config.database.sqlitePath);
  dbInstance.pragma('journal_mode = WAL');
  dbInstance.pragma('foreign_keys = ON');

  initSchema(dbInstance);
  return dbInstance;
}

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'supervisor', 'operator')),
      department TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login_at DATETIME,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      ticket_no TEXT UNIQUE NOT NULL,
      caller_name TEXT,
      caller_phone TEXT,
      caller_address TEXT,
      district TEXT,
      block TEXT,
      community TEXT,
      content TEXT NOT NULL,
      original_category TEXT,
      category TEXT,
      category_confidence REAL,
      urgency TEXT,
      urgency_confidence REAL,
      department_code TEXT,
      department_name TEXT,
      department_confidence REAL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'auto_assigned', 'reviewing', 'reassigned', 'closed', 'escalated')),
      is_high_risk INTEGER DEFAULT 0,
      needs_review INTEGER DEFAULT 0,
      review_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      assigned_at DATETIME,
      closed_at DATETIME,
      review_score INTEGER,
      followup_score INTEGER,
      followup_comment TEXT,
      model_version TEXT,
      raw_inference_result TEXT
    );

    CREATE TABLE IF NOT EXISTS historical_tickets (
      id TEXT PRIMARY KEY,
      ticket_no TEXT UNIQUE NOT NULL,
      content TEXT NOT NULL,
      category TEXT,
      urgency TEXT,
      department_code TEXT,
      department_name TEXT,
      district TEXT,
      block TEXT,
      community TEXT,
      resolution TEXT,
      resolution_days REAL,
      followup_score INTEGER,
      is_embedding_built INTEGER DEFAULT 0,
      created_at DATETIME,
      closed_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS ticket_reviews (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
      reviewer_id TEXT REFERENCES users(id),
      review_type TEXT NOT NULL CHECK(review_type IN ('confidence_low', 'high_risk', 'manual', 'model_unanswerable')),
      original_category TEXT,
      corrected_category TEXT,
      original_urgency TEXT,
      corrected_urgency TEXT,
      original_department TEXT,
      corrected_department TEXT,
      review_comment TEXT,
      review_status TEXT DEFAULT 'pending' CHECK(review_status IN ('pending', 'approved', 'rejected', 'modified')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      reviewed_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS inference_logs (
      id TEXT PRIMARY KEY,
      ticket_id TEXT REFERENCES tickets(id),
      model_name TEXT,
      inference_type TEXT,
      input_text TEXT,
      output_json TEXT,
      confidence REAL,
      latency_ms INTEGER,
      tokens_used INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS evaluation_samples (
      id TEXT PRIMARY KEY,
      sample_type TEXT NOT NULL CHECK(sample_type IN ('correct', 'low_confidence', 'manual_correction', 'unanswerable')),
      content TEXT NOT NULL,
      expected_category TEXT,
      expected_urgency TEXT,
      expected_department TEXT,
      expected_high_risk INTEGER DEFAULT 0,
      expected_needs_review INTEGER DEFAULT 0,
      test_result TEXT,
      test_passed INTEGER,
      tested_at DATETIME,
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS role_permissions (
      role TEXT PRIMARY KEY,
      permissions TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
    CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category);
    CREATE INDEX IF NOT EXISTS idx_tickets_urgency ON tickets(urgency);
    CREATE INDEX IF NOT EXISTS idx_tickets_district ON tickets(district);
    CREATE INDEX IF NOT EXISTS idx_tickets_created ON tickets(created_at);
    CREATE INDEX IF NOT EXISTS idx_tickets_review ON tickets(needs_review, review_reason);
    CREATE INDEX IF NOT EXISTS idx_reviews_status ON ticket_reviews(review_status);
    CREATE INDEX IF NOT EXISTS idx_hist_category ON historical_tickets(category);
    CREATE INDEX IF NOT EXISTS idx_hist_embedding ON historical_tickets(is_embedding_built);
  `);

  logger.info('Database schema initialized');
}

function closeDb() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

module.exports = { getDb, closeDb };
