import { createObjectCsvWriter } from "csv-writer";
import path from "path";
import fs from "fs";
import { pool } from "../app/config/db.server";

interface ExportOptions {
  format: "csv" | "json";
  type: "funnel" | "quiz" | "department" | "certificate" | "full";
  filters: Record<string, any>;
  outputDir?: string;
}

async function buildExportData(options: ExportOptions) {
  const { type, filters } = options;
  const data: Record<string, any> = {};

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

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  if (type === "funnel" || type === "full") {
    const sql = `
      SELECT
        d.name as department,
        c.name as course,
        co.name as cohort,
        i.name as instructor,
        u.position,
        COUNT(DISTINCT e.id) as enrollments,
        COUNT(DISTINCT CASE WHEN EXISTS (
          SELECT 1 FROM checkins ch WHERE ch.enrollment_id = e.id AND ch.status = 'present'
        ) THEN e.id END) as checked_in,
        COUNT(DISTINCT CASE WHEN lp.completion_status = 'completed' THEN e.id END) as completed,
        COUNT(DISTINCT CASE WHEN qa_first.passed = true THEN e.id END) as first_pass,
        COUNT(DISTINCT CASE WHEN qa_retake.passed = true AND qa_first.passed = false THEN e.id END) as retake_pass,
        COUNT(DISTINCT cert.id) as certificates
      FROM enrollments e
      JOIN users u ON e.user_id = u.id
      JOIN departments d ON u.department_id = d.id
      JOIN cohorts co ON e.cohort_id = co.id
      JOIN courses c ON co.course_id = c.id
      JOIN instructors i ON co.instructor_id = i.id
      LEFT JOIN learning_progress lp ON e.id = lp.enrollment_id
      LEFT JOIN quiz_attempts qa_first ON e.id = qa_first.enrollment_id AND qa_first.attempt_number = 1
      LEFT JOIN quiz_attempts qa_retake ON e.id = qa_retake.enrollment_id AND qa_retake.attempt_number > 1
      LEFT JOIN certificates cert ON e.id = cert.enrollment_id
      ${whereClause}
      GROUP BY d.name, c.name, co.name, i.name, u.position
      ORDER BY d.name, c.name, co.name
    `;
    const res = await pool.query(sql, params);
    data.funnel = res.rows;
  }

  if (type === "quiz" || type === "full") {
    const sql = `
      SELECT
        d.name as department,
        c.name as course,
        co.name as cohort,
        u.employee_id,
        u.name as user_name,
        u.position,
        qa.attempt_number,
        qa.score,
        qa.passed,
        qa.attempted_at
      FROM quiz_attempts qa
      JOIN enrollments e ON qa.enrollment_id = e.id
      JOIN users u ON e.user_id = u.id
      JOIN departments d ON u.department_id = d.id
      JOIN cohorts co ON e.cohort_id = co.id
      JOIN courses c ON co.course_id = c.id
      ${whereClause ? whereClause.replace(/u\./g, "u.") : ""}
      ORDER BY co.name, u.name, qa.attempt_number
    `;
    const res = await pool.query(sql, params);
    data.quiz = res.rows;
  }

  if (type === "department" || type === "full") {
    const sql = `
      SELECT
        d.name as department,
        COUNT(DISTINCT u.id) as total_users,
        COUNT(DISTINCT e.id) as total_enrollments,
        COUNT(DISTINCT CASE WHEN lp.completion_status = 'completed' THEN e.id END) as completed,
        ROUND(
          (COUNT(DISTINCT CASE WHEN lp.completion_status = 'completed' THEN e.id END)::decimal /
          NULLIF(COUNT(DISTINCT e.id), 0)) * 100, 2
        ) as completion_rate,
        ROUND(
          (COUNT(DISTINCT CASE WHEN qa_first.passed = true THEN e.id END)::decimal /
          NULLIF(COUNT(DISTINCT e.id), 0)) * 100, 2
        ) as first_pass_rate,
        ROUND(
          (COUNT(DISTINCT cert.id)::decimal / NULLIF(COUNT(DISTINCT e.id), 0)) * 100, 2
        ) as certificate_rate
      FROM departments d
      LEFT JOIN users u ON u.department_id = d.id
      LEFT JOIN enrollments e ON e.user_id = u.id
      LEFT JOIN learning_progress lp ON e.id = lp.enrollment_id
      LEFT JOIN quiz_attempts qa_first ON e.id = qa_first.enrollment_id AND qa_first.attempt_number = 1
      LEFT JOIN certificates cert ON e.id = cert.enrollment_id
      GROUP BY d.id, d.name
      ORDER BY completion_rate DESC
    `;
    const res = await pool.query(sql);
    data.department = res.rows;
  }

  if (type === "certificate" || type === "full") {
    const sql = `
      SELECT
        cert.certificate_no,
        d.name as department,
        c.name as course,
        co.name as cohort,
        u.employee_id,
        u.name as user_name,
        u.position,
        cert.score,
        cert.issued_at
      FROM certificates cert
      JOIN enrollments e ON cert.enrollment_id = e.id
      JOIN users u ON e.user_id = u.id
      JOIN departments d ON u.department_id = d.id
      JOIN cohorts co ON e.cohort_id = co.id
      JOIN courses c ON co.course_id = c.id
      ${whereClause}
      ORDER BY cert.issued_at DESC
    `;
    const res = await pool.query(sql, params);
    data.certificate = res.rows;
  }

  return data;
}

export async function runExport(options: ExportOptions) {
  const { format, type, outputDir = "./exports" } = options;
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const data = await buildExportData(options);
  const outputs: string[] = [];

  if (format === "json") {
    const filePath = path.join(outputDir, `export-${type}-${timestamp}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    outputs.push(filePath);
  } else if (format === "csv") {
    for (const [key, rows] of Object.entries(data)) {
      if (Array.isArray(rows) && rows.length > 0) {
        const headers = Object.keys(rows[0]).map(id => ({ id, title: id }));
        const filePath = path.join(outputDir, `export-${key}-${timestamp}.csv`);
        const csvWriter = createObjectCsvWriter({
          path: filePath,
          header: headers,
        });
        await csvWriter.writeRecords(rows);
        outputs.push(filePath);
      }
    }
  }

  console.log(`Export completed. Files generated:`);
  outputs.forEach(f => console.log(`  - ${f}`));

  return { files: outputs, data };
}

async function main() {
  const args = process.argv.slice(2);
  const format = (args.find(a => a.startsWith("--format="))?.split("=")[1] || "csv") as "csv" | "json";
  const type = (args.find(a => a.startsWith("--type="))?.split("=")[1] || "full") as any;

  await runExport({ format, type, filters: {} });
  await pool.end();
}

if (process.argv[1]?.includes("export-task")) {
  main();
}
