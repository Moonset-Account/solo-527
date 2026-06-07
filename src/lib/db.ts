import { Pool, PoolConfig } from "pg";

const DB_CONFIG: PoolConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "repair_dashboard",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

let pool: Pool | null = null;
let useMockData = true;
let initialized = false;

export function initDatabase(): void {
  if (initialized) return;
  initialized = true;

  if (process.env.DATABASE_URL || process.env.DB_HOST) {
    try {
      if (process.env.DATABASE_URL) {
        pool = new Pool({ connectionString: process.env.DATABASE_URL });
      } else {
        pool = new Pool(DB_CONFIG);
      }
      useMockData = false;
      console.log("✓ 数据库连接池已初始化");
    } catch (error) {
      console.warn("⚠ 数据库连接失败，将使用 Mock 数据:", error);
      useMockData = true;
    }
  } else {
    console.log("ℹ 未配置数据库，使用 Mock 数据模式");
    useMockData = true;
  }
}

initDatabase();

export function getPool(): Pool | null {
  return pool;
}

export function isUsingMockData(): boolean {
  return useMockData;
}

export async function queryDatabase<T = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  if (!pool) {
    throw new Error("数据库连接未初始化");
  }
  const result = await pool.query(text, params);
  return result.rows as T[];
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log("✓ 数据库连接池已关闭");
  }
}
