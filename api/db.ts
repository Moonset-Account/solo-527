import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DB_PATH = path.join(__dirname, 'library.db')

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
  }
  return db
}

export function closeDb(): void {
  if (db) {
    db.close()
    db = null
  }
}

export function initSchema(): void {
  const database = getDb()

  database.exec(`
    CREATE TABLE IF NOT EXISTS branch (
      branch_id TEXT PRIMARY KEY,
      branch_name TEXT NOT NULL,
      district TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS book (
      book_id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      collection_type TEXT NOT NULL,
      theme_category TEXT NOT NULL,
      sub_theme TEXT,
      branch_id TEXT NOT NULL REFERENCES branch(branch_id),
      total_copies INTEGER NOT NULL DEFAULT 1,
      available_copies INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS reader (
      reader_id TEXT PRIMARY KEY,
      age_group TEXT NOT NULL CHECK (age_group IN ('child', 'youth', 'middle', 'senior')),
      branch_id TEXT NOT NULL REFERENCES branch(branch_id),
      is_child BOOLEAN NOT NULL DEFAULT 0,
      register_date DATE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS borrow_record (
      record_id TEXT PRIMARY KEY,
      book_id TEXT NOT NULL REFERENCES book(book_id),
      reader_id TEXT NOT NULL REFERENCES reader(reader_id),
      branch_id TEXT NOT NULL REFERENCES branch(branch_id),
      borrow_date DATE NOT NULL,
      due_date DATE NOT NULL,
      return_date DATE,
      is_renewed BOOLEAN NOT NULL DEFAULT 0,
      is_overdue BOOLEAN NOT NULL DEFAULT 0,
      overdue_days INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS reservation (
      reservation_id TEXT PRIMARY KEY,
      book_id TEXT NOT NULL REFERENCES book(book_id),
      reader_id TEXT NOT NULL REFERENCES reader(reader_id),
      branch_id TEXT NOT NULL REFERENCES branch(branch_id),
      reserve_date DATE NOT NULL,
      fulfill_date DATE,
      queue_position INTEGER NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('waiting', 'fulfilled', 'cancelled'))
    );

    CREATE TABLE IF NOT EXISTS activity (
      activity_id TEXT PRIMARY KEY,
      branch_id TEXT NOT NULL REFERENCES branch(branch_id),
      activity_type TEXT NOT NULL,
      activity_date DATE NOT NULL,
      participant_count INTEGER NOT NULL DEFAULT 0,
      child_participant_count INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS weekly_report (
      report_id TEXT PRIMARY KEY,
      week_start DATE NOT NULL,
      week_end DATE NOT NULL,
      key_changes TEXT NOT NULL,
      yoy_comparison TEXT NOT NULL,
      mom_comparison TEXT NOT NULL,
      anomalies TEXT NOT NULL,
      filter_snapshot TEXT NOT NULL,
      generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS update_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      table_name TEXT NOT NULL,
      record_count INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_borrow_date ON borrow_record(borrow_date);
    CREATE INDEX IF NOT EXISTS idx_borrow_branch ON borrow_record(branch_id);
    CREATE INDEX IF NOT EXISTS idx_borrow_reader ON borrow_record(reader_id);
    CREATE INDEX IF NOT EXISTS idx_reservation_status ON reservation(status);
    CREATE INDEX IF NOT EXISTS idx_reader_age ON reader(age_group);
    CREATE INDEX IF NOT EXISTS idx_book_theme ON book(theme_category);
  `)
}
