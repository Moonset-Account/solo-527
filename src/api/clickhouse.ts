/**
 * ClickHouse SQL 查询模板库
 * 
 * 所有查询遵循统一数据口径：
 * 1. 预约、闸机、签到、取消、违规 五张事实表关联
 * 2. 爽约判定：学生累计爽约次数 > 阈值，才计入爽约率
 * 3. 区域/楼层筛选通过关联 dim_areas 维度表实现
 * 4. 考试周/平日的阈值可以不同
 * 
 * 注意：所有 SQL 中的 {param:Type} 格式会由 ClickHouseClient.applyParams 替换
 */

export interface ClickHouseQuery {
  name: string;
  sql: string;
  description: string;
  params: { name: string; type: string; description: string }[];
}

export const HEATMAP_QUERY: ClickHouseQuery = {
  name: 'heatmap_usage',
  description: '时段热力分析 - 按日期和小时统计区域座位利用率',
  params: [
    { name: 'startDate', type: 'Date', description: '开始日期' },
    { name: 'endDate', type: 'Date', description: '结束日期' },
    { name: 'normalThreshold', type: 'UInt32', description: '平日爽约阈值' },
    { name: 'areaIds', type: 'String', description: '区域ID列表（逗号分隔）' },
    { name: 'floors', type: 'String', description: '楼层列表（逗号分隔）' },
  ],
  sql: `
    WITH
        {normalThreshold:UInt32} AS normal_threshold,
        (SELECT groupArray(tuple(start_date, end_date, no_show_threshold)) 
         FROM library.exam_periods) AS exam_periods
    
    SELECT
        toDate(r.start_time) AS date,
        toHour(r.start_time) AS hour,
        -- 利用率 = 已签到数 / 区域总座位数
        countIf(r.status = 'checked_in') / max(a.total_seats) AS utilization,
        count(*) AS sample_size,
        -- 标记是否闭馆
        max(if(c.date IS NOT NULL, 1, 0)) AS is_closed,
        -- 标记是否考试周
        max(if(arrayExists(ep -> ep.1 <= toDate(r.start_time) AND ep.2 >= toDate(r.start_time), exam_periods), 1, 0)) AS is_exam_week
    FROM library.reservations r
    LEFT JOIN library.dim_areas a ON r.area_id = a.area_id
    LEFT JOIN library.closed_dates c ON toDate(r.start_time) = c.date
    WHERE
        toDate(r.start_time) BETWEEN {startDate:Date} AND {endDate:Date}
        AND (length({areaIds:String}) = 0 OR r.area_id IN ({areaIds:String}))
        AND (length({floors:String}) = 0 OR a.floor IN ({floors:String}))
    GROUP BY date, hour
    ORDER BY date, hour
  `
};

export const AREA_UTILIZATION_QUERY: ClickHouseQuery = {
  name: 'area_utilization',
  description: '区域利用率分析',
  params: [
    { name: 'startDate', type: 'Date', description: '开始日期' },
    { name: 'endDate', type: 'Date', description: '结束日期' },
    { name: 'normalThreshold', type: 'UInt32', description: '平日爽约阈值' },
    { name: 'areaIds', type: 'String', description: '区域ID列表' },
    { name: 'floors', type: 'String', description: '楼层列表' },
  ],
  sql: `
    SELECT
        a.area_id,
        a.area_name,
        a.floor,
        a.total_seats,
        -- 利用率：已签到 / (座位数 * 天数 * 日均开放时段10小时)
        countIf(r.status = 'checked_in') / (a.total_seats * (dateDiff('day', {startDate:Date}, {endDate:Date}) + 1) * 10) AS utilization,
        count(r.reservation_id) AS total_reservations,
        -- 高峰时段
        (SELECT groupArray(hour) FROM (
            SELECT toHour(r2.start_time) AS hour
            FROM library.reservations r2
            WHERE r2.area_id = a.area_id
                AND toDate(r2.start_time) BETWEEN {startDate:Date} AND {endDate:Date}
                AND r2.status = 'checked_in'
            GROUP BY hour
            ORDER BY count(*) DESC
            LIMIT 5
        )) AS peak_hours,
        -- 日均趋势
        (SELECT groupArray(tuple(date, value)) FROM (
            SELECT
                toDate(r3.start_time) AS date,
                countIf(r3.status = 'checked_in') / a.total_seats AS value
            FROM library.reservations r3
            WHERE r3.area_id = a.area_id
                AND toDate(r3.start_time) BETWEEN {startDate:Date} AND {endDate:Date}
            GROUP BY date
            ORDER BY date
        )) AS trend
    FROM library.dim_areas a
    LEFT JOIN library.reservations r
        ON a.area_id = r.area_id
        AND toDate(r.start_time) BETWEEN {startDate:Date} AND {endDate:Date}
    WHERE 1=1
        AND (length({areaIds:String}) = 0 OR a.area_id IN ({areaIds:String}))
        AND (length({floors:String}) = 0 OR a.floor IN ({floors:String}))
    GROUP BY a.area_id, a.area_name, a.floor, a.total_seats
    ORDER BY utilization DESC
  `
};

export const VIOLATION_STATS_QUERY: ClickHouseQuery = {
  name: 'violation_stats',
  description: '违规统计分析 - 爽约率按阈值计算',
  params: [
    { name: 'startDate', type: 'Date', description: '开始日期' },
    { name: 'endDate', type: 'Date', description: '结束日期' },
    { name: 'normalThreshold', type: 'UInt32', description: '平日爽约阈值' },
    { name: 'areaIds', type: 'String', description: '区域ID列表' },
    { name: 'floors', type: 'String', description: '楼层列表' },
  ],
  sql: `
    WITH
        {normalThreshold:UInt32} AS normal_threshold,
        (SELECT groupArray(tuple(start_date, end_date, no_show_threshold)) 
         FROM library.exam_periods) AS exam_periods,
        -- 子查询：每个学生在日期范围内的总爽约次数
        (SELECT 
            groupArray(tuple(student_id, cnt))
         FROM (
            SELECT 
                r.student_id,
                countIf(r.status = 'no_show') AS cnt
            FROM library.reservations r
            LEFT JOIN library.dim_areas a ON r.area_id = a.area_id
            WHERE toDate(r.start_time) BETWEEN {startDate:Date} AND {endDate:Date}
                AND (length({areaIds:String}) = 0 OR r.area_id IN ({areaIds:String}))
                AND (length({floors:String}) = 0 OR a.floor IN ({floors:String}))
            GROUP BY r.student_id
         )) AS student_no_show_counts
    
    SELECT
        toDate(r.start_time) AS date,
        -- 当日适用阈值：考试周取考试周阈值，否则取平日阈值
        if(
            arrayExists(ep -> ep.1 <= toDate(r.start_time) AND ep.2 >= toDate(r.start_time), exam_periods),
            arrayFirst(ep -> ep.1 <= toDate(r.start_time) AND ep.2 >= toDate(r.start_time), exam_periods).3,
            normal_threshold
        ) AS threshold,
        -- 爽约率 = 超过阈值的学生的爽约记录数 / 总预约数
        sum(if(
            arrayExists(s -> s.1 = r.student_id AND s.2 > threshold, student_no_show_counts),
            if(r.status = 'no_show', 1, 0),
            0
        )) / count(r.reservation_id) AS no_show_rate,
        -- 违规总数（忽略状态为ignored的）
        countIf(v.violation_id IS NOT NULL AND v.status != 'ignored') AS total_violations,
        -- 按类型统计
        sumMap([v.violation_type], [if(v.status != 'ignored', 1, 0)]) AS violation_by_type,
        count(r.reservation_id) AS sample_size
    FROM library.reservations r
    LEFT JOIN library.dim_areas a ON r.area_id = a.area_id
    LEFT JOIN library.violations v 
        ON r.reservation_id = v.reservation_id
        AND toDate(v.occur_time) = toDate(r.start_time)
    WHERE
        toDate(r.start_time) BETWEEN {startDate:Date} AND {endDate:Date}
        AND (length({areaIds:String}) = 0 OR r.area_id IN ({areaIds:String}))
        AND (length({floors:String}) = 0 OR a.floor IN ({floors:String}))
    GROUP BY date, threshold
    ORDER BY date
  `
};

export const DASHBOARD_STATS_QUERY: ClickHouseQuery = {
  name: 'dashboard_stats',
  description: '总览仪表盘核心指标 - 使用与违规统计相同的爽约率口径',
  params: [
    { name: 'startDate', type: 'Date', description: '开始日期' },
    { name: 'endDate', type: 'Date', description: '结束日期' },
    { name: 'normalThreshold', type: 'UInt32', description: '平日爽约阈值' },
    { name: 'areaIds', type: 'String', description: '区域ID列表' },
    { name: 'floors', type: 'String', description: '楼层列表' },
  ],
  sql: `
    WITH
        {normalThreshold:UInt32} AS normal_threshold,
        (SELECT groupArray(tuple(start_date, end_date, no_show_threshold)) 
         FROM library.exam_periods) AS exam_periods,
        -- 同一套学生爽约次数统计（与违规分析共用口径）
        (SELECT 
            groupArray(tuple(student_id, cnt))
         FROM (
            SELECT 
                r.student_id,
                countIf(r.status = 'no_show') AS cnt
            FROM library.reservations r
            LEFT JOIN library.dim_areas a ON r.area_id = a.area_id
            WHERE toDate(r.start_time) BETWEEN {startDate:Date} AND {endDate:Date}
                AND (length({areaIds:String}) = 0 OR r.area_id IN ({areaIds:String}))
                AND (length({floors:String}) = 0 OR a.floor IN ({floors:String}))
            GROUP BY r.student_id
         )) AS student_no_show_counts,
        -- 当日阈值
        if(
            arrayExists(ep -> ep.1 <= today() AND ep.2 >= today(), exam_periods),
            arrayFirst(ep -> ep.1 <= today() AND ep.2 >= today(), exam_periods).3,
            normal_threshold
        ) AS today_threshold
    
    SELECT
        -- 今日闸机入馆人次
        (SELECT count(*) FROM library.gate_entries 
         WHERE toDate(entry_time) = today()) AS today_entries,
        -- 今日预约量
        (SELECT count(*) FROM library.reservations r
         LEFT JOIN library.dim_areas a ON r.area_id = a.area_id
         WHERE toDate(r.start_time) = today()
             AND (length({areaIds:String}) = 0 OR r.area_id IN ({areaIds:String}))
             AND (length({floors:String}) = 0 OR a.floor IN ({floors:String}))) AS today_reservations,
        -- 签到率
        (SELECT countIf(status = 'checked_in') / count(*)
         FROM library.reservations r
         LEFT JOIN library.dim_areas a ON r.area_id = a.area_id
         WHERE toDate(r.start_time) BETWEEN {startDate:Date} AND {endDate:Date}
             AND (length({areaIds:String}) = 0 OR r.area_id IN ({areaIds:String}))
             AND (length({floors:String}) = 0 OR a.floor IN ({floors:String}))) AS check_in_rate,
        -- 爽约率（与违规分析同一口径：超过阈值才计入）
        (SELECT
            sum(if(
                arrayExists(s -> s.1 = r2.student_id AND s.2 > today_threshold, student_no_show_counts),
                if(r2.status = 'no_show', 1, 0),
                0
            )) / count(r2.reservation_id)
         FROM library.reservations r2
         LEFT JOIN library.dim_areas a2 ON r2.area_id = a2.area_id
         WHERE toDate(r2.start_time) BETWEEN {startDate:Date} AND {endDate:Date}
             AND (length({areaIds:String}) = 0 OR r2.area_id IN ({areaIds:String}))
             AND (length({floors:String}) = 0 OR a2.floor IN ({floors:String}))) AS no_show_rate,
        -- 近7天每日趋势
        (SELECT
            groupArray(tuple(date_str, entries, reservations))
         FROM (
            SELECT
                formatDateTime(d, '%m-%d') AS date_str,
                (SELECT count(*) FROM library.gate_entries WHERE toDate(entry_time) = d) AS entries,
                (SELECT count(*) 
                 FROM library.reservations r
                 LEFT JOIN library.dim_areas a ON r.area_id = a.area_id
                 WHERE toDate(r.start_time) = d
                     AND (length({areaIds:String}) = 0 OR r.area_id IN ({areaIds:String}))
                     AND (length({floors:String}) = 0 OR a.floor IN ({floors:String}))) AS reservations
            FROM (
                SELECT arrayJoin(arrayMap(i -> today() - 6 + i, range(7))) AS d
            )
            ORDER BY d
         )) AS week_trend,
        -- TOP5 热门区域
        (SELECT
            groupArray(tuple(area_name, utilization))
         FROM (
            SELECT
                a.area_name,
                countIf(r.status = 'checked_in') / a.total_seats AS utilization
            FROM library.reservations r
            LEFT JOIN library.dim_areas a ON r.area_id = a.area_id
            WHERE toDate(r.start_time) BETWEEN {startDate:Date} AND {endDate:Date}
                AND (length({areaIds:String}) = 0 OR r.area_id IN ({areaIds:String}))
                AND (length({floors:String}) = 0 OR a.floor IN ({floors:String}))
            GROUP BY a.area_id, a.area_name, a.total_seats
            ORDER BY utilization DESC
            LIMIT 5
         )) AS top_areas
  `
};

export const RAW_RECORDS_QUERY: ClickHouseQuery = {
  name: 'raw_records',
  description: '下钻查询原始记录',
  params: [
    { name: 'date', type: 'Date', description: '日期' },
    { name: 'hour', type: 'UInt32', description: '小时' },
    { name: 'studentId', type: 'String', description: '学生ID（可选）' },
  ],
  sql: `
    SELECT
        r.reservation_id,
        r.student_id,
        r.student_name,
        r.area_id,
        r.seat_id,
        r.start_time,
        r.end_time,
        r.status,
        r.created_at,
        'reservation' AS record_type,
        NULL AS violation_type,
        NULL AS occur_time
    FROM library.reservations r
    WHERE
        toDate(r.start_time) = {date:Date}
        AND toHour(r.start_time) = {hour:UInt32}
        AND (length({studentId:String}) = 0 OR r.student_id = {studentId:String})
    
    UNION ALL
    
    SELECT
        v.reservation_id,
        v.student_id,
        v.student_name,
        r.area_id,
        NULL AS seat_id,
        NULL AS start_time,
        NULL AS end_time,
        v.status,
        NULL AS created_at,
        'violation' AS record_type,
        v.violation_type,
        v.occur_time
    FROM library.violations v
    LEFT JOIN library.reservations r ON v.reservation_id = r.reservation_id
    WHERE
        toDate(v.occur_time) = {date:Date}
        AND toHour(v.occur_time) = {hour:UInt32}
        AND (length({studentId:String}) = 0 OR v.student_id = {studentId:String})
    
    ORDER BY record_type DESC
    LIMIT 50
  `
};

export const VIOLATIONS_QUERY: ClickHouseQuery = {
  name: 'violations_list',
  description: '违规记录列表查询',
  params: [
    { name: 'startDate', type: 'Date', description: '开始日期' },
    { name: 'endDate', type: 'Date', description: '结束日期' },
    { name: 'areaIds', type: 'String', description: '区域ID列表' },
    { name: 'floors', type: 'String', description: '楼层列表' },
    { name: 'studentId', type: 'String', description: '学生ID（可选）' },
  ],
  sql: `
    SELECT
        v.violation_id,
        v.student_id,
        v.student_name,
        v.reservation_id,
        v.violation_type,
        v.occur_time,
        v.status,
        v.remark
    FROM library.violations v
    LEFT JOIN library.reservations r ON v.reservation_id = r.reservation_id
    LEFT JOIN library.dim_areas a ON r.area_id = a.area_id
    WHERE
        toDate(v.occur_time) BETWEEN {startDate:Date} AND {endDate:Date}
        AND (length({studentId:String}) = 0 OR v.student_id = {studentId:String})
        AND (length({areaIds:String}) = 0 OR r.area_id IN ({areaIds:String}))
        AND (length({floors:String}) = 0 OR a.floor IN ({floors:String}))
    ORDER BY v.occur_time DESC
    LIMIT 100
  `
};

export const STUDENT_RESERVATIONS_QUERY: ClickHouseQuery = {
  name: 'student_reservations',
  description: '学生个人预约记录查询',
  params: [
    { name: 'studentId', type: 'String', description: '学生ID' },
    { name: 'startDate', type: 'Date', description: '开始日期' },
    { name: 'endDate', type: 'Date', description: '结束日期' },
  ],
  sql: `
    SELECT
        r.reservation_id,
        r.student_id,
        r.student_name,
        r.area_id,
        r.seat_id,
        r.start_time,
        r.end_time,
        r.status,
        r.created_at
    FROM library.reservations r
    WHERE
        r.student_id = {studentId:String}
        AND toDate(r.start_time) BETWEEN {startDate:Date} AND {endDate:Date}
    ORDER BY r.start_time DESC
    LIMIT 100
  `
};

export const CLICKHOUSE_TABLES = {
  reservations: {
    name: 'library.reservations',
    engine: 'MergeTree',
    primaryKey: 'reservation_id',
    columns: [
      { name: 'reservation_id', type: 'String', desc: '预约编号' },
      { name: 'student_id', type: 'String', desc: '学号' },
      { name: 'student_name', type: 'String', desc: '学生姓名' },
      { name: 'area_id', type: 'String', desc: '区域ID' },
      { name: 'seat_id', type: 'String', desc: '座位ID' },
      { name: 'start_time', type: 'DateTime', desc: '预约开始时间' },
      { name: 'end_time', type: 'DateTime', desc: '预约结束时间' },
      { name: 'status', type: "Enum('reserved' = 1, 'checked_in' = 2, 'cancelled' = 3, 'no_show' = 4)", desc: '预约状态' },
      { name: 'created_at', type: 'DateTime', desc: '创建时间' },
    ],
  },
  gate_entries: {
    name: 'library.gate_entries',
    engine: 'MergeTree',
    primaryKey: 'entry_id',
    columns: [
      { name: 'entry_id', type: 'String', desc: '闸机记录ID' },
      { name: 'student_id', type: 'String', desc: '学号' },
      { name: 'entry_time', type: 'DateTime', desc: '入馆时间' },
      { name: 'gate_id', type: 'String', desc: '闸机编号' },
    ],
  },
  seat_checkins: {
    name: 'library.seat_checkins',
    engine: 'MergeTree',
    primaryKey: 'checkin_id',
    columns: [
      { name: 'checkin_id', type: 'String', desc: '签到ID' },
      { name: 'reservation_id', type: 'String', desc: '预约编号' },
      { name: 'student_id', type: 'String', desc: '学号' },
      { name: 'checkin_time', type: 'DateTime', desc: '签到时间' },
      { name: 'source', type: "Enum('seat' = 1, 'gate' = 2)", desc: '签到来源' },
    ],
  },
  violations: {
    name: 'library.violations',
    engine: 'ReplacingMergeTree(processed_at)',
    primaryKey: 'violation_id',
    columns: [
      { name: 'violation_id', type: 'String', desc: '违规ID' },
      { name: 'student_id', type: 'String', desc: '学号' },
      { name: 'student_name', type: 'String', desc: '学生姓名' },
      { name: 'reservation_id', type: 'String', desc: '关联预约编号' },
      { name: 'violation_type', type: "Enum('no_show' = 1, 'late_checkin' = 2, 'early_leave' = 3, 'occupancy_timeout' = 4)", desc: '违规类型' },
      { name: 'occur_time', type: 'DateTime', desc: '发生时间' },
      { name: 'status', type: "Enum('pending' = 1, 'processed' = 2, 'ignored' = 3)", desc: '处理状态' },
      { name: 'remark', type: 'String', desc: '处理备注' },
      { name: 'processed_by', type: 'String', desc: '处理人' },
      { name: 'processed_at', type: 'DateTime', desc: '处理时间' },
    ],
  },
  closed_dates: {
    name: 'library.closed_dates',
    engine: 'MergeTree',
    primaryKey: 'date',
    columns: [
      { name: 'date', type: 'Date', desc: '闭馆日期' },
      { name: 'reason', type: 'String', desc: '闭馆原因' },
    ],
  },
  exam_periods: {
    name: 'library.exam_periods',
    engine: 'MergeTree',
    primaryKey: 'start_date,end_date',
    columns: [
      { name: 'name', type: 'String', desc: '考试周期名称' },
      { name: 'start_date', type: 'Date', desc: '开始日期' },
      { name: 'end_date', type: 'Date', desc: '结束日期' },
      { name: 'no_show_threshold', type: 'UInt32', desc: '爽约阈值' },
    ],
  },
  dim_areas: {
    name: 'library.dim_areas',
    engine: 'ReplacingMergeTree()',
    primaryKey: 'area_id',
    columns: [
      { name: 'area_id', type: 'String', desc: '区域ID' },
      { name: 'area_name', type: 'String', desc: '区域名称' },
      { name: 'floor', type: 'UInt8', desc: '楼层' },
      { name: 'total_seats', type: 'UInt32', desc: '总座位数' },
      { name: 'description', type: 'String', desc: '描述' },
    ],
  },
};

export default {
  HEATMAP_QUERY,
  AREA_UTILIZATION_QUERY,
  VIOLATION_STATS_QUERY,
  DASHBOARD_STATS_QUERY,
  RAW_RECORDS_QUERY,
  VIOLATIONS_QUERY,
  STUDENT_RESERVATIONS_QUERY,
  CLICKHOUSE_TABLES,
};
