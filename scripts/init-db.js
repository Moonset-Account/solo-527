import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "parking.db");
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

console.log("初始化数据库...");

db.exec(`
  CREATE TABLE IF NOT EXISTS visitors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    plate_number TEXT NOT NULL,
    building TEXT NOT NULL,
    host_name TEXT NOT NULL,
    host_phone TEXT NOT NULL,
    start_time INTEGER NOT NULL,
    end_time INTEGER NOT NULL,
    meeting_id TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    qr_code TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS parking_records (
    id TEXT PRIMARY KEY,
    visitor_id TEXT NOT NULL,
    plate_number TEXT NOT NULL,
    entry_time INTEGER,
    exit_time INTEGER,
    entry_guard TEXT,
    exit_guard TEXT,
    entry_remark TEXT,
    exit_remark TEXT,
    is_manual_entry INTEGER DEFAULT 0,
    is_manual_exit INTEGER DEFAULT 0,
    is_offline_entry INTEGER DEFAULT 0,
    is_offline_exit INTEGER DEFAULT 0,
    synced INTEGER DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'pending',
    FOREIGN KEY (visitor_id) REFERENCES visitors(id)
  );

  CREATE TABLE IF NOT EXISTS blacklist (
    id TEXT PRIMARY KEY,
    plate_number TEXT NOT NULL UNIQUE,
    reason TEXT NOT NULL,
    added_by TEXT NOT NULL,
    added_at INTEGER NOT NULL,
    expires_at INTEGER,
    is_active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    operator TEXT NOT NULL,
    operator_role TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    remark TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    visitor_id TEXT,
    record_id TEXT,
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS guards (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    booth_number TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_visitors_plate ON visitors(plate_number);
  CREATE INDEX IF NOT EXISTS idx_visitors_qr ON visitors(qr_code);
  CREATE INDEX IF NOT EXISTS idx_visitors_status ON visitors(status);
  CREATE INDEX IF NOT EXISTS idx_records_visitor ON parking_records(visitor_id);
  CREATE INDEX IF NOT EXISTS idx_records_status ON parking_records(status);
  CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
  CREATE INDEX IF NOT EXISTS idx_audit_operator ON audit_logs(operator);
  CREATE INDEX IF NOT EXISTS idx_blacklist_plate ON blacklist(plate_number);
`);

const guardCount = db.prepare("SELECT COUNT(*) as count FROM guards").get();
if (guardCount.count === 0) {
  const now = Date.now();
  console.log("初始化默认保安账号...");
  
  db.prepare(`
    INSERT INTO guards (id, name, username, password_hash, booth_number, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    "guard-001",
    "张三",
    "guard1",
    "hash_placeholder_123",
    "1号岗亭",
    now
  );
  
  db.prepare(`
    INSERT INTO guards (id, name, username, password_hash, booth_number, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    "guard-002",
    "李四",
    "guard2",
    "hash_placeholder_456",
    "2号岗亭",
    now
  );
}

console.log("✅ 数据库初始化完成！");
console.log("📁 数据库文件路径:", dbPath);
db.close();
