import { pool } from "../app/config/db.server";
import dayjs from "dayjs";

const DEPARTMENTS = ["研发部", "市场部", "人力资源部", "财务部", "运营部", "销售部", "客服部", "产品部"];
const POSITIONS = ["专员", "主管", "经理", "总监", "VP", "CEO"];
const COURSES = [
  { code: "TR001", name: "新员工入职培训", category: "入职培训", duration: 8, pass_score: 60 },
  { code: "TR002", name: "产品安全与合规", category: "合规培训", duration: 4, pass_score: 80 },
  { code: "TR003", name: "数据分析师进阶", category: "技能培训", duration: 24, pass_score: 70 },
  { code: "TR004", name: "领导力发展", category: "管理培训", duration: 16, pass_score: 60 },
  { code: "TR005", name: "客户服务技巧", category: "技能培训", duration: 12, pass_score: 75 },
  { code: "TR006", name: "项目管理实战", category: "技能培训", duration: 20, pass_score: 65 },
];
const INSTRUCTORS = ["张明", "李华", "王芳", "刘强", "陈静", "赵伟"];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seedData() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    console.log("Seeding departments...");
    const deptIds: number[] = [];
    for (const dept of DEPARTMENTS) {
      const res = await client.query(
        "INSERT INTO departments (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id",
        [dept]
      );
      deptIds.push(res.rows[0].id);
    }

    console.log("Seeding instructors...");
    const instructorIds: number[] = [];
    for (const instructor of INSTRUCTORS) {
      const res = await client.query(
        "INSERT INTO instructors (name, title, department_id) VALUES ($1, $2, $3) RETURNING id",
        [instructor, "高级讲师", randomChoice(deptIds)]
      );
      instructorIds.push(res.rows[0].id);
    }

    console.log("Seeding courses...");
    const courseIds: number[] = [];
    for (const course of COURSES) {
      const res = await client.query(
        `INSERT INTO courses (code, name, description, category, duration_hours, pass_score)
         VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
        [course.code, course.name, `${course.name}课程内容`, course.category, course.duration, course.pass_score]
      );
      courseIds.push(res.rows[0].id);
    }

    console.log("Seeding users...");
    const userIds: number[] = [];
    for (let i = 1; i <= 500; i++) {
      const res = await client.query(
        `INSERT INTO users (employee_id, name, department_id, position, email)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [
          `EMP${String(i).padStart(4, "0")}`,
          `员工${i}`,
          randomChoice(deptIds),
          randomChoice(POSITIONS),
          `emp${i}@company.com`,
        ]
      );
      userIds.push(res.rows[0].id);
    }

    console.log("Seeding cohorts...");
    const cohortIds: number[] = [];
    for (let ci = 0; ci < courseIds.length; ci++) {
      const courseId = courseIds[ci];
      const passScore = COURSES[ci].pass_score;
      for (let c = 1; c <= 3; c++) {
        const startDate = dayjs().subtract(randomInt(0, 90), "day").format("YYYY-MM-DD");
        const endDate = dayjs(startDate).add(randomInt(7, 30), "day").format("YYYY-MM-DD");
        const res = await client.query(
          `INSERT INTO cohorts (course_id, name, instructor_id, start_date, end_date, capacity, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
          [
            courseId,
            `${COURSES[ci].name}-${c}期`,
            randomChoice(instructorIds),
            startDate,
            endDate,
            randomInt(20, 50),
            randomChoice(["active", "completed", "active"]),
          ]
        );
        cohortIds.push(res.rows[0].id);
      }
    }

    console.log("Seeding enrollments, progress, checkins, quizzes and certificates...");
    for (const cohortId of cohortIds) {
      const cohortRes = await client.query("SELECT course_id, start_date FROM cohorts WHERE id = $1", [cohortId]);
      const { course_id: courseId, start_date: startDate } = cohortRes.rows[0];
      const courseRes = await client.query("SELECT pass_score FROM courses WHERE id = $1", [courseId]);
      const passScore = courseRes.rows[0].pass_score;

      const numEnrollments = randomInt(15, 40);
      const shuffledUsers = [...userIds].sort(() => Math.random() - 0.5).slice(0, numEnrollments);

      for (const userId of shuffledUsers) {
        const enrolledAt = dayjs(startDate).subtract(randomInt(0, 7), "day").toDate();

        const enrollRes = await client.query(
          `INSERT INTO enrollments (user_id, cohort_id, enrolled_at, status)
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [userId, cohortId, enrolledAt, "enrolled"]
        );
        const enrollmentId = enrollRes.rows[0].id;

        const progressRoll = Math.random();
        let completionStatus: string;
        let progressPercent: number;
        let completedAt: Date | null = null;

        if (progressRoll < 0.65) {
          completionStatus = "completed";
          progressPercent = 100;
          completedAt = dayjs(startDate).add(randomInt(5, 25), "day").toDate();
        } else if (progressRoll < 0.85) {
          completionStatus = "in_progress";
          progressPercent = randomInt(10, 90);
        } else {
          completionStatus = "not_started";
          progressPercent = 0;
        }

        await client.query(
          `INSERT INTO learning_progress (enrollment_id, completion_status, progress_percent, last_accessed_at, completed_at)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            enrollmentId,
            completionStatus,
            progressPercent,
            dayjs(enrolledAt).add(randomInt(1, 10), "day").toDate(),
            completedAt,
          ]
        );

        const checkinDays = randomInt(3, 10);
        for (let d = 0; d < checkinDays; d++) {
          const sessionDate = dayjs(startDate).add(d, "day").format("YYYY-MM-DD");
          const isPresent = Math.random() > 0.15;
          await client.query(
            `INSERT INTO checkins (enrollment_id, checkin_time, session_date, status)
             VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
            [
              enrollmentId,
              isPresent ? dayjs(sessionDate).hour(9).minute(randomInt(0, 30)).toDate() : null,
              sessionDate,
              isPresent ? "present" : "absent",
            ]
          );
        }

        const quizAttempts = Math.random() > 0.7 ? randomInt(1, 3) : 1;
        let finalPassed = false;
        let finalScore = 0;

        for (let attempt = 1; attempt <= quizAttempts; attempt++) {
          let score: number;
          if (attempt === 1) {
            if (Math.random() > 0.3) {
              score = randomInt(passScore, 100);
              finalPassed = true;
            } else {
              score = randomInt(30, passScore - 1);
            }
          } else {
            score = randomInt(passScore - 5, 100);
            if (score >= passScore) finalPassed = true;
          }
          finalScore = Math.max(finalScore, score);

          await client.query(
            `INSERT INTO quiz_attempts (enrollment_id, attempt_number, score, max_score, passed, attempted_at)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              enrollmentId,
              attempt,
              score,
              100,
              score >= passScore,
              dayjs(enrolledAt).add(randomInt(3, 20), "day").toDate(),
            ]
          );

          if (score >= passScore) break;
        }

        if (completionStatus === "completed" && finalPassed) {
          const certNo = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          await client.query(
            `INSERT INTO certificates (enrollment_id, certificate_no, issued_at, score)
             VALUES ($1, $2, $3, $4)`,
            [enrollmentId, certNo, dayjs(completedAt).add(1, "day").toDate(), finalScore]
          );
        }
      }
    }

    await client.query("COMMIT");
    console.log("Data seeding completed successfully!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seeding failed:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seedData();
