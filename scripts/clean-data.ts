import { pool, getClient } from "../app/config/db.server";

interface CleanRule {
  name: string;
  description: string;
  sql: string;
}

const CLEAN_RULES: CleanRule[] = [
  {
    name: "remove_duplicate_enrollments",
    description: "删除重复的报名记录",
    sql: `
      DELETE FROM enrollments
      WHERE id IN (
        SELECT id FROM (
          SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id, cohort_id ORDER BY enrolled_at DESC) as rn
          FROM enrollments
        ) t WHERE rn > 1
      )
    `,
  },
  {
    name: "fix_checkin_status",
    description: "根据签到时间修正签到状态",
    sql: `
      UPDATE checkins
      SET status = CASE
        WHEN checkin_time IS NOT NULL THEN 'present'
        ELSE 'absent'
      END
      WHERE status != CASE
        WHEN checkin_time IS NOT NULL THEN 'present'
        ELSE 'absent'
      END
    `,
  },
  {
    name: "normalize_progress_percent",
    description: "标准化进度百分比在0-100之间",
    sql: `
      UPDATE learning_progress
      SET progress_percent = CASE
        WHEN progress_percent < 0 THEN 0
        WHEN progress_percent > 100 THEN 100
        ELSE progress_percent
      END
      WHERE progress_percent < 0 OR progress_percent > 100
    `,
  },
  {
    name: "update_completion_status_from_progress",
    description: "根据进度百分比更新完成状态",
    sql: `
      UPDATE learning_progress
      SET completion_status = CASE
        WHEN progress_percent = 100 THEN 'completed'
        WHEN progress_percent > 0 THEN 'in_progress'
        ELSE 'not_started'
      END,
      completed_at = CASE
        WHEN progress_percent = 100 AND completed_at IS NULL THEN NOW()
        ELSE completed_at
      END
    `,
  },
  {
    name: "normalize_quiz_scores",
    description: "标准化测验分数在0-100之间",
    sql: `
      UPDATE quiz_attempts
      SET score = CASE
        WHEN score < 0 THEN 0
        WHEN score > 100 THEN 100
        ELSE score
      END
      WHERE score < 0 OR score > 100
    `,
  },
  {
    name: "update_quiz_passed_status",
    description: "根据分数和及格线更新通过状态",
    sql: `
      UPDATE quiz_attempts qa
      SET passed = qa.score >= c.pass_score
      FROM enrollments e
      JOIN cohorts co ON e.cohort_id = co.id
      JOIN courses c ON co.course_id = c.id
      WHERE qa.enrollment_id = e.id
        AND qa.passed != (qa.score >= c.pass_score)
    `,
  },
  {
    name: "remove_invalid_certificates",
    description: "删除未完成课程或未通过测验的证书",
    sql: `
      DELETE FROM certificates cert
      USING enrollments e
      LEFT JOIN learning_progress lp ON e.id = lp.enrollment_id
      WHERE cert.enrollment_id = e.id
        AND (lp.completion_status != 'completed'
          OR NOT EXISTS (
            SELECT 1 FROM quiz_attempts qa
            WHERE qa.enrollment_id = e.id AND qa.passed = true
          )
        )
    `,
  },
];

async function cleanData() {
  const client = await getClient();
  const results: Array<{ rule: string; affected: number }> = [];

  try {
    await client.query("BEGIN");

    console.log("Starting data cleaning process...");

    for (const rule of CLEAN_RULES) {
      console.log(`\nExecuting: ${rule.name}`);
      console.log(`Description: ${rule.description}`);

      const res = await client.query(rule.sql);
      results.push({ rule: rule.name, affected: res.rowCount || 0 });
      console.log(`Affected rows: ${res.rowCount}`);
    }

    await client.query("COMMIT");

    console.log("\n=== Data Cleaning Summary ===");
    for (const r of results) {
      console.log(`${r.rule}: ${r.affected} rows affected`);
    }
    console.log("\nData cleaning completed successfully!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Data cleaning failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

cleanData();
