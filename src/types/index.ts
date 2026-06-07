export type PatientType = '普通' | '急诊' | '复诊' | 'VIP';

export type ProcessNode = '挂号' | '签到' | '分诊' | '叫号' | '缴费' | '取药';

export interface VisitRecord {
	visitId: string;
	department: string;
	doctor: string;
	patientType: PatientType;
	timeSlot: string;
	registerTime: Date | null;
	checkInTime: Date | null;
	triageTime: Date | null;
	callTime: Date | null;
	paymentTime: Date | null;
	pickupTime: Date | null;
	waitCheckIn?: number;
	waitTriage?: number;
	waitCall?: number;
	waitPayment?: number;
	waitPickup?: number;
	totalWait?: number;
	isAnomaly: boolean;
	anomalyReason?: string;
}

export interface FilterParams {
	departments: string[];
	doctors: string[];
	timeSlots: string[];
	patientTypes: PatientType[];
	dateRange: { start: Date; end: Date };
	processNodes: ProcessNode[];
	excludeAnomalies: boolean;
}

export interface WaitTimeStats {
	node: string;
	avg: number;
	median: number;
	p95: number;
	min: number;
	max: number;
	count: number;
}

export interface SankeyNode {
	name: string;
	value?: number;
}

export interface SankeyLink {
	source: string;
	target: string;
	value: number;
	waitTime: number;
}

export interface SankeyData {
	nodes: SankeyNode[];
	links: SankeyLink[];
}

export interface HistogramBin {
	start: number;
	end: number;
	count: number;
}

export interface DepartmentCompareItem {
	department: string;
	avgWaitTime: number;
	medianWaitTime: number;
	patientCount: number;
	bottleneckNode: string;
}

export interface IntradayTrendPoint {
	hour: number;
	timeSlot: string;
	avgWaitTime: number;
	patientCount: number;
}

export interface MetricDefinition {
	key: string;
	name: string;
	definition: string;
	calculation: string;
	limitations: string[];
}

export interface AnomalyNote {
	id: number;
	visitId: string;
	reason: string;
	notedBy: string;
	notedAt: Date;
}

export interface ImportResult {
	success: number;
	failed: number;
	errors: string[];
	warnings: string[];
}

export interface OverviewStats {
	totalPatients: number;
	totalAvgWaitTime: number;
	longestWaitNode: string;
	longestWaitTime: number;
	busiestDepartment: string;
	busiestTimeSlot: string;
	anomalyCount: number;
	dataDateRange: { start: Date; end: Date };
}

export type UserRole = 'public' | 'manager' | 'analyst';

export interface DataDictionaryItem {
	key: string;
	name: string;
	type: string;
	description: string;
	example?: string;
}
