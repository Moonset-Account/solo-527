import { pool, getClient } from "../app/config/db.server";
import { cacheSet, CACHE_TTL, getCacheKey } from "../app/config/redis.server";
import { SCORE_BUCKETS, THRESHOLDS } from "../app/metrics/definitions";

interface FilterParams {
  department_id?: number;
  course_id?: number;
  cohort_id?: number;
  instructor_id?: number;
  position?: string;
  start_date?: string;
  end_date?: string;
}

async function buildWhereClause(filters: FilterParams): Promise<{ clause: string; params: any[] }> {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (filters.department_id) {
    conditions.push(`u.department_id = $${paramIndex}`);
    params.push(filters.department_id);
    paramIndex++;
  }
  if (filters.course_id) {
    conditions.push(`co.course_id = $${paramIndex}`);
    params.push(filters.course_id);
    paramIndex++;
  }
  if (filters.cohort_id) {
    conditions.push(`e.cohort_id = $${paramIndex}`);
    params.push(filters.cohort_id);
    paramIndex++;
  }
  if (filters.instructor_id) {
    conditions.push(`co.instructor_id = $${paramIndex}`);
    params.push(filters.instructor_id);
    paramIndex++;
  }
  if (filters.position) {
    conditions.push(`u.position = $${paramIndex}`);
    params.push(filters.position);
    paramIndex++;
  }
  if (filters.start_date) {
    conditions.push(`e.enrolled_at >= $${paramIndex}`);
    params.push(filters.start_date);
    paramIndex++;
  }
  if (filters.end_date) {
    conditions.push(`e.enrolled_at <= $${paramIndex}`);
    params.push(filters.end_date);
    paramIndex++;
  }

  return {
    clause: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
    params,
  };
}

export async function getFunnelMetrics(filters: FilterParams = {}) {
  const { clause, params } = await buildWhereClause(filters);

  const sql = `
    WITH base AS (
      SELECT
        COUNT(DISTINCT e.id) as total_enrollments,
        COUNT(DISTINCT CASE WHEN EXISTS (
          SELECT 1 FROM checkins c WHERE c.enrollment_id = e.id AND c.status = 'present'
        ) THEN e.id END) as checked_in,
        COUNT(DISTINCT CASE WHEN lp.completion_status = 'completed' THEN e.id END) as completed_course,
        COUNT(DISTINCT CASE WHEN qa_first.passed = true THEN e.id END) as quiz_first_pass,
        COUNT(DISTINCT CASE WHEN qa_retake.passed = true AND qa_first.passed = false THEN e.id END) as quiz_retake_pass,
        COUNT(DISTINCT CASE WHEN qa_first.passed = true OR qa_retake.passed = true THEN e.id END) as quiz_any_pass,
        COUNT(DISTINCT cert.id) as certificates_issued
      FROM enrollments e
      JOIN users u ON e.user_id = u.id
      JOIN cohorts co ON e.cohort_id = co.id
      LEFT JOIN learning_progress lp ON e.id = lp.enrollment_id
      LEFT JOIN quiz_attempts qa_first ON e.id = qa_first.enrollment_id AND qa_first.attempt_number = 1
      LEFT JOIN quiz_attempts qa_retake ON e.id = qa_retake.enrollment_id AND qa_retake.attempt_number > 1
      LEFT JOIN certificates cert ON e.id = cert.enrollment_id
      ${clause}
    )
    SELECT
      total_enrollments,
      checked_in,
      completed_course,
      quiz_first_pass,
      quiz_retake_pass,
      quiz_any_pass,
      certificates_issued,
      ROUND((checked_in::decimal / NULLIF(total_enrollments, 0)) * 100, 2) as checkin_rate,
      ROUND((completed_course::decimal / NULLIF(total_enrollments, 0)) * 100, 2) as completion_rate,
      ROUND((quiz_first_pass::decimal / NULLIF(total_enrollments, 0)) * 100, 2) as first_pass_rate,
      ROUND((quiz_retake_pass::decimal / NULLIF(total_enrollments, 0)) * 100, 2) as retake_pass_rate,
      ROUND((quiz_any_pass::decimal / NULLIF(total_enrollments, 0)) * 100, 2) as overall_pass_rate,
      ROUND((certificates_issued::decimal / NULLIF(total_enrollments, 0)) * 100, 2) as certificate_rate
    FROM base
  `;

  const res = await pool.query(sql, params);
  return res.rows[0];
}

export async function getQuizScoreDistribution(filters: FilterParams = {}) {
  const { clause, params } = await buildWhereClause(filters);

  const bucketCases = SCORE_BUCKETS.map(
    (bucket, i) => `COUNT(DISTINCT CASE WHEN qa.score BETWEEN ${bucket.min} AND ${bucket.max} THEN e.id END) as bucket_${i}`
  ).join(",");

  const sql = `
    SELECT
      ${bucketCases}
    FROM enrollments e
    JOIN users u ON e.user_id = u.id
    JOIN cohorts co ON e.cohort_id = co.id
    JOIN (
      SELECT enrollment_id, MAX(score) as score
      FROM quiz_attempts
      GROUP BY enrollment_id
    ) qa ON e.id = qa.enrollment_id
    ${clause}
  `;

  const res = await pool.query(sql, params);
  const row = res.rows[0];

  return SCORE_BUCKETS.map((bucket, i) => ({
    label: bucket.label,
    min: bucket.min,
    max: bucket.max,
    count: parseInt(row[`bucket_${i}`]) || 0,
  }));
}

export async function getDepartmentComparison(filters: FilterParams = {}) {
  const { clause, params } = await buildWhereClause(filters);
  const deptFilterIndex = clause.indexOf("u.department_id");
  let finalParams = params;
  let finalClause = clause;

  if (deptFilterIndex >= 0) {
    finalClause = "";
    const deptParamMatch = clause.match(/u\.department_id = \$(\d+)/);
    if (deptParamMatch) {
      const paramIdx = parseInt(deptParamMatch[1]) - 1;
      finalParams = params.filter((_, i) => i !== paramIdx);
    }
  }

  const sql = `
    SELECT
      d.id as department_id,
      d.name as department_name,
      COUNT(DISTINCT e.id) as total_enrollments,
      COUNT(DISTINCT CASE WHEN lp.completion_status = 'completed' THEN e.id END) as completed_count,
      ROUND(
        (COUNT(DISTINCT CASE WHEN lp.completion_status = 'completed' THEN e.id END)::decimal /
        NULLIF(COUNT(DISTINCT e.id), 0)) * 100, 2
      ) as completion_rate,
      ROUND(
        (COUNT(DISTINCT CASE WHEN qa_first.passed = true THEN e.id END)::decimal /
        NULLIF(COUNT(DISTINCT e.id), 0)) * 100, 2
      ) as first_pass_rate,
      ROUND(
        (COUNT(DISTINCT CASE WHEN cert.id IS NOT NULL THEN e.id END)::decimal /
        NULLIF(COUNT(DISTINCT e.id), 0)) * 100, 2
      ) as certificate_rate
    FROM departments d
    JOIN users u ON u.department_id = d.id
    JOIN enrollments e ON e.user_id = u.id
    JOIN cohorts co ON e.cohort_id = co.id
    LEFT JOIN learning_progress lp ON e.id = lp.enrollment_id
    LEFT JOIN quiz_attempts qa_first ON e.id = qa_first.enrollment_id AND qa_first.attempt_number = 1
    LEFT JOIN certificates cert ON e.id = cert.enrollment_id
    ${finalClause}
    GROUP BY d.id, d.name
    ORDER BY completion_rate DESC
  `;

  const res = await pool.query(sql, finalParams);
  return res.rows;
}

export async function getCertificateTrend(filters: FilterParams = {}) {
  const { clause, params } = await buildWhereClause(filters);

  const sql = `
    SELECT
      DATE_TRUNC('day', cert.issued_at)::date as issue_date,
      COUNT(DISTINCT cert.id) as count,
      COUNT(DISTINCT CASE WHEN qa_first.attempt_number = 1 THEN cert.id END) as first_pass_count,
      COUNT(DISTINCT CASE WHEN qa_first.attempt_number > 1 OR qa_first.attempt_number IS NULL THEN cert.id END) as retake_pass_count
    FROM certificates cert
    JOIN enrollments e ON cert.enrollment_id = e.id
    JOIN users u ON e.user_id = u.id
    JOIN cohorts co ON e.cohort_id = co.id
    LEFT JOIN quiz_attempts qa_first ON e.id = qa_first.enrollment_id AND qa_first.attempt_number = 1
    ${clause}
    GROUP BY DATE_TRUNC('day', cert.issued_at)::date
    ORDER BY issue_date
  `;

  const res = await pool.query(sql, params);
  return res.rows;
}

export async function getAnomalies(filters: FilterParams = {}) {
  const anomalies: any[] = [];

  const lowCompletionSql = `
    SELECT
      'low_completion' as type,
      co.name as entity_name,
      c.name as course_name,
      d.name as department_name,
      ROUND(
        (COUNT(DISTINCT CASE WHEN lp.completion_status = 'completed' THEN e.id END)::decimal /
        NULLIF(COUNT(DISTINCT e.id), 0)) * 100, 2
      ) as value,
      ${THRESHOLDS.LOW_COMPLETION} as threshold,
      '完成率低于阈值' as description
    FROM enrollments e
    JOIN cohorts co ON e.cohort_id = co.id
    JOIN courses c ON co.course_id = c.id
    JOIN users u ON e.user_id = u.id
    JOIN departments d ON u.department_id = d.id
    LEFT JOIN learning_progress lp ON e.id = lp.enrollment_id
    GROUP BY co.id, co.name, c.name, d.name
    HAVING ROUND(
      (COUNT(DISTINCT CASE WHEN lp.completion_status = 'completed' THEN e.id END)::decimal /
      NULLIF(COUNT(DISTINCT e.id), 0)) * 100, 2
    ) < ${THRESHOLDS.LOW_COMPLETION}
    ORDER BY value ASC
    LIMIT 10
  `;

  const lowCompletionRes = await pool.query(lowCompletionSql);
  anomalies.push(...lowCompletionRes.rows.map(r => ({ ...r, severity: "high" })));

  const highNoShowSql = `
    SELECT
      'high_no_show' as type,
      co.name as entity_name,
      c.name as course_name,
      i.name as instructor_name,
      ROUND(
        (1 - COUNT(DISTINCT CASE WHEN EXISTS (
          SELECT 1 FROM checkins ch WHERE ch.enrollment_id = e.id AND ch.status = 'present'
        ) THEN e.id END)::decimal /
        NULLIF(COUNT(DISTINCT e.id), 0)) * 100, 2
      ) as value,
      ${THRESHOLDS.HIGH_NO_SHOW} as threshold,
      '未签到率高于阈值' as description
    FROM enrollments e
    JOIN cohorts co ON e.cohort_id = co.id
    JOIN courses c ON co.course_id = c.id
    JOIN instructors i ON co.instructor_id = i.id
    GROUP BY co.id, co.name, c.name, i.name
    HAVING ROUND(
      (1 - COUNT(DISTINCT CASE WHEN EXISTS (
        SELECT 1 FROM checkins ch WHERE ch.enrollment_id = e.id AND ch.status = 'present'
      ) THEN e.id END)::decimal /
      NULLIF(COUNT(DISTINCT e.id), 0)) * 100, 2
    ) > ${THRESHOLDS.HIGH_NO_SHOW}
    ORDER BY value DESC
    LIMIT 10
  `;

  const highNoShowRes = await pool.query(highNoShowSql);
  anomalies.push(...highNoShowRes.rows.map(r => ({ ...r, severity: "medium" })));

  const highRetakeSql = `
    WITH pass_stats AS (
      SELECT
        co.name as entity_name,
        c.name as course_name,
        i.name as instructor_name,
        COUNT(DISTINCT CASE WHEN qa_first.passed = true THEN e.id END) as first_pass,
        COUNT(DISTINCT CASE WHEN qa_retake.passed = true AND qa_first.passed = false THEN e.id END) as retake_pass
      FROM enrollments e
      JOIN cohorts co ON e.cohort_id = co.id
      JOIN courses c ON co.course_id = c.id
      JOIN instructors i ON co.instructor_id = i.id
      LEFT JOIN quiz_attempts qa_first ON e.id = qa_first.enrollment_id AND qa_first.attempt_number = 1
      LEFT JOIN quiz_attempts qa_retake ON e.id = qa_retake.enrollment_id AND qa_retake.attempt_number > 1
      GROUP BY co.id, co.name, c.name, i.name
    )
    SELECT
      'high_retake_rate' as type,
      entity_name,
      course_name,
      instructor_name,
      ROUND((retake_pass::decimal / NULLIF(first_pass + retake_pass, 0)) * 100, 2) as value,
      ${THRESHOLDS.HIGH_RETAKE_RATE} as threshold,
      '补考率高于阈值' as description,
      'medium' as severity
    FROM pass_stats
    WHERE ROUND((retake_pass::decimal / NULLIF(first_pass + retake_pass, 0)) * 100, 2) > ${THRESHOLDS.HIGH_RETAKE_RATE}
    ORDER BY value DESC
    LIMIT 10
  `;

  const highRetakeRes = await pool.query(highRetakeSql);
  anomalies.push(...highRetakeRes.rows);

  return anomalies;
}

export async function getDimensionOptions() {
  const [departments, courses, cohorts, instructors, positions] = await Promise.all([
    pool.query("SELECT id, name FROM departments ORDER BY name"),
    pool.query("SELECT id, code, name FROM courses ORDER BY name"),
    pool.query("SELECT id, name FROM cohorts ORDER BY start_date DESC"),
    pool.query("SELECT id, name FROM instructors ORDER BY name"),
    pool.query("SELECT DISTINCT position FROM users WHERE position IS NOT NULL ORDER BY position"),
  ]);

  return {
    departments: departments.rows,
    courses: courses.rows,
    cohorts: cohorts.rows,
    instructors: instructors.rows,
    positions: positions.rows.map(r => r.position),
  };
}

async function aggregateAll() {
  console.log("Aggregating metrics...");

  try {
    const filters = {};
    const cacheKey = getCacheKey("metrics:all", filters);

    const [funnel, scoreDist, deptComp, certTrend, anomalies, dimensions] = await Promise.all([
      getFunnelMetrics(filters),
      getQuizScoreDistribution(filters),
      getDepartmentComparison(filters),
      getCertificateTrend(filters),
      getAnomalies(filters),
      getDimensionOptions(),
    ]);

    const aggregated = {
      funnel,
      scoreDistribution: scoreDist,
      departmentComparison: deptComp,
      certificateTrend: certTrend,
      anomalies,
      dimensions,
      aggregatedAt: new Date().toISOString(),
    };

    await cacheSet(cacheKey, aggregated, CACHE_TTL.LONG);

    console.log("Metrics aggregated and cached successfully!");
    console.log("\nSummary:");
    console.log(`- Total enrollments: ${funnel.total_enrollments}`);
    console.log(`- Completion rate: ${funnel.completion_rate}%`);
    console.log(`- Certificate rate: ${funnel.certificate_rate}%`);
    console.log(`- Anomalies found: ${anomalies.length}`);
    console.log(`- Departments: ${dimensions.departments.length}`);
    console.log(`- Courses: ${dimensions.courses.length}`);
  } catch (err) {
    console.error("Aggregation failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (process.argv[1]?.includes("aggregate-metrics")) {
  aggregateAll();
}
