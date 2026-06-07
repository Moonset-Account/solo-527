import { db, isDbAvailable } from '@/db';
import {
  students,
  classPermissions,
  users,
  classes,
  attendance,
  assignmentSubmissions,
  quizSubmissions,
  courses,
  leaveRequests,
} from '@/db/schema';
import { eq, inArray, sql, desc, and, gte, lte, count, avg, sum, max, min } from 'drizzle-orm';

export interface DbStudentMetrics {
  studentId: string;
  studentName: string;
  studentIdNumber: string;
  attendanceRate: number;
  absentCount: number;
  lateCount: number;
  leaveCount: number;
  assignmentAvgScore: number;
  quizAvgScore: number;
  interactionCount: number;
  interactionQuality: number;
  overallScore: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface DbAnalyticsResult {
  studentMetrics: DbStudentMetrics[];
  useMockData: boolean;
  permittedClassIds: string[];
}

export class DatabaseAnalyticsService {
  async tryGetRealAnalytics(
    classIds: string[],
    filters: {
      courseId?: string;
      weekStart?: number;
      weekEnd?: number;
    } = {}
  ): Promise<DbAnalyticsResult | null> {
    try {
      if (!db || !isDbAvailable()) {
        console.log('Database not available, skipping real analytics');
        return null;
      }

      const validClassIds = classIds.filter(Boolean);
      if (validClassIds.length === 0) {
        return null;
      }

      const dbStudents = await db
        .select()
        .from(students)
        .where(inArray(students.classId, validClassIds))
        .limit(500);

      if (dbStudents.length === 0) {
        console.log('No students found in database for classes:', validClassIds);
        return null;
      }

      const studentIds = dbStudents.map(s => s.id);
      
      const attendanceRecords = await db
        .select({
          studentId: attendance.studentId,
          status: attendance.status,
          weekNumber: attendance.weekNumber,
        })
        .from(attendance)
        .where(
          and(
            inArray(attendance.studentId, studentIds),
            filters.weekStart ? gte(attendance.weekNumber, filters.weekStart) : undefined,
            filters.weekEnd ? lte(attendance.weekNumber, filters.weekEnd) : undefined
          )
        );

      const assignmentRecords = await db
        .select({
          studentId: assignmentSubmissions.studentId,
          score: assignmentSubmissions.score,
          weekNumber: assignmentSubmissions.weekNumber,
        })
        .from(assignmentSubmissions)
        .where(
          and(
            inArray(assignmentSubmissions.studentId, studentIds),
            filters.weekStart ? gte(assignmentSubmissions.weekNumber!, filters.weekStart) : undefined,
            filters.weekEnd ? lte(assignmentSubmissions.weekNumber!, filters.weekEnd) : undefined
          )
        );

      const quizRecords = await db
        .select({
          studentId: quizSubmissions.studentId,
          totalScore: quizSubmissions.totalScore,
          weekNumber: quizSubmissions.weekNumber,
        })
        .from(quizSubmissions)
        .where(
          and(
            inArray(quizSubmissions.studentId, studentIds),
            filters.weekStart ? gte(quizSubmissions.weekNumber!, filters.weekStart) : undefined,
            filters.weekEnd ? lte(quizSubmissions.weekNumber!, filters.weekEnd) : undefined
          )
        );

      const studentMetrics: DbStudentMetrics[] = dbStudents.map(student => {
        const stuAttendance = attendanceRecords.filter(a => a.studentId === student.id);
        const stuAssignments = assignmentRecords.filter(a => a.studentId === student.id);
        const stuQuizzes = quizRecords.filter(q => q.studentId === student.id);

        const totalAttendance = stuAttendance.length;
        const presentCount = stuAttendance.filter(a => a.status === 'present').length;
        const absentCount = stuAttendance.filter(a => a.status === 'absent').length;
        const lateCount = stuAttendance.filter(a => a.status === 'late').length;
        const leaveCount = stuAttendance.filter(a => a.status === 'leave' || a.status === 'excused').length;

        const attendanceRate = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 100;

        const assignmentScores = stuAssignments
          .map(a => Number(a.score))
          .filter(s => !isNaN(s));
        const assignmentAvgScore = assignmentScores.length > 0
          ? assignmentScores.reduce((a, b) => a + b, 0) / assignmentScores.length
          : 0;

        const quizScores = stuQuizzes
          .map(q => Number(q.totalScore))
          .filter(s => !isNaN(s));
        const quizAvgScore = quizScores.length > 0
          ? quizScores.reduce((a, b) => a + b, 0) / quizScores.length
          : 0;

        const overallScore = (
          attendanceRate * 0.3 +
          assignmentAvgScore * 0.35 +
          quizAvgScore * 0.35
        );

        let riskLevel: 'low' | 'medium' | 'high' = 'low';
        if (attendanceRate < 70 || overallScore < 60) {
          riskLevel = 'high';
        } else if (attendanceRate < 85 || overallScore < 75) {
          riskLevel = 'medium';
        }

        return {
          studentId: student.id,
          studentName: student.fullName,
          studentIdNumber: student.studentId || '',
          attendanceRate: Math.round(attendanceRate * 10) / 10,
          absentCount,
          lateCount,
          leaveCount,
          assignmentAvgScore: Math.round(assignmentAvgScore * 10) / 10,
          quizAvgScore: Math.round(quizAvgScore * 10) / 10,
          interactionCount: 0,
          interactionQuality: 0,
          overallScore: Math.round(overallScore * 10) / 10,
          riskLevel,
        };
      });

      return {
        studentMetrics,
        useMockData: false,
        permittedClassIds: validClassIds,
      };
    } catch (e) {
      console.warn('Database analytics query failed, will fall back to mock:', e);
      return null;
    }
  }

  async getStudentsByClassIds(classIds: string[]) {
    try {
      if (!db || !isDbAvailable()) return [];
      return await db
        .select()
        .from(students)
        .where(inArray(students.classId, classIds));
    } catch (e) {
      console.warn('Database query failed, falling back to empty array');
      return [];
    }
  }

  async getPermittedClassIds(userId: string): Promise<string[]> {
    try {
      if (!db || !isDbAvailable()) return [];
      const result = await db
        .select({ classId: classPermissions.classId })
        .from(classPermissions)
        .where(eq(classPermissions.userId, userId));
      return result.filter((r) => r.classId).map((r) => r.classId as string);
    } catch (e) {
      console.warn('Failed to get permitted class IDs, returning empty array');
      return [];
    }
  }

  async getUserWithRoles(userId: string) {
    try {
      if (!db || !isDbAvailable()) return null;
      return await db.query.users.findFirst({
        where: eq(users.id, userId),
        with: {
          roles: true,
        },
      });
    } catch (e) {
      console.warn('Failed to get user roles');
      return null;
    }
  }

  async getAttendanceTrend(classIds: string[]) {
    try {
      if (!db || !isDbAvailable()) return [];
      const validClassIds = classIds.filter(Boolean);
      if (validClassIds.length === 0) return [];

      const result = await db
        .select({
          weekNumber: attendance.weekNumber,
          count: count(attendance.id),
          present: sum(sql`CASE WHEN status = 'present' THEN 1 ELSE 0 END`),
        })
        .from(attendance)
        .where(inArray(attendance.classId, validClassIds))
        .groupBy(attendance.weekNumber)
        .orderBy(attendance.weekNumber);

      return result.map(r => ({
        week: r.weekNumber || 0,
        value: r.count > 0 ? (Number(r.present) / r.count) * 100 : 100,
        label: `第${r.weekNumber}周`,
      }));
    } catch (e) {
      console.warn('Failed to get attendance trend');
      return [];
    }
  }

  async getScoreTrend(classIds: string[]) {
    try {
      if (!db || !isDbAvailable()) return [];
      const validClassIds = classIds.filter(Boolean);
      if (validClassIds.length === 0) return [];

      const result = await db
        .select({
          weekNumber: assignmentSubmissions.weekNumber,
          avgScore: avg(assignmentSubmissions.score),
        })
        .from(assignmentSubmissions)
        .innerJoin(students, eq(students.id, assignmentSubmissions.studentId))
        .where(inArray(students.classId, validClassIds))
        .groupBy(assignmentSubmissions.weekNumber)
        .orderBy(assignmentSubmissions.weekNumber);

      return result.map(r => ({
        week: r.weekNumber || 0,
        value: Number(r.avgScore) || 0,
        label: `第${r.weekNumber}周`,
      }));
    } catch (e) {
      console.warn('Failed to get score trend');
      return [];
    }
  }

  async getClassList() {
    try {
      if (!db || !isDbAvailable()) return [];
      return await db.select().from(classes).orderBy(classes.name);
    } catch (e) {
      console.warn('Failed to get class list');
      return [];
    }
  }

  async getCourseList() {
    try {
      if (!db || !isDbAvailable()) return [];
      return await db.select().from(courses).orderBy(courses.name);
    } catch (e) {
      console.warn('Failed to get course list');
      return [];
    }
  }
}

export const dbAnalytics = new DatabaseAnalyticsService();
