import { db } from '@/db';
import {
  students,
  classPermissions,
  users,
} from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';

export class DatabaseAnalyticsService {
  async getStudentsByClassIds(classIds: string[]) {
    try {
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
}

export const dbAnalytics = new DatabaseAnalyticsService();
