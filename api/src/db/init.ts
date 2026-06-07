import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'coldchain.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const initTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY,
      plate_number TEXT NOT NULL UNIQUE,
      driver_name TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('running', 'idle', 'maintenance'))
    );

    CREATE TABLE IF NOT EXISTS routes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      origin TEXT NOT NULL,
      destination TEXT NOT NULL,
      distance_km REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      contact TEXT
    );

    CREATE TABLE IF NOT EXISTS delivery_batches (
      id TEXT PRIMARY KEY,
      vehicle_id TEXT NOT NULL,
      route_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      start_time DATETIME NOT NULL,
      estimated_arrival DATETIME NOT NULL,
      actual_arrival DATETIME,
      status TEXT NOT NULL CHECK (status IN ('pending', 'in_transit', 'delivered', 'exception')),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
      FOREIGN KEY (route_id) REFERENCES routes(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS temperature_probes (
      id TEXT PRIMARY KEY,
      vehicle_id TEXT NOT NULL,
      box_id TEXT NOT NULL,
      last_calibration_date DATE NOT NULL,
      next_calibration_date DATE NOT NULL,
      calibration_status TEXT NOT NULL CHECK (calibration_status IN ('valid', 'expiring', 'expired')),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    );

    CREATE TABLE IF NOT EXISTS temperature_records (
      id TEXT PRIMARY KEY,
      vehicle_id TEXT NOT NULL,
      batch_id TEXT NOT NULL,
      probe_id TEXT NOT NULL,
      timestamp DATETIME NOT NULL,
      temperature REAL NOT NULL,
      is_normal BOOLEAN NOT NULL DEFAULT 1,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
      FOREIGN KEY (batch_id) REFERENCES delivery_batches(id),
      FOREIGN KEY (probe_id) REFERENCES temperature_probes(id)
    );
    CREATE INDEX IF NOT EXISTS idx_temp_vehicle_time ON temperature_records(vehicle_id, timestamp);
    CREATE INDEX IF NOT EXISTS idx_temp_batch ON temperature_records(batch_id);

    CREATE TABLE IF NOT EXISTS position_records (
      id TEXT PRIMARY KEY,
      vehicle_id TEXT NOT NULL,
      timestamp DATETIME NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      speed REAL NOT NULL,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    );
    CREATE INDEX IF NOT EXISTS idx_pos_vehicle_time ON position_records(vehicle_id, timestamp);

    CREATE TABLE IF NOT EXISTS door_records (
      id TEXT PRIMARY KEY,
      vehicle_id TEXT NOT NULL,
      batch_id TEXT,
      open_time DATETIME NOT NULL,
      close_time DATETIME,
      duration_seconds INTEGER,
      operator TEXT,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
      FOREIGN KEY (batch_id) REFERENCES delivery_batches(id)
    );

    CREATE TABLE IF NOT EXISTS anomaly_events (
      id TEXT PRIMARY KEY,
      batch_id TEXT NOT NULL,
      vehicle_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('temp_high', 'temp_low', 'door_open', 'delay')),
      start_time DATETIME NOT NULL,
      end_time DATETIME,
      duration_seconds INTEGER,
      severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
      responsible TEXT,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'resolved')),
      FOREIGN KEY (batch_id) REFERENCES delivery_batches(id),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    );

    CREATE TABLE IF NOT EXISTS saved_filters (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      filters_json TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS data_quality_logs (
      id TEXT PRIMARY KEY,
      data_date DATE NOT NULL UNIQUE,
      update_time DATETIME NOT NULL,
      completeness REAL NOT NULL,
      missing_fields_json TEXT,
      anomaly_points INTEGER NOT NULL DEFAULT 0,
      is_update_failed BOOLEAN NOT NULL DEFAULT 0,
      error_message TEXT
    );
  `);
};

initTables();

export default db;
