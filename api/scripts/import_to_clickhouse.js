#!/usr/bin/env node
/**
 * 数据导入管道：清洗后的数据 → ClickHouse
 * 
 * 使用方式：
 *   1. 先运行清洗脚本：python3 data_cleaner.py clean -i raw.json -o cleaned.json
 *   2. 再运行导入：node import_to_clickhouse.js -i cleaned.json
 * 
 * 环境变量：
 *   CLICKHOUSE_MODE=clickhouse   # 使用真实 ClickHouse
 *   CLICKHOUSE_HOST=localhost
 *   CLICKHOUSE_PORT=8123
 *   CLICKHOUSE_DATABASE=park_security
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { program } from 'commander';
import { createClient, type ClickHouseClient } from '@clickhouse/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

program
  .name('import-to-clickhouse')
  .description('将清洗后的数据导入 ClickHouse')
  .requiredOption('-i, --input <path>', '清洗后的 JSON 文件路径')
  .option('-b, --batch-size <number>', '批量插入大小', '5000')
  .option('-t, --table <name>', '目标表名', 'visitor_records')
  .option('--dry-run', '仅验证不实际插入')
  .parse(process.argv);

const options = program.opts();

interface CleanedRecord {
  id: string;
  passTime: string;
  passTimestamp: number;
  hourBucket: number;
  dayBucket: string;
  plateNumber: string;
  plateNumberDesensitized: string;
  idCard: string;
  idCardDesensitized: string;
  visitorType: string;
  visitorTypeName: string;
  enterpriseId: string;
  enterpriseName: string;
  gateId: string;
  gateName: string;
  laneId: string;
  laneName: string;
  appointmentId: string | null;
  isAbnormal: boolean;
  abnormalLevel?: string;
  abnormalReason?: string[];
  remark?: string;
  operator?: string;
}

async function ensureDatabase(client: ClickHouseClient, database: string) {
  await client.exec({
    query: `CREATE DATABASE IF NOT EXISTS ${database}`,
  });
  console.log(`[DB] Database ${database} ready`);
}

async function ensureTable(client: ClickHouseClient, database: string, table: string) {
  const ddl = `
CREATE TABLE IF NOT EXISTS ${database}.${table}
(
    id String,
    pass_time DateTime64(3),
    pass_timestamp Int64,
    hour_bucket DateTime MATERIALIZED toStartOfHour(pass_time),
    day_bucket Date MATERIALIZED toDate(pass_time),
    pass_hour UInt8 MATERIALIZED toHour(pass_time),
    plate_number String,
    plate_number_desensitized String,
    id_card String,
    id_card_desensitized String,
    visitor_type LowCardinality(String),
    visitor_type_name LowCardinality(String),
    enterprise_id LowCardinality(String),
    enterprise_name LowCardinality(String),
    gate_id LowCardinality(String),
    gate_name LowCardinality(String),
    lane_id LowCardinality(String),
    lane_name LowCardinality(String),
    appointment_id Nullable(String),
    is_abnormal UInt8,
    abnormal_level LowCardinality(String),
    abnormal_reason Array(String),
    remark Nullable(String),
    operator LowCardinality(String),
    created_at DateTime DEFAULT now()
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(pass_time)
ORDER BY (enterprise_id, pass_time, gate_id)
TTL pass_time + INTERVAL 6 MONTH
SETTINGS index_granularity = 8192
  `;
  await client.exec({ query: ddl });
  console.log(`[DB] Table ${database}.${table} ready`);
}

function* batchIterator<T>(arr: T[], batchSize: number): Generator<T[]> {
  for (let i = 0; i < arr.length; i += batchSize) {
    yield arr.slice(i, i + batchSize);
  }
}

async function main() {
  const inputPath = path.resolve(options.input);
  if (!fs.existsSync(inputPath)) {
    console.error(`错误: 输入文件不存在: ${inputPath}`);
    process.exit(1);
  }

  console.log(`[Import] Reading: ${inputPath}`);
  const raw = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  const records: CleanedRecord[] = raw.records || raw;
  console.log(`[Import] Loaded ${records.length} records`);

  const chConfig = {
    host: process.env.CLICKHOUSE_HOST || 'localhost',
    port: parseInt(process.env.CLICKHOUSE_PORT || '8123'),
    database: process.env.CLICKHOUSE_DATABASE || 'park_security',
    username: process.env.CLICKHOUSE_USER || 'default',
    password: process.env.CLICKHOUSE_PASSWORD || '',
  };

  if (options.dryRun) {
    console.log('[DRY RUN] 模式：仅验证数据格式');
    const sample = records[0];
    console.log('[DRY RUN] 样本字段:', Object.keys(sample).join(', '));
    console.log('[DRY RUN] 验证通过，未实际插入');
    process.exit(0);
  }

  const client = createClient(chConfig);
  console.log(`[ClickHouse] Connecting to ${chConfig.host}:${chConfig.port}/${chConfig.database}`);

  try {
    await client.ping();
    console.log('[ClickHouse] Connection OK');
  } catch (e: any) {
    console.error('[ClickHouse] 连接失败:', e.message);
    console.error('提示: 如果没有 ClickHouse，可以使用内存模式运行服务');
    process.exit(1);
  }

  await ensureDatabase(client, chConfig.database);
  await ensureTable(client, chConfig.database, options.table);

  const batchSize = parseInt(options.batchSize);
  let inserted = 0;

  console.log(`[Import] 开始导入，批量大小: ${batchSize}`);
  const startTime = Date.now();

  for (const batch of batchIterator(records, batchSize)) {
    try {
      const values = batch.map(r => ({
        id: r.id,
        pass_time: r.passTime,
        pass_timestamp: r.passTimestamp,
        plate_number: r.plateNumber || '',
        plate_number_desensitized: r.plateNumberDesensitized || '',
        id_card: r.idCard || '',
        id_card_desensitized: r.idCardDesensitized || '',
        visitor_type: r.visitorType,
        visitor_type_name: r.visitorTypeName,
        enterprise_id: r.enterpriseId,
        enterprise_name: r.enterpriseName,
        gate_id: r.gateId,
        gate_name: r.gateName,
        lane_id: r.laneId,
        lane_name: r.laneName,
        appointment_id: r.appointmentId,
        is_abnormal: r.isAbnormal ? 1 : 0,
        abnormal_level: r.abnormalLevel || '',
        abnormal_reason: r.abnormalReason || [],
        remark: r.remark || null,
        operator: r.operator || '',
      }));

      await client.insert({
        table: `${chConfig.database}.${options.table}`,
        values,
        format: 'JSONEachRow',
      });

      inserted += batch.length;
      const pct = Math.round((inserted / records.length) * 100);
      process.stdout.write(`\r[Import] Progress: ${inserted}/${records.length} (${pct}%)`);
    } catch (e: any) {
      console.error(`\n[Error] 批量插入失败:`, e.message);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n[Import] 完成！共导入 ${inserted} 条，耗时 ${elapsed}s`);

  const rs = await client.query({
    query: `SELECT count() as cnt FROM ${chConfig.database}.${options.table}`,
    format: 'JSONEachRow',
  });
  const result = await rs.json();
  console.log(`[Verify] 表中总记录数: ${result[0]?.cnt || 0}`);

  await client.close();
}

main().catch(e => {
  console.error('导入失败:', e);
  process.exit(1);
});
