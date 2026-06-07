import pg from "pg";
import { config } from "../config.js";

const { Pool } = pg;

let pool = null;
let connectionError = null;

try {
  pool = new Pool({
    host: config.db.host,
    port: config.db.port,
    database: config.db.database,
    user: config.db.user,
    password: config.db.password,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on("error", (err) => {
    console.warn("PostgreSQL 连接警告:", err.message);
    connectionError = err;
  });
} catch (err) {
  console.warn("PostgreSQL 池创建失败:", err.message);
  connectionError = err;
}

export async function query(text, params) {
  if (!pool || connectionError) {
    throw new Error("数据库连接不可用");
  }
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (config.env === "development") {
    console.log(`[DB] ${text.split(" ")[0]} 耗时: ${duration}ms`);
  }
  return res;
}

export async function getClient() {
  if (!pool || connectionError) {
    throw new Error("数据库连接不可用");
  }
  return pool.connect();
}

export function isDbAvailable() {
  return pool !== null && connectionError === null;
}

export default pool;
