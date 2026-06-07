-- =====================================================
-- 水上运动营数据看板 - ClickHouse 表结构
-- =====================================================

CREATE DATABASE IF NOT EXISTS water_sports_camp;

USE water_sports_camp;

-- =====================================================
-- 维度表
-- =====================================================

CREATE TABLE IF NOT EXISTS camp_sessions (
    id String,
    name String,
    startDate Date,
    endDate Date,
    createTime DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY id;

CREATE TABLE IF NOT EXISTS sports_projects (
    id String,
    name String,
    description String,
    createTime DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY id;

CREATE TABLE IF NOT EXISTS age_groups (
    id String,
    name String,
    minAge UInt8,
    maxAge UInt8,
    createTime DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY id;

CREATE TABLE IF NOT EXISTS coaches (
    id String,
    name String,
    specialty String,
    level String,
    createTime DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY id;

CREATE TABLE IF NOT EXISTS cancel_reasons (
    id String,
    name String,
    createTime DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY id;

CREATE TABLE IF NOT EXISTS equipment_types (
    id String,
    name String,
    category String,
    createTime DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY id;

CREATE TABLE IF NOT EXISTS weather_types (
    id String,
    name String,
    icon String,
    createTime DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY id;

-- =====================================================
-- 事实表
-- =====================================================

CREATE TABLE IF NOT EXISTS registrations (
    id String,
    sessionId String,
    projectId String,
    ageGroupId String,
    coachId String,
    registerDate Date,
    registerCount UInt32 DEFAULT 1,
    confirmCount UInt32 DEFAULT 0,
    checkinCount UInt32 DEFAULT 0,
    completeCount UInt32 DEFAULT 0,
    cancelled UInt32 DEFAULT 0,
    cancelReasonId Nullable(String),
    isMinor UInt8 DEFAULT 1,
    createTime DateTime DEFAULT now(),
    updateTime DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (sessionId, projectId, ageGroupId, coachId, registerDate)
PARTITION BY toYYYYMM(registerDate);

CREATE TABLE IF NOT EXISTS checkins (
    id String,
    registrationId String,
    sessionId String,
    projectId String,
    coachId String,
    ageGroupId String,
    checkinDate Date,
    checkinTime DateTime,
    isMinor UInt8,
    status String,
    createTime DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (sessionId, projectId, checkinDate)
PARTITION BY toYYYYMM(checkinDate);

CREATE TABLE IF NOT EXISTS weather_records (
    id String,
    sessionId String,
    date Date,
    weatherId String,
    temperature Int8,
    windSpeed UInt8,
    visibility UInt8,
    humidity UInt8,
    createTime DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (sessionId, date)
PARTITION BY toYYYYMM(date);

CREATE TABLE IF NOT EXISTS equipment_usage (
    id String,
    sessionId String,
    projectId String,
    equipmentId String,
    useDate Date,
    useCount UInt32 DEFAULT 0,
    damageCount UInt32 DEFAULT 0,
    lossCount UInt32 DEFAULT 0,
    totalWear UInt32 DEFAULT 0,
    createTime DateTime DEFAULT now(),
    updateTime DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (sessionId, projectId, equipmentId, useDate)
PARTITION BY toYYYYMM(useDate);

CREATE TABLE IF NOT EXISTS incidents (
    id String,
    sessionId String,
    projectId String,
    coachId String,
    ageGroupId String,
    level String,
    title String,
    description String,
    date Date,
    time String,
    hasPhoto UInt8 DEFAULT 0,
    photoUrl Nullable(String),
    minorCount UInt32 DEFAULT 0,
    adultCount UInt32 DEFAULT 0,
    weatherAtTime Nullable(String),
    createTime DateTime DEFAULT now(),
    updateTime DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (sessionId, projectId, date)
PARTITION BY toYYYYMM(date);

-- =====================================================
-- 物化视图：统一看板数据（预聚合）
-- =====================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_dashboard_funnel
ENGINE = SummingMergeTree()
ORDER BY (sessionId, projectId, ageGroupId, coachId, registerDate)
AS SELECT
    sessionId,
    projectId,
    ageGroupId,
    coachId,
    registerDate,
    sum(registerCount) as registerCount,
    sum(confirmCount) as confirmCount,
    sum(checkinCount) as checkinCount,
    sum(completeCount) as completeCount,
    sum(cancelled) as cancelled
FROM registrations
GROUP BY sessionId, projectId, ageGroupId, coachId, registerDate;

-- =====================================================
-- 统一查询：获取看板所有数据（单次查询）
-- =====================================================

-- 说明：实际应用中可通过一次 HTTP 请求执行多条查询
-- 或者使用 ClickHouse 的 JOIN 和子查询整合

-- 1. 漏斗数据 + 取消原因统计
SELECT
    'funnel' as data_type,
    stage,
    count,
    cancelReasonId,
    cancelCount
FROM (
    SELECT
        'register' as stage,
        sum(registerCount) as count,
        '' as cancelReasonId,
        0 as cancelCount
    FROM registrations
    WHERE 1=1
    UNION ALL
    SELECT
        'confirm' as stage,
        sum(confirmCount) as count,
        '' as cancelReasonId,
        0 as cancelCount
    FROM registrations
    WHERE 1=1
    UNION ALL
    SELECT
        'checkin' as stage,
        sum(checkinCount) as count,
        '' as cancelReasonId,
        0 as cancelCount
    FROM registrations
    WHERE 1=1
    UNION ALL
    SELECT
        'complete' as stage,
        sum(completeCount) as count,
        '' as cancelReasonId,
        0 as cancelCount
    FROM registrations
    WHERE 1=1
    UNION ALL
    SELECT
        'cancel_reason' as stage,
        0 as count,
        cancelReasonId,
        count() as cancelCount
    FROM registrations
    WHERE cancelled = 1 AND cancelReasonId IS NOT NULL
    GROUP BY cancelReasonId
);

-- 2. 天气关联取消统计
SELECT
    w.weatherId,
    wt.name as weatherName,
    count() as cancelCount
FROM registrations r
LEFT JOIN weather_records w 
    ON r.sessionId = w.sessionId 
    AND r.registerDate = w.date
LEFT JOIN weather_types wt ON w.weatherId = wt.id
WHERE r.cancelled = 1 
    AND r.cancelReasonId = 'weather'
    AND w.weatherId IS NOT NULL
GROUP BY w.weatherId, wt.name
ORDER BY cancelCount DESC;

-- 3. 救援事件（含天气关联）
SELECT
    i.*,
    w.weatherId,
    wt.name as weatherName,
    w.temperature,
    w.windSpeed
FROM incidents i
LEFT JOIN weather_records w 
    ON i.sessionId = w.sessionId 
    AND i.date = w.date
LEFT JOIN weather_types wt ON w.weatherId = wt.id
WHERE 1=1
ORDER BY i.date DESC, i.time DESC;

-- 4. 天气与安全事件关联分析
SELECT
    w.weatherId,
    wt.name as weatherName,
    count() as incidentCount,
    sum(if(i.level = 'minor', 1, 0)) as minorCount,
    sum(if(i.level = 'medical', 1, 0)) as medicalCount,
    sum(if(i.level = 'suspend', 1, 0)) as suspendCount
FROM incidents i
LEFT JOIN weather_records w 
    ON i.sessionId = w.sessionId 
    AND i.date = w.date
LEFT JOIN weather_types wt ON w.weatherId = wt.id
WHERE w.weatherId IS NOT NULL
GROUP BY w.weatherId, wt.name
ORDER BY incidentCount DESC;

-- 5. 装备损耗热力图
SELECT
    projectId,
    equipmentId,
    sum(useCount) as useCount,
    sum(damageCount) as damageCount,
    sum(lossCount) as lossCount,
    sum(totalWear) as totalWear
FROM equipment_usage
WHERE 1=1
GROUP BY projectId, equipmentId
ORDER BY totalWear DESC;

-- =====================================================
-- 插入测试数据（可选）
-- =====================================================

-- 维度表数据
INSERT INTO camp_sessions (id, name, startDate, endDate) VALUES
('2024-s1', '2024年暑期第一期', '2024-07-01', '2024-07-14'),
('2024-s2', '2024年暑期第二期', '2024-07-15', '2024-07-28'),
('2024-s3', '2024年暑期第三期', '2024-07-29', '2024-08-11');

INSERT INTO sports_projects (id, name) VALUES
('swimming', '游泳'),
('surfing', '冲浪'),
('kayaking', '皮划艇'),
('diving', '潜水'),
('sailing', '帆船'),
('water-ski', '滑水');

INSERT INTO age_groups (id, name, minAge, maxAge) VALUES
('6-8', '6-8岁', 6, 8),
('9-11', '9-11岁', 9, 11),
('12-14', '12-14岁', 12, 14),
('15-17', '15-17岁', 15, 17),
('18+', '18岁以上', 18, 99);

INSERT INTO coaches (id, name, specialty, level) VALUES
('c001', '张教练', 'swimming', '高级'),
('c002', '李教练', 'surfing', '高级'),
('c003', '王教练', 'kayaking', '中级'),
('c004', '赵教练', 'diving', '高级'),
('c005', '刘教练', 'sailing', '中级'),
('c006', '陈教练', 'water-ski', '高级');

INSERT INTO cancel_reasons (id, name) VALUES
('weather', '天气原因'),
('health', '健康原因'),
('personal', '个人原因'),
('equipment', '装备故障'),
('other', '其他原因');

INSERT INTO equipment_types (id, name, category) VALUES
('life-jacket', '救生衣', '安全装备'),
('surfboard', '冲浪板', '运动装备'),
('kayak', '皮划艇', '运动装备'),
('diving-gear', '潜水装备', '运动装备'),
('sailboat', '帆船', '运动装备'),
('ski-board', '滑水板', '运动装备'),
('goggles', '泳镜', '配件'),
('swim-cap', '泳帽', '配件');

INSERT INTO weather_types (id, name, icon) VALUES
('sunny', '晴天', '☀️'),
('cloudy', '多云', '⛅'),
('rainy', '雨天', '🌧️'),
('stormy', '暴风雨', '⛈️'),
('windy', '大风', '💨');
