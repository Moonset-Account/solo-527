import duckdb from 'duckdb';
import path from 'path';
import { fileURLToPath } from 'url';

const { Database } = duckdb;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'testdrive.duckdb');

let dbInstance: InstanceType<typeof Database> | null = null;

export function getDb(): Promise<InstanceType<typeof Database>> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }
    const db = new Database(DB_PATH, (err) => {
      if (err) reject(err);
      else {
        dbInstance = db;
        resolve(db);
      }
    });
  });
}

export function runQuery(db: InstanceType<typeof Database>, sql: string, params?: unknown[]): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    if (params && params.length > 0) {
      db.all(sql, ...params, (err: Error | null, rows: unknown[]) => {
        if (err) reject(err);
        else resolve(rows as unknown[]);
      });
    } else {
      db.all(sql, (err: Error | null, rows: unknown[]) => {
        if (err) reject(err);
        else resolve(rows as unknown[]);
      });
    }
  });
}

export function runExec(db: InstanceType<typeof Database>, sql: string): Promise<void> {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err: Error | null) => {
      if (err) reject(err);
      else resolve();
    });
  });
}
