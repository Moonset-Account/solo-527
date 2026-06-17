import { eq, and, sql, desc } from 'drizzle-orm';
import { db } from '../db';
import { registrations, signinRecords, shifts, projects, users } from '../db/schema';
import type { NewRegistration, NewSigninRecord } from '../db/schema';
import type { SigninRecordWithDetails, ServiceRecordFilters, PaginationParams } from '$lib/types';
import { calculateDuration } from '$lib/utils/date';

export async function registerForShift(
	userId: string,
	shiftId: string
): Promise<typeof registrations.$inferSelect | null> {
	const existing = await db
		.select()
		.from(registrations)
		.where(and(eq(registrations.userId, userId), eq(registrations.shiftId, shiftId)))
		.limit(1);

	if (existing.length) return null;

	const [result] = await db
		.insert(registrations)
		.values({ userId, shiftId } as NewRegistration)
		.returning();

	return result || null;
}

export async function cancelRegistration(registrationId: string): Promise<boolean> {
	const result = await db
		.update(registrations)
		.set({ status: 'canceled', canceledAt: new Date() })
		.where(eq(registrations.id, registrationId));

	return result.rowCount > 0;
}

export async function signin(
	userId: string,
	shiftId: string,
	location?: string
): Promise<typeof signinRecords.$inferSelect | null> {
	const existingSignin = await db
		.select()
		.from(signinRecords)
		.where(and(eq(signinRecords.userId, userId), eq(signinRecords.shiftId, shiftId)))
		.limit(1);

	if (existingSignin.length) {
		const record = existingSignin[0];
		if (!record.signoutTime) {
			const signoutTime = new Date();
			const duration = calculateDuration(record.signinTime, signoutTime);
			const [updated] = await db
				.update(signinRecords)
				.set({ signoutTime, durationHours: duration.toString(), status: 'confirmed' })
				.where(eq(signinRecords.id, record.id))
				.returning();
			return updated || null;
		}
		return record;
	}

	const [result] = await db
		.insert(signinRecords)
		.values({ userId, shiftId, location, status: 'pending' } as NewSigninRecord)
		.returning();

	return result || null;
}

export async function getUserSigninRecords(
	userId: string,
	filters: ServiceRecordFilters = {},
	pagination: PaginationParams = { page: 1, pageSize: 20 }
): Promise<{ data: SigninRecordWithDetails[]; total: number }> {
	const conditions = [eq(signinRecords.userId, userId)];

	if (filters.projectId) {
		conditions.push(eq(projects.id, filters.projectId));
	}
	if (filters.startDate) {
		conditions.push(sql`${signinRecords.signinTime} >= ${new Date(filters.startDate)}`);
	}
	if (filters.endDate) {
		conditions.push(sql`${signinRecords.signinTime} <= ${new Date(filters.endDate)}`);
	}
	if (filters.status?.length) {
		conditions.push(sql`${signinRecords.status} = any(${filters.status})`);
	}

	const whereClause = and(...conditions);

	const countResult = await db
		.select({ count: sql<number>`count(*)` })
		.from(signinRecords)
		.innerJoin(shifts, eq(signinRecords.shiftId, shifts.id))
		.innerJoin(projects, eq(shifts.projectId, projects.id))
		.where(whereClause);

	const total = Number(countResult[0]?.count || 0);

	const offset = (pagination.page - 1) * pagination.pageSize;

	const results = await db
		.select({
			record: signinRecords,
			projectName: projects.title,
			shiftName: shifts.name,
			userName: users.name
		})
		.from(signinRecords)
		.innerJoin(shifts, eq(signinRecords.shiftId, shifts.id))
		.innerJoin(projects, eq(shifts.projectId, projects.id))
		.innerJoin(users, eq(signinRecords.userId, users.id))
		.where(whereClause)
		.orderBy(desc(signinRecords.signinTime))
		.limit(pagination.pageSize)
		.offset(offset);

	const data: SigninRecordWithDetails[] = results.map((r) => ({
		...r.record,
		projectName: r.projectName,
		shiftName: r.shiftName,
		userName: r.userName
	}));

	return { data, total };
}

export async function getRegistrationById(
	id: string
): Promise<(typeof registrations.$inferSelect & { shift: typeof shifts.$inferSelect }) | null> {
	const results = await db
		.select({ registration: registrations, shift: shifts })
		.from(registrations)
		.innerJoin(shifts, eq(registrations.shiftId, shifts.id))
		.where(eq(registrations.id, id))
		.limit(1);

	if (!results.length) return null;
	return { ...results[0].registration, shift: results[0].shift };
}

export async function getShiftRegistrations(
	shiftId: string
): Promise<(typeof registrations.$inferSelect & { user: { name: string; email: string } })[]> {
	const results = await db
		.select({ registration: registrations, userName: users.name, userEmail: users.email })
		.from(registrations)
		.innerJoin(users, eq(registrations.userId, users.id))
		.where(eq(registrations.shiftId, shiftId))
		.orderBy(desc(registrations.registeredAt));

	return results.map((r) => ({
		...r.registration,
		user: { name: r.userName, email: r.userEmail }
	}));
}
