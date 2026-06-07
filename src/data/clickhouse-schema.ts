export const CLICKHOUSE_DDL = `
-- 桶点表 (MergeTree 引擎，按社区分区)
CREATE TABLE IF NOT EXISTS bin_points (
  id String,
  community_id String,
  name String,
  lng Float64,
  lat Float64,
  geo_hash String,
  status LowCardinality(String),
  bin_count UInt8,
  grid_code String,
  fill_level UInt8,
  last_update DateTime,
  PRIMARY KEY (id, community_id)
) ENGINE = MergeTree()
PARTITION BY community_id
ORDER BY (id, community_id);

-- 社区表
CREATE TABLE IF NOT EXISTS communities (
  id String,
  name String,
  district LowCardinality(String),
  household_count UInt16,
  PRIMARY KEY (id)
) ENGINE = MergeTree()
ORDER BY (id);

-- 误投记录表 (按月分区)
CREATE TABLE IF NOT EXISTS misuse_records (
  id String,
  bin_point_id String,
  record_date Date,
  misuse_type LowCardinality(String),
  misuse_rate Float32,
  audit_status LowCardinality(String),
  auditor Nullable(String),
  audit_time Nullable(DateTime),
  PRIMARY KEY (bin_point_id, record_date)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(record_date)
ORDER BY (bin_point_id, record_date);

-- 桶满报警表
CREATE TABLE IF NOT EXISTS full_alerts (
  id String,
  bin_point_id String,
  alert_time DateTime,
  handle_time Nullable(DateTime),
  level LowCardinality(String),
  status LowCardinality(String),
  handler Nullable(String),
  PRIMARY KEY (bin_point_id, alert_time)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(alert_time)
ORDER BY (bin_point_id, alert_time);

-- 清运日志表 (按月分区)
CREATE TABLE IF NOT EXISTS collection_logs (
  id String,
  bin_point_id String,
  plan_time DateTime,
  actual_time Nullable(DateTime),
  time_window LowCardinality(String),
  is_holiday UInt8,
  status LowCardinality(String),
  vehicle_no Nullable(String),
  PRIMARY KEY (bin_point_id, plan_time)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(plan_time)
ORDER BY (bin_point_id, plan_time);

-- 巡查照片表
CREATE TABLE IF NOT EXISTS inspection_photos (
  id String,
  bin_point_id String,
  uploader String,
  upload_time DateTime,
  photo_url String,
  audit_status LowCardinality(String),
  audit_log_id Nullable(String),
  PRIMARY KEY (bin_point_id, upload_time)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(upload_time)
ORDER BY (bin_point_id, upload_time);

-- 审核日志表
CREATE TABLE IF NOT EXISTS audit_logs (
  id String,
  photo_id String,
  auditor String,
  audit_time DateTime,
  result LowCardinality(String),
  reject_reason Nullable(String),
  PRIMARY KEY (photo_id, audit_time)
) ENGINE = MergeTree()
ORDER BY (photo_id, audit_time);

-- 回访记录表
CREATE TABLE IF NOT EXISTS return_visits (
  id String,
  bin_point_id String,
  visit_time DateTime,
  visitor String,
  issue_type LowCardinality(String),
  rectification String,
  status LowCardinality(String),
  PRIMARY KEY (bin_point_id, visit_time)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(visit_time)
ORDER BY (bin_point_id, visit_time);

-- 节假日配置表
CREATE TABLE IF NOT EXISTS holiday_schedules (
  date Date,
  name String,
  is_workday UInt8,
  PRIMARY KEY (date)
) ENGINE = MergeTree()
ORDER BY (date);

-- 空间索引物化视图 (基于 geo_hash 前缀)
CREATE MATERIALIZED VIEW IF NOT EXISTS bin_spatial_index
ENGINE = MergeTree()
PARTITION BY substr(geo_hash, 1, 2)
ORDER BY (geo_hash, id)
AS SELECT id, community_id, name, lng, lat, geo_hash, status, fill_level
FROM bin_points;

-- 误投趋势聚合物化视图 (仅审核通过)
CREATE MATERIALIZED VIEW IF NOT EXISTS misuse_trend_daily
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(record_date)
ORDER BY (record_date, misuse_type, community_id)
AS SELECT
  record_date,
  misuse_type,
  community_id,
  count() AS record_count,
  avg(misuse_rate) AS avg_misuse_rate
FROM misuse_records
WHERE audit_status = 'approved'
GROUP BY record_date, misuse_type, community_id;
`

export const CLICKHOUSE_QUERIES = {
  spatialQueryByBbox: `
    SELECT * FROM bin_points
    WHERE lng >= {minLng:Float64} AND lng <= {maxLng:Float64}
      AND lat >= {minLat:Float64} AND lat <= {maxLat:Float64}
    ORDER BY geo_hash
  `,

  spatialQueryByGeoHashPrefix: `
    SELECT * FROM bin_points
    WHERE geo_hash LIKE {prefix:String} || '%'
    ORDER BY geo_hash
  `,

  misuseTrendByDateRange: `
    SELECT
      record_date,
      misuse_type,
      count() AS record_count,
      avg(misuse_rate) AS avg_misuse_rate
    FROM misuse_records
    WHERE audit_status = 'approved'
      AND record_date >= {startDate:Date}
      AND record_date <= {endDate:Date}
      {communityFilter}
    GROUP BY record_date, misuse_type
    ORDER BY record_date, misuse_type
  `,

  misuseByType: `
    SELECT
      misuse_type,
      count() AS record_count,
      avg(misuse_rate) AS avg_misuse_rate
    FROM misuse_records
    WHERE audit_status = 'approved'
      AND record_date >= {startDate:Date}
    GROUP BY misuse_type
    ORDER BY avg_misuse_rate DESC
  `,

  collectionEfficiencyByTimeWindow: `
    SELECT
      time_window,
      count() AS total_count,
      countIf(status = 'completed') AS completed_count,
      round(countIf(status = 'completed') / count() * 100, 1) AS on_time_rate
    FROM collection_logs
    WHERE is_holiday = 0
      AND plan_time >= {startDate:DateTime}
    GROUP BY time_window
    ORDER BY time_window
  `,

  collectionEfficiencyByCommunity: `
    SELECT
      c.name AS community_name,
      count() AS total_count,
      countIf(cl.status = 'completed') AS completed_count,
      round(countIf(cl.status = 'completed') / count() * 100, 1) AS on_time_rate
    FROM collection_logs cl
    JOIN bin_points bp ON cl.bin_point_id = bp.id
    JOIN communities c ON bp.community_id = c.id
    WHERE cl.is_holiday = 0
    GROUP BY c.name
    ORDER BY on_time_rate DESC
  `,

  inspectionCoverageByCommunity: `
    SELECT
      c.name AS community_name,
      count(DISTINCT bp.id) AS bin_count,
      count(DISTINCT ip.bin_point_id) AS inspected_count,
      round(count(DISTINCT ip.bin_point_id) / count(DISTINCT bp.id) * 100, 1) AS coverage_rate
    FROM communities c
    JOIN bin_points bp ON bp.community_id = c.id
    LEFT JOIN inspection_photos ip ON ip.bin_point_id = bp.id
    GROUP BY c.name
    ORDER BY coverage_rate DESC
  `,

  communityRankingApprovedOnly: `
    SELECT
      c.name AS community_name,
      c.district,
      count(DISTINCT bp.id) AS bin_count,
      round(avg(CASE WHEN mr.audit_status = 'approved' THEN mr.misuse_rate ELSE NULL END), 1) AS avg_misuse_rate,
      round(countIf(cl.status = 'completed' AND cl.is_holiday = 0) /
            NULLIF(countIf(cl.is_holiday = 0), 0) * 100, 1) AS on_time_rate
    FROM communities c
    JOIN bin_points bp ON bp.community_id = c.id
    LEFT JOIN misuse_records mr ON mr.bin_point_id = bp.id AND mr.audit_status = 'approved'
    LEFT JOIN collection_logs cl ON cl.bin_point_id = bp.id AND cl.is_holiday = 0
    GROUP BY c.name, c.district
    ORDER BY avg_misuse_rate DESC
  `,

  auditLogWithRejectReason: `
    SELECT
      al.id,
      al.photo_id,
      al.auditor,
      al.audit_time,
      al.result,
      al.reject_reason,
      ip.bin_point_id,
      ip.uploader,
      ip.upload_time
    FROM audit_logs al
    JOIN inspection_photos ip ON al.photo_id = ip.id
    WHERE al.result = 'rejected'
    ORDER BY al.audit_time DESC
    LIMIT {limit:UInt32}
  `,

  pendingAlerts: `
    SELECT
      fa.id,
      fa.bin_point_id,
      fa.alert_time,
      fa.level,
      fa.status,
      bp.name AS bin_name,
      c.name AS community_name
    FROM full_alerts fa
    JOIN bin_points bp ON fa.bin_point_id = bp.id
    JOIN communities c ON bp.community_id = c.id
    WHERE fa.status != 'resolved'
    ORDER BY
      CASE fa.level WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
      fa.alert_time DESC
  `,

  publicAggregatedReport: `
    SELECT
      c.district,
      count(DISTINCT bp.id) AS bin_count,
      countIf(bp.status = 'normal') AS normal_count,
      round(countIf(bp.status = 'normal') / count(DISTINCT bp.id) * 100, 1) AS normal_rate,
      round(avg(CASE WHEN mr.audit_status = 'approved' THEN mr.misuse_rate ELSE NULL END), 1) AS avg_misuse_rate,
      round(countIf(cl.status = 'completed' AND cl.is_holiday = 0) /
            NULLIF(countIf(cl.is_holiday = 0), 0) * 100, 1) AS on_time_rate
    FROM communities c
    JOIN bin_points bp ON bp.community_id = c.id
    LEFT JOIN misuse_records mr ON mr.bin_point_id = bp.id AND mr.audit_status = 'approved'
    LEFT JOIN collection_logs cl ON cl.bin_point_id = bp.id AND cl.is_holiday = 0
    GROUP BY c.district
    ORDER BY c.district
  `
}
