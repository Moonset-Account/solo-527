import { eq, and, ilike, desc, asc, inArray, gte, lte, sql } from 'drizzle-orm';
import { db } from '../db';
import {
	projects,
	shifts,
	registrations,
	signinRecords,
	users,
	materials,
	materialFlows,
	photos,
	budgets,
	budgetItems
} from '../db/schema';
import type {
	ProjectWithStats,
	ShiftWithDetails,
	ProjectFilters,
	PaginationParams,
	SortParams
} from '$lib/types';
import type { NewProject, NewShift, NewMaterial, NewPhoto } from '../db/schema';

export async function getProjects(
	filters: ProjectFilters = {},
	pagination: PaginationParams = { page: 1, pageSize: 12 },
	sort: SortParams = { field: 'createdAt', order: 'desc' }
): Promise<{ data: ProjectWithStats[]; total: number }> {
	const conditions = [];

	if (filters.status?.length) {
		conditions.push(inArray(projects.status, filters.status));
	}
	if (filters.category?.length) {
		conditions.push(inArray(projects.category, filters.category));
	}
	if (filters.startDate) {
		conditions.push(gte(projects.startDate, new Date(filters.startDate)));
	}
	if (filters.endDate) {
		conditions.push(lte(projects.endDate, new Date(filters.endDate)));
	}
	if (filters.keyword) {
		conditions.push(ilike(projects.title, `%${filters.keyword}%`));
	}

	const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

	const countResult = await db
		.select({ count: sql<number>`count(*)` })
		.from(projects)
		.where(whereClause);

	const total = Number(countResult[0]?.count || 0);

	const offset = (pagination.page - 1) * pagination.pageSize;
	const sortOrder = sort.order === 'desc' ? desc : asc;

	const results = await db
		.select({
			project: projects,
			managerName: users.name,
			totalVolunteers: sql<number>`count(distinct ${registrations.userId})`,
			totalHours: sql<number>`coalesce(sum(${signinRecords.durationHours}), 0)`,
			shiftCount: sql<number>`count(distinct ${shifts.id})`
		})
		.from(projects)
		.leftJoin(users, eq(projects.managerId, users.id))
		.leftJoin(shifts, eq(shifts.projectId, projects.id))
		.leftJoin(registrations, eq(registrations.shiftId, shifts.id))
		.leftJoin(signinRecords, eq(signinRecords.shiftId, shifts.id))
		.where(whereClause)
		.groupBy(projects.id, users.name)
		.orderBy(sortOrder(projects[sort.field as keyof typeof projects] || projects.createdAt))
		.limit(pagination.pageSize)
		.offset(offset);

	const data: ProjectWithStats[] = results.map((r) => ({
		...r.project,
		managerName: r.managerName || null,
		totalVolunteers: Number(r.totalVolunteers || 0),
		totalHours: Number(r.totalHours || 0),
		shiftCount: Number(r.shiftCount || 0)
	}));

	return { data, total };
}

export async function getProjectById(
	id: string,
	userId?: string
): Promise<{
	project: ProjectWithStats;
	shifts: ShiftWithDetails[];
	materials: (typeof materials.$inferSelect)[];
	photos: (typeof photos.$inferSelect)[];
	budget: (typeof budgets.$inferSelect & { items: typeof budgetItems.$inferSelect[] }) | null;
} | null> {
	const projectResult = await db
		.select({
			project: projects,
			managerName: users.name,
			totalVolunteers: sql<number>`count(distinct ${registrations.userId})`,
			totalHours: sql<number>`coalesce(sum(${signinRecords.durationHours}), 0)`,
			shiftCount: sql<number>`count(distinct ${shifts.id})`
		})
		.from(projects)
		.leftJoin(users, eq(projects.managerId, users.id))
		.leftJoin(shifts, eq(shifts.projectId, projects.id))
		.leftJoin(registrations, eq(registrations.shiftId, shifts.id))
		.leftJoin(signinRecords, eq(signinRecords.shiftId, shifts.id))
		.where(eq(projects.id, id))
		.groupBy(projects.id, users.name)
		.limit(1);

	if (!projectResult.length) return null;

	const r = projectResult[0];
	const project: ProjectWithStats = {
		...r.project,
		managerName: r.managerName || null,
		totalVolunteers: Number(r.totalVolunteers || 0),
		totalHours: Number(r.totalHours || 0),
		shiftCount: Number(r.shiftCount || 0)
	};

	const shiftsResult = await db
		.select({
			shift: shifts,
			registeredCount: sql<number>`count(${registrations.id})`,
			isRegistered: sql<boolean>`max(case when ${registrations.userId} = ${userId || 'null'}::uuid then true else false end)`,
			registrationId: sql<string>`max(case when ${registrations.userId} = ${userId || 'null'}::uuid then ${registrations.id} else null end)`
		})
		.from(shifts)
		.leftJoin(registrations, eq(registrations.shiftId, shifts.id))
		.where(eq(shifts.projectId, id))
		.groupBy(shifts.id)
		.orderBy(asc(shifts.startTime));

	const shiftsData: ShiftWithDetails[] = shiftsResult.map((s) => ({
		...s.shift,
		registeredCount: Number(s.registeredCount || 0),
		isRegistered: Boolean(s.isRegistered),
		registrationId: s.registrationId || null
	}));

	const materialsData = await db
		.select()
		.from(materials)
		.where(eq(materials.projectId, id))
		.orderBy(asc(materials.name));

	const photosData = await db
		.select()
		.from(photos)
		.where(eq(photos.projectId, id))
		.orderBy(desc(photos.uploadedAt))
		.limit(50);

	const budgetResult = await db
		.select()
		.from(budgets)
		.where(eq(budgets.projectId, id))
		.limit(1);

	let budget = null;
	if (budgetResult.length) {
		const budgetItemsData = await db
			.select()
			.from(budgetItems)
			.where(eq(budgetItems.budgetId, budgetResult[0].id))
			.orderBy(desc(budgetItems.expenseDate));
		budget = { ...budgetResult[0], items: budgetItemsData };
	}

	return { project, shifts: shiftsData, materials: materialsData, photos: photosData, budget };
}

export async function getMaterialFlows(
	materialId: string
): Promise<(typeof materialFlows.$inferSelect)[]> {
	return db
		.select()
		.from(materialFlows)
		.where(eq(materialFlows.materialId, materialId))
		.orderBy(desc(materialFlows.flowTime));
}

export async function createProject(data: NewProject): Promise<typeof projects.$inferSelect> {
	const [result] = await db.insert(projects).values(data).returning();
	return result;
}

export async function createShift(data: NewShift): Promise<typeof shifts.$inferSelect> {
	const [result] = await db.insert(shifts).values(data).returning();
	return result;
}

export async function createMaterial(data: NewMaterial): Promise<typeof materials.$inferSelect> {
	const [result] = await db.insert(materials).values(data).returning();
	return result;
}

export async function createPhoto(data: NewPhoto): Promise<typeof photos.$inferSelect> {
	const [result] = await db.insert(photos).values(data).returning();
	return result;
}

export async function updateProjectStatus(
	id: string,
	status: string
): Promise<typeof projects.$inferSelect | null> {
	const [result] = await db
		.update(projects)
		.set({ status })
		.where(eq(projects.id, id))
		.returning();
	return result || null;
}

export async function getProjectCategories(): Promise<string[]> {
	const result = await db
		.selectDistinct({ category: projects.category })
		.from(projects)
		.where(sql`${projects.category} is not null`);
	return result.map((r) => r.category as string).filter(Boolean);
}

export async function getHoursByProject(projectId: string): Promise<
	{
		date: string;
		hours: number;
	}[]
> {
	const result = await db
		.select({
			date: sql<string>`date(${signinRecords.signinTime})`,
			hours: sql<number>`coalesce(sum(${signinRecords.durationHours}), 0)`
		})
		.from(signinRecords)
		.innerJoin(shifts, eq(signinRecords.shiftId, shifts.id))
		.where(and(eq(shifts.projectId, projectId), eq(signinRecords.status, 'confirmed')))
		.groupBy(sql`date(${signinRecords.signinTime})`)
		.orderBy(sql`date(${signinRecords.signinTime})`);

	return result.map((r) => ({
		date: r.date,
		hours: Number(r.hours || 0)
	}));
}
