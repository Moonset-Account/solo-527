import {
	mockProjects,
	mockShifts,
	mockMaterials,
	mockMaterialFlows,
	mockPhotos,
	mockBudget,
	mockSigninRecords,
	mockFeedbacks,
	mockLogs,
	mockExportTasks,
	currentUser,
	mockUsers
} from './data';
import type {
	ProjectWithStats,
	ShiftWithDetails,
	SigninRecordWithDetails,
	FeedbackWithDetails,
	ExportTaskWithUser,
	ProjectFilters,
	PaginationParams,
	ServiceRecordFilters,
	LogFilters
} from '$lib/types';
import type { Material, MaterialFlow, Photo, OperationLog } from '$lib/server/db/schema';

export async function mockGetProjects(
	filters: ProjectFilters = {},
	pagination: PaginationParams = { page: 1, pageSize: 12 }
): Promise<{ data: ProjectWithStats[]; total: number }> {
	await new Promise((r) => setTimeout(r, 200));

	let filtered = [...mockProjects];

	if (filters.status?.length) {
		filtered = filtered.filter((p) => filters.status?.includes(p.status as never));
	}
	if (filters.category?.length) {
		filtered = filtered.filter((p) => filters.category?.includes(p.category as never));
	}
	if (filters.keyword) {
		const kw = filters.keyword.toLowerCase();
		filtered = filtered.filter(
			(p) => p.title.toLowerCase().includes(kw) || p.description?.toLowerCase().includes(kw)
		);
	}

	const start = (pagination.page - 1) * pagination.pageSize;
	const end = start + pagination.pageSize;

	return {
		data: filtered.slice(start, end),
		total: filtered.length
	};
}

export async function mockGetProjectById(
	id: string
): Promise<{
	project: ProjectWithStats;
	shifts: ShiftWithDetails[];
	materials: Material[];
	photos: Photo[];
	budget: (typeof mockBudget)[string] | null;
} | null> {
	await new Promise((r) => setTimeout(r, 300));

	const project = mockProjects.find((p) => p.id === id);
	if (!project) return null;

	return {
		project,
		shifts: mockShifts[id] || [],
		materials: mockMaterials[id] || [],
		photos: mockPhotos[id] || [],
		budget: mockBudget[id] || null
	};
}

export async function mockGetMaterialFlows(materialId: string): Promise<MaterialFlow[]> {
	await new Promise((r) => setTimeout(r, 100));
	return mockMaterialFlows[materialId] || [];
}

export async function mockGetHoursByProject(projectId: string): Promise<{ date: string; hours: number }[]> {
	await new Promise((r) => setTimeout(r, 100));
	return [
		{ date: '2025-06-07', hours: 25.5 },
		{ date: '2025-06-08', hours: 18.0 },
		{ date: '2025-06-10', hours: 32.0 },
		{ date: '2025-06-11', hours: 15.5 },
		{ date: '2025-06-14', hours: 28.5 },
		{ date: '2025-06-15', hours: 22.0 }
	];
}

export async function mockGetUserSigninRecords(
	userId: string,
	filters: ServiceRecordFilters = {},
	pagination: PaginationParams = { page: 1, pageSize: 20 }
): Promise<{ data: SigninRecordWithDetails[]; total: number }> {
	await new Promise((r) => setTimeout(r, 200));

	let filtered = mockSigninRecords.filter((r) => r.userId === userId);

	if (filters.projectId) {
		filtered = filtered.filter((r) => r.projectName === mockProjects.find((p) => p.id === filters.projectId)?.title);
	}
	if (filters.status?.length) {
		filtered = filtered.filter((r) => filters.status?.includes(r.status as never));
	}

	const start = (pagination.page - 1) * pagination.pageSize;
	const end = start + pagination.pageSize;

	return {
		data: filtered.slice(start, end),
		total: filtered.length
	};
}

export async function mockGetAllFeedbacks(): Promise<FeedbackWithDetails[]> {
	await new Promise((r) => setTimeout(r, 200));
	return mockFeedbacks;
}

export async function mockGetPendingFeedbacks(): Promise<FeedbackWithDetails[]> {
	await new Promise((r) => setTimeout(r, 200));
	return mockFeedbacks.filter((f) => f.status === 'pending' || f.status === 'processing');
}

export async function mockGetFeedbackById(id: string): Promise<FeedbackWithDetails | null> {
	await new Promise((r) => setTimeout(r, 100));
	return mockFeedbacks.find((f) => f.id === id) || null;
}

export async function mockGetAllBudgets(): Promise<
	(typeof mockBudget)[string] & { projectName: string | null }[]
> {
	await new Promise((r) => setTimeout(r, 150));
	return Object.values(mockBudget).map((b) => ({
		...b,
		projectName: mockProjects.find((p) => p.id === b.projectId)?.title || null
	}));
}

export async function mockGetLogs(
	filters: LogFilters = {},
	pagination: PaginationParams = { page: 1, pageSize: 50 }
): Promise<{
	data: (OperationLog & { userName: string | null })[];
	total: number;
}> {
	await new Promise((r) => setTimeout(r, 200));

	let filtered = [...mockLogs];

	if (filters.action) {
		filtered = filtered.filter((l) => l.action === filters.action);
	}
	if (filters.userId) {
		filtered = filtered.filter((l) => l.userId === filters.userId);
	}
	if (filters.targetType) {
		filtered = filtered.filter((l) => l.targetType === filters.targetType);
	}

	const start = (pagination.page - 1) * pagination.pageSize;
	const end = start + pagination.pageSize;

	return {
		data: filtered.slice(start, end),
		total: filtered.length
	};
}

export async function mockGetExportTasks(): Promise<ExportTaskWithUser[]> {
	await new Promise((r) => setTimeout(r, 100));
	return mockExportTasks;
}

export async function mockRegisterForShift(
	userId: string,
	shiftId: string
): Promise<{ success: boolean; message: string }> {
	await new Promise((r) => setTimeout(r, 300));
	return { success: true, message: '报名成功！' };
}

export async function mockCancelRegistration(registrationId: string): Promise<boolean> {
	await new Promise((r) => setTimeout(r, 200));
	return true;
}

export async function mockSignin(
	userId: string,
	shiftId: string,
	location?: string
): Promise<{ success: boolean; message: string; isSignout?: boolean }> {
	await new Promise((r) => setTimeout(r, 300));
	return { success: true, message: '签到成功！', isSignout: false };
}

export async function mockProcessFeedback(
	feedbackId: string,
	processorId: string,
	data: {
		affectedParties: string;
		responsiblePerson: string;
		nextSteps: string;
		processingResult?: string;
		status?: string;
	}
): Promise<boolean> {
	await new Promise((r) => setTimeout(r, 300));

	const feedback = mockFeedbacks.find((f) => f.id === feedbackId);
	if (feedback) {
		const processor = mockUsers.find((u) => u.id === processorId);
		const newProcessing = {
			id: `processing-${Date.now()}`,
			feedbackId,
			processorId,
			processorName: processor?.name || '未知',
			affectedParties: data.affectedParties,
			responsiblePerson: data.responsiblePerson,
			nextSteps: data.nextSteps,
			processingResult: data.processingResult || '',
			status: data.status || 'processing',
			processedAt: new Date()
		};
		feedback.processings.push(newProcessing as never);
		if (data.status) {
			feedback.status = data.status;
		}
		return true;
	}
	return false;
}

export async function mockCreateExportTask(
	userId: string,
	exportType: string,
	filters: Record<string, unknown>
): Promise<boolean> {
	await new Promise((r) => setTimeout(r, 300));
	return true;
}

export async function mockLogin(
	email: string,
	password: string
): Promise<{ success: boolean; user?: (typeof mockUsers)[number]; message?: string }> {
	await new Promise((r) => setTimeout(r, 300));
	const user = mockUsers.find((u) => u.email === email);
	if (user) {
		return { success: true, user };
	}
	return { success: false, message: '邮箱或密码错误' };
}

export function getCurrentUser() {
	return currentUser;
}

export function getAllUsers() {
	return mockUsers;
}

export function getProjectCategories() {
	return [...new Set(mockProjects.map((p) => p.category).filter(Boolean))];
}
