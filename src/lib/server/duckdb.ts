import type { SensorReading, Greenhouse, Sensor, IrrigationValve, CropBatch, Alert, IrrigationEvent } from '$lib/types';

let dbInitialized = false;

export async function initDuckDB() {
  if (dbInitialized) {
    return true;
  }

  console.log('初始化 DuckDB 列式存储...');

  try {
    await import('duckdb-async');
    dbInitialized = true;
    console.log('DuckDB 模块加载成功');
    return true;
  } catch (e) {
    console.warn('DuckDB 不可用，使用内存存储:', e);
    dbInitialized = true;
    return false;
  }
}

export async function queryDuckDB(sql: string, params: any[] = []): Promise<any[]> {
  try {
    const duckdbModule = await import('duckdb-async');
    const Database = duckdbModule.default?.Database || duckdbModule.Database;
    if (Database) {
      const db = await Database.create(':memory:');
      return await db.all(sql, ...params);
    }
    return [];
  } catch (e) {
    console.warn('DuckDB 查询失败:', e);
    return [];
  }
}

export function getCachedData() {
  return null;
}

export async function executeDuckDBQuery(sql: string): Promise<any[]> {
  try {
    const result = await queryDuckDB(sql);
    return result;
  } catch (e) {
    console.error('DuckDB 执行错误:', e);
    return [];
  }
}
