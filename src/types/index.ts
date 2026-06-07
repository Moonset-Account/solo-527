export type UserRole = "agent" | "supervisor" | "admin";

export interface FilterContext {
  dateRange: { start: string; end: string };
  teamIds: string[];
  staffIds: string[];
  timeGranularity: "hour" | "day" | "week";
}

export interface Team {
  id: string;
  name: string;
  supervisorId?: string;
  staffCount?: number;
}

export interface Staff {
  id: string;
  name: string;
  teamId: string;
  team?: Team;
  role: UserRole;
  isProbation: boolean;
  probationEndDate?: string;
  avatar?: string;
}

export interface StaffMetrics {
  staffId: string;
  staffName: string;
  isProbation: boolean;
  sessionCount: number;
  avgWaitTime: number;
  avgDuration: number;
  transferRate: number;
  avgQualityScore: number;
  satisfaction: number;
  workloadScore: number;
}

export interface TeamWorkload {
  teamId: string;
  teamName: string;
  hour: number;
  workload: number;
  sessionCount: number;
  avgWaitTime: number;
  staffOnDuty: number;
}

export interface TimeoutTrendPoint {
  time: string;
  avgWaitTime: number;
  timeoutCount: number;
  timeoutRate: number;
  sessionCount: number;
}

export interface TagDistribution {
  tagName: string;
  count: number;
  percentage: number;
  category?: string;
}

export interface Schedule {
  id: string;
  staffId: string;
  staff?: Staff;
  date: string;
  startHour: number;
  endHour: number;
  shiftType: string;
}

export interface ScheduleChange {
  id: string;
  scheduleId: string;
  beforeSnapshot: Record<string, unknown>;
  afterSnapshot: Record<string, unknown>;
  changedBy: string;
  changedAt: string;
  reason?: string;
}

export interface DashboardMetrics {
  totalSessions: number;
  avgWaitTime: number;
  avgQualityScore: number;
  timeoutRate: number;
  transferRate: number;
  avgSatisfaction: number;
  staffOnDuty: number;
  totalStaff: number;
  trends: {
    sessions: number;
    waitTime: number;
    quality: number;
    timeout: number;
  };
}

export interface QualitySession {
  id: string;
  staffName: string;
  startTime: string;
  score: number;
  comments?: string;
  isRestricted: boolean;
  tags: string[];
}

export interface WorkloadSnapshot {
  date: string;
  teams: TeamWorkload[];
  timestamp: string;
}
