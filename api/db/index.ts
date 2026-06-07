import type { DatabaseAdapter } from './types';
import { MemoryDatabaseAdapter } from './memoryAdapter.js';
import { PostgresDatabaseAdapter } from './postgresAdapter.js';

let db: DatabaseAdapter;

export async function initDatabase(): Promise<DatabaseAdapter> {
  const usePostgres = process.env.USE_POSTGRES === 'true';

  if (usePostgres) {
    try {
      db = new PostgresDatabaseAdapter();
      await db.init();
      console.log('✅ 使用 PostgreSQL/PostGIS 数据库');
      return db;
    } catch (error) {
      console.warn('⚠️  PostgreSQL 连接失败，回退到内存数据库');
    }
  }

  db = new MemoryDatabaseAdapter();
  await db.init();
  console.log('✅ 使用内存数据库 (默认)');
  console.log('   设置 USE_POSTGRES=true 并配置 DATABASE_URL 以启用 PostgreSQL/PostGIS');
  return db;
}

export function getDB(): DatabaseAdapter {
  if (!db) {
    throw new Error('数据库未初始化，请先调用 initDatabase()');
  }
  return db;
}

export type { DatabaseAdapter };
export { MemoryDatabaseAdapter, PostgresDatabaseAdapter };
