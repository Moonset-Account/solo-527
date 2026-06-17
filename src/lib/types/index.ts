export interface ProjectWithStats {
	id: string;
	title: string;
	description: string | null;
	coverImage: string | null;
	category: string | null;
	startDate: Date;
	endDate: Date;
	status: string;
	location: string | null;
	targetHours: string | null;
	managerName: string | null;
	totalVolunteers: number;
	totalHours: number;
	shiftCount: number;
}

export interface ShiftWithDetails {
	id: string;
	projectId: string;
	name: string;
	startTime: Date;
	endTime: Date;
	maxParticipants: number;
	location: string | null;
	description: string | null;
	registeredCount: number;
	isRegistered: boolean;
	registrationId: string | null;
}

export interface SigninRecordWithDetails {
	id: string;
	userId: string;
	shiftId: string;
	signinTime: Date;
	signoutTime: Date | null;
	durationHours: string | null;
	status: string;
	location: string | null;
	projectName: string;
	shiftName: string;
	userName: string;
}

export interface MaterialWithFlows {
	id: string;
	projectId: string;
	name: string;
	initialQuantity: number;
	currentQuantity: number;
	unit: string | null;
	category: string | null;
	flows: MaterialFlow[];
}

export interface FeedbackProcessingWithDetails extends FeedbackProcessing {
	processorName: string;
}

export interface FeedbackWithDetails {
	id: string;
	userId: string;
	projectId: string;
	type: string;
	content: string;
	urgency: string;
	status: string;
	createdAt: Date;
	userName: string;
	projectName: string;
	processings: FeedbackProcessingWithDetails[];
}

export interface ExportTaskWithUser {
	id: string;
	userId: string;
	exportType: string;
	filters: Record<string, unknown> | null;
	status: string;
	fileUrl: string | null;
	fileName: string | null;
	progress: number;
	createdAt: Date;
	completedAt: Date | null;
	userName: string;
}

export type UserRole = 'volunteer' | 'manager' | 'admin';

export type ProjectStatus = 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';

export type RegistrationStatus = 'registered' | 'canceled' | 'attended' | 'absent';

export type SigninStatus = 'pending' | 'confirmed' | 'rejected';

export type FeedbackStatus = 'pending' | 'processing' | 'resolved' | 'closed';

export type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface PaginationParams {
	page: number;
	pageSize: number;
}

export interface SortParams {
	field: string;
	order: 'asc' | 'desc';
}

export interface ApiResponse<T> {
	data: T;
	message?: string;
	success: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
}

export interface ProjectFilters {
	status?: ProjectStatus[];
	category?: string[];
	startDate?: string;
	endDate?: string;
	keyword?: string;
}

export interface ServiceRecordFilters {
	projectId?: string;
	startDate?: string;
	endDate?: string;
	status?: SigninStatus[];
}

export interface LogFilters {
	action?: string;
	userId?: string;
	startDate?: string;
	endDate?: string;
	targetType?: string;
}

export interface ExportFilters {
	type: 'signin' | 'project' | 'budget' | 'user' | 'log';
	dateRange?: {
		start: string;
		end: string;
	};
	projectId?: string;
	status?: string[];
	format: 'csv' | 'excel';
}
