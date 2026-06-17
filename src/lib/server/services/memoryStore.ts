import { mockProjects, mockShifts, mockMaterials, mockMaterialFlows, mockPhotos, mockBudget, mockSigninRecords, mockFeedbacks, mockLogs, mockExportTasks, mockUsers } from '$lib/mock/data';
import type {
	ProjectWithStats,
	ShiftWithDetails,
	FeedbackWithDetails,
	SigninRecordWithDetails,
	ExportTaskWithUser,
	LogFilters,
	PaginationParams,
	ProjectFilters,
	ServiceRecordFilters
} from '$lib/types';

let projects: ProjectWithStats[] = [...mockProjects];
let shiftsByProject: Record<string, ShiftWithDetails[]> = { ...mockShifts };
let materialsByProject: Record<string, any[]> = { ...mockMaterials };
let materialFlowsByMaterial: Record<string, any[]> = { ...mockMaterialFlows };
let photosByProject: Record<string, any[]> = { ...mockPhotos };
let budgetsByProject: Record<string, any> = { ...mockBudget };
let signinRecords: SigninRecordWithDetails[] = [...mockSigninRecords];
let feedbacks: FeedbackWithDetails[] = [...mockFeedbacks];
let logs: any[] = [...mockLogs];
let exportTasks: ExportTaskWithUser[] = [...mockExportTasks];
let users = [...mockUsers];
let registrations: any[] = [];

export const memoryStore = {
	getProjects: () => projects,
	setProjects: (p: ProjectWithStats[]) => { projects = p; },

	getShifts: (projectId: string) => shiftsByProject[projectId] || [],
	setShifts: (projectId: string, s: ShiftWithDetails[]) => { shiftsByProject[projectId] = s; },

	getMaterials: (projectId: string) => materialsByProject[projectId] || [],
	setMaterials: (projectId: string, m: any[]) => { materialsByProject[projectId] = m; },

	getMaterialFlows: (materialId: string) => materialFlowsByMaterial[materialId] || [],
	setMaterialFlows: (materialId: string, f: any[]) => { materialFlowsByMaterial[materialId] = f; },

	getPhotos: (projectId: string) => photosByProject[projectId] || [],
	setPhotos: (projectId: string, p: any[]) => { photosByProject[projectId] = p; },

	getBudget: (projectId: string) => budgetsByProject[projectId] || null,
	setBudget: (projectId: string, b: any) => { budgetsByProject[projectId] = b; },

	getSigninRecords: () => signinRecords,
	setSigninRecords: (r: SigninRecordWithDetails[]) => { signinRecords = r; },

	getFeedbacks: () => feedbacks,
	setFeedbacks: (f: FeedbackWithDetails[]) => { feedbacks = f; },

	getLogs: () => logs,
	setLogs: (l: any[]) => { logs = l; },

	getExportTasks: () => exportTasks,
	setExportTasks: (t: ExportTaskWithUser[]) => { exportTasks = t; },

	getUsers: () => users,
	setUsers: (u: any[]) => { users = u; },

	getRegistrations: () => registrations,
	setRegistrations: (r: any[]) => { registrations = r; }
};

export function generateId(): string {
	return 'id-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
}

export function paginate<T>(arr: T[], page: number, pageSize: number): { data: T[]; total: number } {
	const total = arr.length;
	const start = (page - 1) * pageSize;
	const end = start + pageSize;
	return { data: arr.slice(start, end), total };
}

export function filterLogs(logsArr: any[], filters: LogFilters): any[] {
	return logsArr.filter((log) => {
		if (filters.action && log.action !== filters.action) return false;
		if (filters.userId && log.userId !== filters.userId) return false;
		if (filters.targetType && log.targetType !== filters.targetType) return false;
		if (filters.startDate && new Date(log.createdAt) < new Date(filters.startDate)) return false;
		if (filters.endDate && new Date(log.createdAt) > new Date(filters.endDate)) return false;
		return true;
	});
}

export function filterProjects(projectsArr: ProjectWithStats[], filters: ProjectFilters): ProjectWithStats[] {
	return projectsArr.filter((p) => {
		if (filters.status?.length && !filters.status.includes(p.status as never)) return false;
		if (filters.category?.length && !filters.category.includes(p.category as never)) return false;
		if (filters.keyword) {
			const kw = filters.keyword.toLowerCase();
			if (!p.title.toLowerCase().includes(kw) && !p.description?.toLowerCase().includes(kw)) return false;
		}
		return true;
	});
}
