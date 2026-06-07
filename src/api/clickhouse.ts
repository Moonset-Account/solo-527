/**
 * ClickHouse 查询适配器
 * 
 * 本文件定义了图书馆座位分析系统的所有 ClickHouse SQL 查询模板，
 * 确保所有统计指标使用统一的数据口径。
 * 
 * 数据来源表：
 * - library.reservations     - 预约记录表
 * - library.gate_entries     - 闸机入馆记录表
 * - library.seat_checkins    - 座位签到记录表
 * - library.violations       - 违规记录表
 * - library.closed_dates     - 临时闭馆日历表
 * - library.exam_periods     - 考试周期配置表
 * - library.dim_areas        - 区域维度表
 */

export interface ClickHouseQuery {
  name: string;
  sql: string;
  description: string;
}

export const HEATMAP_QUERY: ClickHouseQuery = {
  name: 'heatmap_usage',
  description: '时段热力分析 - 按日期和小时统计区域座位利用率',
  sql: `
    SELECT
        toDate(r.start_time) AS date,
        toHour(r.start_time) AS hour,
        -- 利用率 = 实际签到数 / 区域总座位数
        countIf(r.status = 'checked_in') / max(a.total_seats) AS utilization,
        count(*) AS sample_size,
        -- 标记是否闭馆
        max(if(c.date IS NOT NULL, 1, 0)) AS is_closed,
        -- 标记是否考试周
        max(if(e.start_date IS NOT NULL, 1, 0)) AS is_exam_week
    FROM library.reservations r
    LEFT JOIN library.dim_areas a ON r.area_id = a.area_id
    LEFT JOIN library.closed_dates c ON toDate(r.start_time) = c.date
    LEFT JOIN library.exam_periods e 
        ON toDate(r.start_time) >= e.start_date 
        AND toDate(r.start_time) <= e.end_date
    WHERE
        toDate(r.start_time) BETWEEN {startDate:Date} AND {endDate:Date}
        {areaFilter:String}
        {floorFilter:String}
    GROUP BY date, hour
    ORDER BY date, hour
  `
};

export const AREA_UTILIZATION_QUERY: ClickHouseQuery = {
  name: 'area_utilization',
  description: '区域利用率分析 - 统计各区域座位利用率',
  sql: `
    SELECT
        a.area_id,
        a.area_name,
        a.floor,
        a.total_seats,
        -- 统一口径：已签到预约数 / (座位数 * 天数 * 日均开放时段)
        countIf(r.status = 'checked_in') / (a.total_seats * dateDiff('day', {startDate:Date}, {endDate:Date}) + 1) / 10 AS utilization,
        count(r.reservation_id) AS total_reservations,
        -- 高峰时段（按小时签到量排序取前5）
        groupArray(top5_hours.hour) AS peak_hours,
        -- 日均趋势
        groupArray(trend_data) AS trend
    FROM library.dim_areas a
    LEFT JOIN library.reservations r 
        ON a.area_id = r.area_id
        AND toDate(r.start_time) BETWEEN {startDate:Date} AND {endDate:Date}
    CROSS JOIN (
        SELECT hour
        FROM (
            SELECT 
                toHour(r2.start_time) AS hour,
                countIf(r2.status = 'checked_in') AS cnt
            FROM library.reservations r2
            WHERE r2.area_id = a.area_id
                AND toDate(r2.start_time) BETWEEN {startDate:Date} AND {endDate:Date}
            GROUP BY hour
            ORDER BY cnt DESC
            LIMIT 5
        )
    ) AS top5_hours
    ARRAY JOIN (
        SELECT 
            groupArray(
                tuple(
                    toDate(r3.start_time) AS date,
                    countIf(r3.status = 'checked_in') / a.total_seats AS value
                )
            ) AS trend_data
        FROM library.reservations r3
        WHERE r3.area_id = a.area_id
            AND toDate(r3.start_time) BETWEEN {startDate:Date} AND {endDate:Date}
        GROUP BY toDate(r3.start_time)
        ORDER BY date
    )
    WHERE 1=1
        {areaFilter:String}
        {floorFilter:String}
    GROUP BY a.area_id, a.area_name, a.floor, a.total_seats
    ORDER BY utilization DESC
  `
};

export const VIOLATION_STATS_QUERY: ClickHouseQuery = {
  name: 'violation_stats',
  description: '违规统计分析 - 爽约率、违规类型分布',
  sql: `
    SELECT
        toDate(v.occur_time) AS date,
        -- 爽约率 = 爽约记录数 / 总预约数（使用关联的预约表统计）
        countIf(v.violation_type = 'no_show') / max(reservation_stats.total_reservations) AS no_show_rate,
        count(v.violation_id) AS total_violations,
        -- 按类型统计
        sumMap([v.violation_type], [1]) AS violation_by_type,
        max(reservation_stats.total_reservations) AS sample_size
    FROM library.violations v
    -- 关联预约表以支持区域和楼层筛选
    LEFT JOIN library.reservations r ON v.reservation_id = r.reservation_id
    LEFT JOIN library.dim_areas a ON r.area_id = a.area_id
    CROSS JOIN (
        SELECT
            toDate(r2.start_time) AS d,
            count(*) AS total_reservations
        FROM library.reservations r2
        LEFT JOIN library.dim_areas a2 ON r2.area_id = a2.area_id
        WHERE toDate(r2.start_time) BETWEEN {startDate:Date} AND {endDate:Date}
            {areaFilter:String}
            {floorFilter:String}
        GROUP BY d
    ) AS reservation_stats ON reservation_stats.d = toDate(v.occur_time)
    WHERE
        toDate(v.occur_time) BETWEEN {startDate:Date} AND {endDate:Date}
        {areaFilter:String}
        {floorFilter:String}
    GROUP BY date
    ORDER BY date
  `
};

export const DASHBOARD_STATS_QUERY: ClickHouseQuery = {
  name: 'dashboard_stats',
  description: '总览仪表盘核心指标',
  sql: `
    WITH
        -- 今日闸机入馆人次
        (SELECT count(*) FROM library.gate_entries 
         WHERE toDate(entry_time) = today()
         {areaFilter:String}) AS today_entries,
        -- 今日预约量
        (SELECT count(*) FROM library.reservations
         WHERE toDate(start_time) = today()
         {areaFilter:String}
         {floorFilter:String}) AS today_reservations,
        -- 近7天签到率
        (SELECT countIf(status = 'checked_in') / count(*) 
         FROM library.reservations
         WHERE toDate(start_time) BETWEEN today() - 6 AND today()
         {areaFilter:String}
         {floorFilter:String}) AS check_in_rate,
        -- 近7天爽约率（考虑阈值）
        (SELECT 
            countIf(status = 'no_show') / count(*)
         FROM library.reservations r
         LEFT JOIN library.exam_periods e 
             ON toDate(r.start_time) >= e.start_date AND toDate(r.start_time) <= e.end_date
         WHERE toDate(r.start_time) BETWEEN today() - 6 AND today()
             {areaFilter:String}
             {floorFilter:String}
             -- 爽约判定：未签到且未取消，超过阈值记录
             AND r.status = 'no_show'
        ) AS no_show_rate,
        -- 近7天每日趋势
        (SELECT
            groupArray(
                tuple(
                    formatDateTime(d, '%m-%d') AS date,
                    entries AS entries,
                    reservations AS reservations
                )
            )
         FROM (
             SELECT
                 toDate(entry_time) AS d,
                 count(*) AS entries,
                 0 AS reservations
             FROM library.gate_entries
             WHERE toDate(entry_time) BETWEEN today() - 6 AND today()
             GROUP BY d
             UNION ALL
             SELECT
                 toDate(start_time) AS d,
                 0 AS entries,
                 count(*) AS reservations
             FROM library.reservations
             WHERE toDate(start_time) BETWEEN today() - 6 AND today()
                 {areaFilter:String}
                 {floorFilter:String}
             GROUP BY d
         )
         GROUP BY d
         ORDER BY d) AS week_trend,
        -- TOP5 热门区域
        (SELECT
            groupArray(tuple(area_name, utilization))
         FROM (
             SELECT
                 a.area_name,
                 countIf(r.status = 'checked_in') / a.total_seats AS utilization
             FROM library.reservations r
             LEFT JOIN library.dim_areas a ON r.area_id = a.area_id
             WHERE toDate(r.start_time) BETWEEN today() - 6 AND today()
                 {areaFilter:String}
                 {floorFilter:String}
             GROUP BY a.area_id, a.area_name, a.total_seats
             ORDER BY utilization DESC
             LIMIT 5
         )) AS top_areas
    SELECT
        today_entries,
        today_reservations,
        check_in_rate,
        no_show_rate,
        week_trend,
        top_areas
  `
};

export const RAW_RECORDS_QUERY: ClickHouseQuery = {
  name: 'raw_records',
  description: '下钻查询原始记录',
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
        {studentFilter:String}
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
        {studentFilter:String}
    ORDER BY record_type DESC
    LIMIT 50
  `
};

export const STUDENT_RESERVATIONS_QUERY: ClickHouseQuery = {
  name: 'student_reservations',
  description: '学生个人预约记录查询',
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

export const STUDENT_VIOLATIONS_QUERY: ClickHouseQuery = {
  name: 'student_violations',
  description: '学生个人违规记录查询',
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
    WHERE
        v.student_id = {studentId:String}
        AND toDate(v.occur_time) BETWEEN {startDate:Date} AND {endDate:Date}
    ORDER BY v.occur_time DESC
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
};

export function buildFilterClause(
  areas?: string[],
  floors?: number[]
): { areaFilter: string; floorFilter: string } {
  let areaFilter = '';
  let floorFilter = '';
  
  if (areas && areas.length > 0) {
    const inClause = areas.map(a => `'${a}'`).join(', ');
    areaFilter = `AND r.area_id IN (${inClause})`;
  }
  
  if (floors && floors.length > 0) {
    const inClause = floors.join(', ');
    floorFilter = `AND a.floor IN (${inClause})`;
  }
  
  return { areaFilter, floorFilter };
}

export default {
  HEATMAP_QUERY,
  AREA_UTILIZATION_QUERY,
  VIOLATION_STATS_QUERY,
  DASHBOARD_STATS_QUERY,
  RAW_RECORDS_QUERY,
  STUDENT_RESERVATIONS_QUERY,
  STUDENT_VIOLATIONS_QUERY,
  CLICKHOUSE_TABLES,
  buildFilterClause,
};
