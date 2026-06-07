-- ============================================
-- 核心业务查询 SQL
-- 这些查询与前端仪表盘一一对应
-- ============================================

-- ============================================
-- 查询1: 可用率计算 (离线桩排除)
-- 对应: KPI 卡片 - 充电桩可用率
-- ============================================
SELECT
    countIf(c.is_offline = 0) as online_total,
    countIf(c.is_offline = 0 AND c.status = 'fault') as online_faulty,
    countIf(c.is_offline = 0 AND c.status != 'fault' AND f.fault_count = 0) as online_normal,
    round(online_normal / online_total, 4) as availability_rate,
    countIf(c.is_offline = 1) as offline_count
FROM dim_charger c
LEFT JOIN (
    SELECT charger_id, count() as fault_count
    FROM fact_fault_log
    WHERE occur_time BETWEEN {startTime:DateTime} AND {endTime:DateTime}
    GROUP BY charger_id
) f ON c.charger_id = f.charger_id;

-- ============================================
-- 查询2: 故障按站点统计 (带重复报修合并)
-- 对应: 故障地图、站点排行
-- ============================================
SELECT
    s.station_id,
    s.station_name,
    s.region,
    s.lat,
    s.lng,
    count(DISTINCT if(dateDiff('hour', f.prev_occur, f.occur_time) > 72 OR f.prev_occur IS NULL, f.fault_id, NULL)) as fault_count,
    countIf(f.is_resolved = 0) as unresolved_count,
    count(DISTINCT c.charger_id) as charger_count,
    round(countIf(c.is_offline = 0 AND c.status != 'fault') / countIf(c.is_offline = 0), 4) as availability
FROM dim_station s
LEFT JOIN (
    SELECT
        fault_id,
        station_id,
        charger_id,
        occur_time,
        is_resolved,
        lagInFrame(occur_time) OVER (PARTITION BY charger_id, fault_code ORDER BY occur_time) as prev_occur
    FROM fact_fault_log
    WHERE occur_time BETWEEN {startTime:DateTime} AND {endTime:DateTime}
) f ON s.station_id = f.station_id
LEFT JOIN dim_charger c ON s.station_id = c.station_id
GROUP BY s.station_id, s.station_name, s.region, s.lat, s.lng
ORDER BY fault_count DESC;

-- ============================================
-- 查询3: 维修耗时分布 (按故障码)
-- 对应: 维修耗时箱线图
-- ============================================
SELECT
    fault_code,
    anyHeavy(fc.fault_desc) as fault_desc,
    anyHeavy(fc.severity) as severity,
    count() as sample_size,
    round(quantile(0.25)(repair_hours), 2) as q1,
    round(quantile(0.50)(repair_hours), 2) as median,
    round(quantile(0.75)(repair_hours), 2) as q3,
    round(min(repair_hours), 2) as min_hours,
    round(max(repair_hours), 2) as max_hours,
    round(avg(repair_hours), 2) as avg_hours
FROM fact_repair_order o
LEFT JOIN dim_fault_code fc ON o.fault_code = fc.fault_code
WHERE o.status = 'completed'
  AND o.create_time BETWEEN {startTime:DateTime} AND {endTime:DateTime}
GROUP BY fault_code
ORDER BY avg_hours DESC
LIMIT 10;

-- ============================================
-- 查询4: 故障时段分布 (按小时)
-- 对应: 故障时段分布图
-- ============================================
SELECT
    toHour(occur_time) as hour,
    count() as fault_count
FROM fact_fault_log
WHERE occur_time BETWEEN {startTime:DateTime} AND {endTime:DateTime}
GROUP BY hour
ORDER BY hour;

-- ============================================
-- 查询5: 今日最异常TOP3 (智能识别)
-- 对应: 今日异常三件事
-- ============================================
WITH
today_start as toStartOfDay(now()),
yesterday_start as today_start - INTERVAL 1 DAY,

-- 指标1: 站点故障数同比
station_anomaly as (
    SELECT
        'station' as anomaly_type,
        station_id as entity_id,
        anyHeavy(station_name) as entity_name,
        fault_count as metric_value,
        concat(toString(fault_count), '次故障') as metric_label,
        if(fault_count > 10, 'critical', 'warning') as level,
        concat(entity_name, ' 故障频发') as title,
        concat('今日已发生 ', fault_count, ' 次故障，', unresolved, ' 次未处理') as description
    FROM (
        SELECT
            f.station_id,
            s.station_name,
            count() as fault_count,
            countIf(is_resolved = 0) as unresolved
        FROM fact_fault_log f
        LEFT JOIN dim_station s ON f.station_id = s.station_id
        WHERE f.occur_time >= today_start
        GROUP BY f.station_id, s.station_name
    )
    ORDER BY fault_count DESC
    LIMIT 1
),

-- 指标2: 故障码高发
fault_code_anomaly as (
    SELECT
        'fault_code' as anomaly_type,
        fault_code as entity_id,
        anyHeavy(fault_desc) as entity_name,
        fault_count as metric_value,
        concat(toString(fault_count), '次') as metric_label,
        if(anyHeavy(severity) = 'critical', 'critical', 'warning') as level,
        concat(fault_code, ' 故障高发') as title,
        concat(anyHeavy(fault_desc), '，共发生 ', fault_count, ' 次') as description
    FROM (
        SELECT
            f.fault_code,
            fc.fault_desc,
            fc.severity,
            count() as fault_count
        FROM fact_fault_log f
        LEFT JOIN dim_fault_code fc ON f.fault_code = fc.fault_code
        WHERE f.occur_time >= today_start
        GROUP BY f.fault_code, fc.fault_desc, fc.severity
    )
    ORDER BY fault_count DESC
    LIMIT 1
),

-- 指标3: 维修效率异常
repair_anomaly as (
    SELECT
        'repair_time' as anomaly_type,
        '' as entity_id,
        '维修效率' as entity_name,
        avg_hours as metric_value,
        concat(toString(round(avg_hours, 1)), '小时') as metric_label,
        'warning' as level,
        '维修效率偏低' as title,
        concat('平均维修耗时 ', round(avg_hours, 1), ' 小时，超过目标阈值') as description
    FROM (
        SELECT avg(repair_hours) as avg_hours
        FROM fact_repair_order
        WHERE status = 'completed' AND create_time >= today_start
    )
    WHERE avg_hours > 3
    LIMIT 1
)

SELECT * FROM station_anomaly
UNION ALL
SELECT * FROM fault_code_anomaly
UNION ALL
SELECT * FROM repair_anomaly
LIMIT 3;

-- ============================================
-- 查询6: 功率曲线数据
-- 对应: 功率曲线图
-- ============================================
SELECT
    timestamp,
    charger_id,
    power,
    is_anomaly
FROM fact_power_reading
WHERE charger_id IN ({chargerIds:Array(String)})
  AND timestamp BETWEEN {startTime:DateTime} AND {endTime:DateTime}
ORDER BY charger_id, timestamp;

-- ============================================
-- 查询7: 重复报修率
-- 对应: KPI 卡片 - 重复报修率
-- ============================================
WITH
merged as (
    SELECT
        fault_id,
        charger_id,
        fault_code,
        occur_time,
        sum(if(dateDiff('hour', prev_occur, occur_time) <= 72, 1, 0))
            OVER (PARTITION BY charger_id, fault_code ORDER BY occur_time) as dup_group
    FROM (
        SELECT
            fault_id,
            charger_id,
            fault_code,
            occur_time,
            lag(occur_time) OVER (PARTITION BY charger_id, fault_code ORDER BY occur_time) as prev_occur
        FROM fact_fault_log
        WHERE occur_time BETWEEN {startTime:DateTime} AND {endTime:DateTime}
    )
)
SELECT
    count() as original_count,
    count(DISTINCT concat(charger_id, '_', fault_code, '_', toString(dup_group))) as merged_count,
    original_count - merged_count as duplicate_count,
    round(duplicate_count / original_count, 4) as duplicate_rate
FROM merged;
