import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/middleware-auth';
import { detectMissingValues } from '@/lib/utils/data-quality';
import { db } from '@/db';
import { students, attendance, assignmentSubmissions, quizSubmissions, classes } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const auth = await getAuthContext(request as any);
    
    if (!auth) {
      return NextResponse.json(
        { error: '未授权，请先登录', success: false },
        { status: 401 }
      );
    }

    if (!auth.canImportData) {
      return NextResponse.json(
        { error: '权限不足，无法导入数据', success: false },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const importType = formData.get('type') as string;
    const confirmWrite = formData.get('confirmWrite') === 'true';

    if (!file) {
      return NextResponse.json(
        { error: '未上传文件', success: false },
        { status: 400 }
      );
    }

    const content = await file.text();
    const lines = content.split('\n').filter((line) => line.trim());
    
    if (lines.length < 2) {
      return NextResponse.json(
        { error: '文件内容为空或格式不正确', success: false },
        { status: 400 }
      );
    }

    const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));
    const records = lines.slice(1).map((line) => {
      const values = line.split(',').map((v) => v.trim().replace(/"/g, ''));
      const record: Record<string, string> = {};
      headers.forEach((h, i) => {
        record[h] = values[i] || '';
      });
      return record;
    });

    const missingReport = detectMissingValues(records, headers);
    const errors: string[] = [];
    const successfulIds: string[] = [];

    records.forEach((record, idx) => {
      if (!record['学号'] && !record['studentId']) {
        errors.push(`第 ${idx + 2} 行: 缺少学号`);
      }
      if (!record['姓名'] && !record['fullName']) {
        errors.push(`第 ${idx + 2} 行: 缺少姓名`);
      }
    });

    let dbWriteSuccess = 0;
    let dbWriteFailed = 0;

    if (confirmWrite && errors.length === 0) {
      try {
        for (const record of records) {
          try {
            const studentId = record['学号'] || record['studentId'] || '';
            const studentName = record['姓名'] || record['fullName'] || '';

            if (importType === 'students') {
              const classId = record['班级'] || record['classId'] || auth.permittedClassIds[0];
              
              const existingStudent = await db
                .select()
                .from(students)
                .where(eq(students.studentId, studentId))
                .limit(1);

              if (existingStudent.length === 0) {
                const latVal = record['纬度'] || record['latitude'];
                const lngVal = record['经度'] || record['longitude'];
                await db.insert(students).values({
                  studentId: studentId,
                  fullName: studentName,
                  gender: record['性别'] || record['gender'] || null,
                  phone: record['手机号'] || record['phone'] || null,
                  email: record['邮箱'] || record['email'] || null,
                  address: record['家庭住址'] || record['address'] || null,
                  latitude: latVal ? String(latVal) : null,
                  longitude: lngVal ? String(lngVal) : null,
                  classId: classId,
                });
              } else {
                await db
                  .update(students)
                  .set({
                    fullName: studentName,
                    gender: record['性别'] || record['gender'] || null,
                    phone: record['手机号'] || record['phone'] || null,
                    email: record['邮箱'] || record['email'] || null,
                  })
                  .where(eq(students.studentId, studentId));
              }
              successfulIds.push(studentId);
              dbWriteSuccess++;
            } else if (importType === 'attendance') {
              const existingStudents = await db
                .select()
                .from(students)
                .where(eq(students.studentId, studentId))
                .limit(1);

              if (existingStudents.length > 0) {
                const stu = existingStudents[0];
                const date = record['日期'] || record['date'] || new Date().toISOString().split('T')[0];
                const status = record['出勤状态'] || record['status'] || 'present';
                const weekNumber = record['周次'] || record['weekNumber'] ? Number(record['周次'] || record['weekNumber']) : null;
                const courseId = record['课程'] || record['courseId'] || null;
                const classId = record['班级'] || record['classId'] || stu.classId || null;

                await db.insert(attendance).values({
                  studentId: stu.id,
                  courseId: courseId,
                  classId: classId,
                  date: date,
                  weekNumber: weekNumber,
                  status: status,
                  remarks: record['备注'] || record['remarks'] || null,
                });
                successfulIds.push(studentId);
                dbWriteSuccess++;
              } else {
                dbWriteFailed++;
                errors.push(`学号 ${studentId} 不存在`);
              }
            } else if (importType === 'scores') {
              const existingStudents = await db
                .select()
                .from(students)
                .where(eq(students.studentId, studentId))
                .limit(1);

              if (existingStudents.length > 0) {
                const stu = existingStudents[0];
                const assignmentScore = record['作业分数'] || record['assignmentScore'];
                const quizScore = record['测验分数'] || record['quizScore'];
                const weekNumber = record['周次'] || record['weekNumber'] ? Number(record['周次'] || record['weekNumber']) : null;

                if (assignmentScore) {
                  await db.insert(assignmentSubmissions).values({
                    studentId: stu.id,
                    score: assignmentScore,
                    submittedAt: new Date(),
                  });
                }

                if (quizScore) {
                  await db.insert(quizSubmissions).values({
                    studentId: stu.id,
                    totalScore: quizScore,
                    submittedAt: new Date(),
                  });
                }
                successfulIds.push(studentId);
                dbWriteSuccess++;
              } else {
                dbWriteFailed++;
                errors.push(`学号 ${studentId} 不存在`);
              }
            }
          } catch (recordError) {
            dbWriteFailed++;
            console.error('Record import error:', recordError);
          }
        }
      } catch (dbError) {
        console.warn('Database write failed, import completed in preview mode:', dbError);
      }
    }

    const successful = records.length - errors.length;

    return NextResponse.json({
      success: true,
      data: {
        importType,
        fileName: file.name,
        totalRecords: records.length,
        successfulRecords: confirmWrite ? dbWriteSuccess : successful,
        failedRecords: confirmWrite ? dbWriteFailed + errors.length : errors.length,
        errors,
        missingReport,
        preview: records.slice(0, 5),
        dbWriteExecuted: confirmWrite,
        dbWriteSuccess,
        dbWriteFailed,
        successfulIds,
      },
      message: confirmWrite
        ? `数据库写入成功 ${dbWriteSuccess} 条，失败 ${dbWriteFailed + errors.length} 条`
        : `预览完成：成功 ${successful} 条，失败 ${errors.length} 条，请确认后执行入库`,
    });
  } catch (error) {
    console.error('Import API error:', error);
    return NextResponse.json(
      { error: '导入失败', success: false },
      { status: 500 }
    );
  }
}
