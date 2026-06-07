import pg from "pg";
import { config } from "./config.js";

const { Pool } = pg;

const pool = new Pool({
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
  console.error("PostgreSQL 连接错误:", err);
});

export async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (config.env === "development") {
    console.log(`[DB] ${text.split(" ")[0]} 耗时: ${duration}ms`);
  }
  return res;
}

export async function getClient() {
  return pool.connect();
}

export default pool;
