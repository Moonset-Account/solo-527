import { eq, and, sql, desc, inArray, gte, lte } from 'drizzle-orm';
import { db } from '../db';
import {
	budgets,
	budgetItems,
	feedbacks,
	feedbackProcessings,
	operationLogs,
	exportTasks,
	projects,
	users,
	signinRecords,
	shifts
} from '../db/schema';
import type {
	NewBudget,
	NewBudgetItem,
	NewFeedbackProcessing,
	NewExportTask
} from '../db/schema';
import type { FeedbackWithDetails, LogFilters, PaginationParams, ExportTaskWithUser } from '$lib/types';

export async function createBudget(data: NewBudget): Promise<typeof budgets.$inferSelect> {
	const [result] = await db.insert(budgets).values(data).returning();
	return result;
}

export async function addBudgetItem(
	data: NewBudgetItem
): Promise<typeof budgetItems.$inferSelect> {
	const [result] = await db.insert(budgetItems).values(data).returning();

	await db
		.update(budgets)
		.set({ usedAmount: sql`${budgets.usedAmount} + ${data.amount}` })
		.where(eq(budgets.id, data.budgetId));

	return result;
}

export async function getBudgetByProject(
	projectId: string
): Promise<(typeof budgets.$inferSelect & { items: typeof budgetItems.$inferSelect[] }) | null> {
	const budgetResult = await db
		.select()
		.from(budgets)
		.where(eq(budgets.projectId, projectId))
		.limit(1);

	if (!budgetResult.length) return null;

	const items = await db
		.select()
		.from(budgetItems)
		.where(eq(budgetItems.budgetId, budgetResult[0].id))
		.orderBy(desc(budgetItems.expenseDate));

	return { ...budgetResult[0], items };
}

export async function getAllBudgets(): Promise<
	(typeof budgets.$inferSelect & { projectName: string | null })[]
> {
	const results = await db
		.select({ budget: budgets, projectName: projects.title })
		.from(budgets)
		.leftJoin(projects, eq(budgets.projectId, projects.id))
		.orderBy(desc(budgets.createdAt));

	return results.map((r) => ({ ...r.budget, projectName: r.projectName || null }));
}

export async function getPendingFeedbacks(): Promise<FeedbackWithDetails[]> {
	const results = await db
		.select({
			feedback: feedbacks,
			userName: users.name,
			projectName: projects.title
		})
		.from(feedbacks)
		.innerJoin(users, eq(feedbacks.userId, users.id))
		.innerJoin(projects, eq(feedbacks.projectId, projects.id))
		.where(eq(feedbacks.status, 'pending'))
		.orderBy(desc(feedbacks.createdAt));

	const feedbacksWithProcessings = await Promise.all(
		results.map(async (r) => {
			const processings = await db
				.select()
				.from(feedbackProcessings)
				.where(eq(feedbackProcessings.feedbackId, r.feedback.id))
				.orderBy(desc(feedbackProcessings.processedAt));

			return {
				...r.feedback,
				userName: r.userName,
				projectName: r.projectName,
				processings
			};
		})
	);

	return feedbacksWithProcessings;
}

export async function processFeedback(
	feedbackId: string,
	processorId: string,
	data: {
		affectedParties: string;
		responsiblePerson: string;
		nextSteps: string;
		processingResult?: string;
		status?: string;
	}
): Promise<typeof feedbackProcessings.$inferSelect> {
	const [result] = await db
		.insert(feedbackProcessings)
		.values({
			feedbackId,
			processorId,
			...data
		} as NewFeedbackProcessing)
		.returning();

	if (data.status) {
		await db.update(feedbacks).set({ status: data.status }).where(eq(feedbacks.id, feedbackId));
	}

	return result;
}

export async function getFeedbackById(id: string): Promise<FeedbackWithDetails | null> {
	const results = await db
		.select({
			feedback: feedbacks,
			userName: users.name,
			projectName: projects.title
		})
		.from(feedbacks)
		.innerJoin(users, eq(feedbacks.userId, users.id))
		.innerJoin(projects, eq(feedbacks.projectId, projects.id))
		.where(eq(feedbacks.id, id))
		.limit(1);

	if (!results.length) return null;

	const r = results[0];
	const processings = await db
		.select()
		.from(feedbackProcessings)
		.where(eq(feedbackProcessings.feedbackId, id))
		.orderBy(desc(feedbackProcessings.processedAt));

	return {
		...r.feedback,
		userName: r.userName,
		projectName: r.projectName,
		processings
	};
}

export async function getLogs(
	filters: LogFilters = {},
	pagination: PaginationParams = { page: 1, pageSize: 50 }
): Promise<{
	data: (typeof operationLogs.$inferSelect & { userName: string | null })[];
	total: number;
}> {
	const conditions = [];

	if (filters.action) {
		conditions.push(eq(operationLogs.action, filters.action));
	}
	if (filters.userId) {
		conditions.push(eq(operationLogs.userId, filters.userId));
	}
	if (filters.targetType) {
		conditions.push(eq(operationLogs.targetType, filters.targetType));
	}
	if (filters.startDate) {
		conditions.push(gte(operationLogs.createdAt, new Date(filters.startDate)));
	}
	if (filters.endDate) {
		conditions.push(lte(operationLogs.createdAt, new Date(filters.endDate)));
	}

	const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

	const countResult = await db
		.select({ count: sql<number>`count(*)` })
		.from(operationLogs)
		.where(whereClause);

	const total = Number(countResult[0]?.count || 0);

	const offset = (pagination.page - 1) * pagination.pageSize;

	const results = await db
		.select({ log: operationLogs, userName: users.name })
		.from(operationLogs)
		.leftJoin(users, eq(operationLogs.userId, users.id))
		.where(whereClause)
		.orderBy(desc(operationLogs.createdAt))
		.limit(pagination.pageSize)
		.offset(offset);

	const data = results.map((r) => ({ ...r.log, userName: r.userName || null }));

	return { data, total };
}

export async function logOperation(
	userId: string | undefined,
	action: string,
	targetType?: string,
	targetId?: string,
	details?: Record<string, unknown>
): Promise<void> {
	await db.insert(operationLogs).values({
		userId,
		action,
		targetType,
		targetId,
		details: details as typeof operationLogs.$inferInsert.details
	});
}

export async function createExportTask(
	data: NewExportTask
): Promise<typeof exportTasks.$inferSelect> {
	const [result] = await db.insert(exportTasks).values(data).returning();
	return result;
}

export async function getExportTasks(
	userId?: string
): Promise<ExportTaskWithUser[]> {
	const conditions = [];
	if (userId) {
		conditions.push(eq(exportTasks.userId, userId));
	}
	const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

	const results = await db
		.select({ task: exportTasks, userName: users.name })
		.from(exportTasks)
		.innerJoin(users, eq(exportTasks.userId, users.id))
		.where(whereClause)
		.orderBy(desc(exportTasks.createdAt))
		.limit(50);

	return results.map((r) => ({ ...r.task, userName: r.userName }));
}

export async function updateExportTaskStatus(
	id: string,
	status: string,
	progress?: number,
	fileUrl?: string,
	errorMessage?: string
): Promise<void> {
	const updateData: Partial<typeof exportTasks.$inferInsert> = { status };
	if (progress !== undefined) updateData.progress = progress;
	if (fileUrl) updateData.fileUrl = fileUrl;
	if (errorMessage) updateData.errorMessage = errorMessage;
	if (status === 'completed' || status === 'failed') {
		updateData.completedAt = new Date();
	}

	await db.update(exportTasks).set(updateData).where(eq(exportTasks.id, id));
}

export async function generateExportData(
	exportType: string,
	filters: Record<string, unknown>
): Promise<string[][]> {
	let data: string[][] = [];

	switch (exportType) {
		case 'signin': {
			const conditions = [];
			if (filters.projectId) {
				conditions.push(eq(projects.id, filters.projectId as string));
			}
			if (filters.startDate) {
				conditions.push(gte(signinRecords.signinTime, new Date(filters.startDate as string)));
			}
			if (filters.endDate) {
				conditions.push(lte(signinRecords.signinTime, new Date(filters.endDate as string)));
			}
			if (filters.status && Array.isArray(filters.status)) {
				conditions.push(inArray(signinRecords.status, filters.status));
			}

			const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

			const results = await db
				.select({
					userName: users.name,
					userEmail: users.email,
					projectName: projects.title,
					shiftName: shifts.name,
					signinTime: signinRecords.signinTime,
					signoutTime: signinRecords.signoutTime,
					duration: signinRecords.durationHours,
					status: signinRecords.status
				})
				.from(signinRecords)
				.innerJoin(users, eq(signinRecords.userId, users.id))
				.innerJoin(shifts, eq(signinRecords.shiftId, shifts.id))
				.innerJoin(projects, eq(shifts.projectId, projects.id))
				.where(whereClause)
				.orderBy(desc(signinRecords.signinTime));

			data = [
				['姓名', '邮箱', '项目名称', '班次名称', '签到时间', '签退时间', '服务时长(小时)', '状态'],
				...results.map((r) => [
					r.userName,
					r.userEmail,
					r.projectName,
					r.shiftName,
					r.signinTime.toISOString(),
					r.signoutTime?.toISOString() || '',
					r.duration || '0',
					r.status
				])
			];
			break;
		}
		case 'project': {
			const results = await db
				.select({
					title: projects.title,
					category: projects.category,
					status: projects.status,
					startDate: projects.startDate,
					endDate: projects.endDate,
					location: projects.location,
					manager: users.name
				})
				.from(projects)
				.leftJoin(users, eq(projects.managerId, users.id))
				.orderBy(desc(projects.createdAt));

			data = [
				['项目名称', '分类', '状态', '开始日期', '结束日期', '地点', '负责人'],
				...results.map((r) => [
					r.title,
					r.category || '',
					r.status,
					r.startDate.toISOString(),
					r.endDate.toISOString(),
					r.location || '',
					r.manager || ''
				])
			];
			break;
		}
		case 'user': {
			const results = await db
				.select({
					name: users.name,
					email: users.email,
					role: users.role,
					createdAt: users.createdAt
				})
				.from(users)
				.orderBy(desc(users.createdAt));

			data = [
				['姓名', '邮箱', '角色', '注册时间'],
				...results.map((r) => [
					r.name,
					r.email,
					r.role,
					r.createdAt?.toISOString() || ''
				])
			];
			break;
		}
		case 'budget': {
			const results = await db
				.select({
					projectName: projects.title,
					totalAmount: budgets.totalAmount,
					usedAmount: budgets.usedAmount,
					itemName: budgetItems.itemName,
					itemAmount: budgetItems.amount,
					category: budgetItems.category,
					expenseDate: budgetItems.expenseDate
				})
				.from(budgets)
				.innerJoin(projects, eq(budgets.projectId, projects.id))
				.innerJoin(budgetItems, eq(budgetItems.budgetId, budgets.id))
				.orderBy(desc(budgetItems.expenseDate));

			data = [
				['项目名称', '总预算', '已使用', '支出项', '金额', '分类', '支出日期'],
				...results.map((r) => [
					r.projectName,
					r.totalAmount,
					r.usedAmount,
					r.itemName,
					r.itemAmount,
					r.category || '',
					r.expenseDate?.toISOString() || ''
				])
			];
			break;
		}
		case 'log': {
			const results = await db
				.select({
					userName: users.name,
					action: operationLogs.action,
					targetType: operationLogs.targetType,
					createdAt: operationLogs.createdAt,
					ipAddress: operationLogs.ipAddress
				})
				.from(operationLogs)
				.leftJoin(users, eq(operationLogs.userId, users.id))
				.orderBy(desc(operationLogs.createdAt))
				.limit(10000);

			data = [
				['操作用户', '操作类型', '目标类型', '操作时间', 'IP地址'],
				...results.map((r) => [
					r.userName || '系统',
					r.action,
					r.targetType || '',
					r.createdAt.toISOString(),
					r.ipAddress || ''
				])
			];
			break;
		}
	}

	return data;
}
