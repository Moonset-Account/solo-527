/**
 * ClickHouse 数据链路模拟
 * 包含：建表 DDL、数据导入、SQL 查询模板
 * 实际生产环境中需要连接真实的 ClickHouse 集群
 */

export const CLICKHOUSE_CONFIG = {
  host: 'clickhouse-cluster.local',
  port: 8123,
  database: 'park_security',
  username: 'park_reader',
  queryTimeout: 30000,
};

export const TABLE_DDL = {
  visitor_records: `
CREATE TABLE IF NOT EXISTS park_security.visitor_records
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
SETTINGS index_granularity = 8192;
  `,

  visitor_records_mv_hour: `
CREATE MATERIALIZED VIEW IF NOT EXISTS park_security.visitor_hour_mv
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(hour_bucket)
ORDER BY (enterprise_id, gate_id, hour_bucket, visitor_type)
AS SELECT
    enterprise_id,
    enterprise_name,
    gate_id,
    gate_name,
    visitor_type,
    visitor_type_name,
    toStartOfHour(pass_time) AS hour_bucket,
    count() AS total_count,
    countIf(is_abnormal = 1) AS abnormal_count,
    uniq(plate_number) AS unique_plates
FROM park_security.visitor_records
GROUP BY enterprise_id, enterprise_name, gate_id, gate_name, visitor_type, visitor_type_name, hour_bucket;
  `,

  enterprise_day_mv: `
CREATE MATERIALIZED VIEW IF NOT EXISTS park_security.enterprise_day_mv
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(day_bucket)
ORDER BY (enterprise_id, day_bucket)
AS SELECT
    enterprise_id,
    enterprise_name,
    toDate(pass_time) AS day_bucket,
    count() AS total_count,
    countIf(is_abnormal = 1) AS abnormal_count,
    uniqExact(plate_number) AS unique_vehicles
FROM park_security.visitor_records
GROUP BY enterprise_id, enterprise_name, day_bucket;
  `,
};

export const QUERY_TEMPLATES = {
  overview: `
SELECT
    count() AS total_visitors,
    countIf(is_abnormal = 1) AS total_abnormal,
    round(total_abnormal * 100.0 / nullIf(total_visitors, 0), 2) AS abnormal_rate,
    argMax(hour_bucket, hour_count) AS peak_hour,
    max(hour_count) AS peak_visitor_count
FROM (
    SELECT 
        toStartOfHour(pass_time) AS hour_bucket,
        count() AS hour_count
    FROM park_security.visitor_records
    WHERE pass_time BETWEEN {startDate:DateTime} AND {endDate:DateTime}
    GROUP BY hour_bucket
    ORDER BY hour_count DESC
    LIMIT 1
)
CROSS JOIN (
    SELECT
        count() AS total_visitors,
        countIf(is_abnormal = 1) AS total_abnormal
    FROM park_security.visitor_records
    WHERE pass_time BETWEEN {startDate:DateTime} AND {endDate:DateTime}
    {enterpriseFilter:String}
    {gateFilter:String}
    {visitorTypeFilter:String}
    {laneFilter:String}
)
  `,

  heatmap: `
SELECT
    gate_id,
    gate_name,
    toHour(pass_time) AS hour,
    count() AS count
FROM park_security.visitor_records
WHERE pass_time BETWEEN {startDate:DateTime} AND {endDate:DateTime}
{enterpriseFilter:String}
{gateFilter:String}
{visitorTypeFilter:String}
{laneFilter:String}
GROUP BY gate_id, gate_name, hour
ORDER BY gate_id, hour
  `,

  rank: `
SELECT
    enterprise_id,
    enterprise_name,
    count() AS total,
    countIf(is_abnormal = 1) AS abnormal,
    round(abnormal * 100.0 / nullIf(total, 0), 2) AS abnormal_rate,
    row_number() OVER (ORDER BY {sortBy:String} DESC) AS rank
FROM park_security.visitor_records
WHERE pass_time BETWEEN {startDate:DateTime} AND {endDate:DateTime}
{enterpriseFilter:String}
{gateFilter:String}
{visitorTypeFilter:String}
{laneFilter:String}
GROUP BY enterprise_id, enterprise_name
ORDER BY {sortBy:String} DESC
LIMIT {limit:UInt32}
  `,

  exceptions: `
SELECT
    id,
    pass_time AS time,
    plate_number_desensitized AS plate_number,
    id_card_desensitized AS id_card,
    visitor_type_name,
    gate_name,
    lane_name,
    enterprise_name,
    arrayStringConcat(abnormal_reason, ', ') AS reason,
    abnormal_level AS level,
    remark,
    operator
FROM park_security.visitor_records
WHERE is_abnormal = 1
AND pass_time BETWEEN {startDate:DateTime} AND {endDate:DateTime}
{enterpriseFilter:String}
{gateFilter:String}
{visitorTypeFilter:String}
{laneFilter:String}
ORDER BY pass_time DESC
LIMIT {pageSize:UInt32} OFFSET {offset:UInt32}
  `,

  trend: `
SELECT
    toStartOfHour(pass_time) AS time,
    toUnixTimestamp64Milli(toStartOfHour(pass_time)) AS timestamp,
    count() AS count,
    countIf(is_abnormal = 1) AS abnormal,
    0 AS is_missing,
    if(count() > quantileExact(0.95)(count()) OVER (), 1, 0) AS is_peak
FROM park_security.visitor_records
WHERE pass_time BETWEEN {startDate:DateTime} AND {endDate:DateTime}
{enterpriseFilter:String}
{gateFilter:String}
{visitorTypeFilter:String}
{laneFilter:String}
GROUP BY time, timestamp
ORDER BY time ASC
WITH FILL
    FROM toUnixTimestamp64Milli({startDate:DateTime})
    TO toUnixTimestamp64Milli({endDate:DateTime})
    STEP 3600000
  `,
};

export function buildFilterClause(field: string, values: string[] | undefined, paramName: string): string {
  if (!values || values.length === 0) return '';
  const placeholders = values.map((_, i) => `{${paramName}_${i}:String}`).join(', ');
  return `AND ${field} IN (${placeholders})`;
}

export interface QueryParams {
  startDate: string;
  endDate: string;
  enterpriseIds?: string[];
  gateIds?: string[];
  visitorTypes?: string[];
  laneIds?: string[];
}

export function buildQueryParams(params: QueryParams): Record<string, any> {
  const chParams: Record<string, any> = {
    startDate: params.startDate,
    endDate: params.endDate,
  };

  if (params.enterpriseIds) {
    params.enterpriseIds.forEach((id, i) => {
      chParams[`enterpriseId_${i}`] = id;
    });
  }
  if (params.gateIds) {
    params.gateIds.forEach((id, i) => {
      chParams[`gateId_${i}`] = id;
    });
  }
  if (params.visitorTypes) {
    params.visitorTypes.forEach((id, i) => {
      chParams[`visitorType_${i}`] = id;
    });
  }
  if (params.laneIds) {
    params.laneIds.forEach((id, i) => {
      chParams[`laneId_${i}`] = id;
    });
  }

  return chParams;
}

export const CACHE_STRATEGY = {
  overview: { ttl: 300000, namespace: 'overview' },
  heatmap: { ttl: 600000, namespace: 'heatmap' },
  rank: { ttl: 300000, namespace: 'rank' },
  exceptions: { ttl: 60000, namespace: 'exceptions' },
  trend: { ttl: 120000, namespace: 'trend' },
};

export const DATA_IMPORT_PIPELINE = {
  steps: [
    '1. 原始数据接入：从闸机系统、车牌识别系统通过 Kafka 接入',
    '2. 数据清洗：调用 data_cleaner.py 进行格式校验和脱敏',
    '3. ClickHouse 写入：通过 clickhouse-client 批量写入 MergeTree 表',
    '4. 物化视图更新：SummingMergeTree 自动聚合小时和天粒度',
    '5. 查询服务：API 层通过参数化查询读取聚合结果',
  ],
  batchSize: 10000,
  insertInterval: '5s',
  kafkaTopics: ['park-gate-raw', 'park-lpr-raw'],
};

console.log('[ClickHouse] 数据链路配置加载完成');
console.log('[ClickHouse] 数据表: visitor_records (MergeTree)');
console.log('[ClickHouse] 物化视图: visitor_hour_mv, enterprise_day_mv');
