import { getDb } from './database'

export function runMigrations(): void {
  const db = getDb()

  db.exec(`
    CREATE TABLE IF NOT EXISTS sensor_readings (
      id TEXT PRIMARY KEY,
      sensor_id TEXT NOT NULL,
      pond_id TEXT NOT NULL,
      metric TEXT NOT NULL,
      value REAL,
      ts TEXT NOT NULL,
      is_anomaly INTEGER DEFAULT 0,
      quality TEXT DEFAULT 'good'
    );

    CREATE INDEX IF NOT EXISTS idx_sr_pond_ts ON sensor_readings (pond_id, ts DESC);
    CREATE INDEX IF NOT EXISTS idx_sr_metric_ts ON sensor_readings (metric, ts DESC);
    CREATE INDEX IF NOT EXISTS idx_sr_anomaly ON sensor_readings (is_anomaly, ts DESC);

    CREATE TABLE IF NOT EXISTS sensor_status (
      sensor_id TEXT PRIMARY KEY,
      pond_id TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT DEFAULT 'online',
      last_heartbeat TEXT,
      last_reading REAL
    );

    CREATE TABLE IF NOT EXISTS thresholds (
      id TEXT PRIMARY KEY,
      metric TEXT NOT NULL,
      pond_id TEXT NOT NULL,
      warning_low REAL,
      warning_high REAL,
      critical_low REAL,
      critical_high REAL,
      UNIQUE(metric, pond_id)
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      severity TEXT NOT NULL,
      metric TEXT NOT NULL,
      pond_id TEXT NOT NULL,
      value REAL,
      threshold_value REAL,
      triggered_at TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      acknowledged_by TEXT,
      acknowledged_at TEXT,
      human_judgment TEXT,
      judgment_note TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts (status, triggered_at DESC);
    CREATE INDEX IF NOT EXISTS idx_alerts_pond ON alerts (pond_id, triggered_at DESC);

    CREATE TABLE IF NOT EXISTS feeding_records (
      id TEXT PRIMARY KEY,
      pond_id TEXT NOT NULL,
      batch_id TEXT NOT NULL,
      amount REAL NOT NULL,
      feed_type TEXT,
      ts TEXT NOT NULL,
      strategy_change INTEGER DEFAULT 0,
      strategy_note TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_fr_pond_ts ON feeding_records (pond_id, ts DESC);

    CREATE TABLE IF NOT EXISTS pond_batches (
      id TEXT PRIMARY KEY,
      pond_id TEXT NOT NULL,
      batch_name TEXT NOT NULL,
      species TEXT,
      start_date TEXT NOT NULL,
      end_date TEXT,
      status TEXT DEFAULT 'active'
    );

    CREATE TABLE IF NOT EXISTS aerator_status (
      id TEXT PRIMARY KEY,
      pond_id TEXT NOT NULL,
      status TEXT DEFAULT 'stopped',
      last_switch_at TEXT,
      auto_mode INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS processing_notes (
      id TEXT PRIMARY KEY,
      alert_id TEXT,
      reading_id TEXT,
      note TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_pn_alert ON processing_notes (alert_id);
    CREATE INDEX IF NOT EXISTS idx_pn_reading ON processing_notes (reading_id);
  `)
}
