export type UserRole = "hr_admin" | "recruiting_manager" | "interviewer";

export interface FilterParams {
  positions: string[];
  departments: string[];
  recruiters: string[];
  channels: string[];
  stages: string[];
  dateRange: { start: string; end: string };
}

export interface FunnelStage {
  stage: "posted" | "applied" | "screened" | "interviewed" | "offered" | "hired";
  stageLabel: string;
  count: number;
  conversionRate: number;
  avgDaysInStage: number;
  medianDaysInStage: number;
  p90DaysInStage: number;
}

export interface ChannelMetrics {
  channel: string;
  totalApplied: number;
  conversionRate: number;
  avgTimeToHire: number;
  costPerHire: number;
  stageTimings: Record<string, number>;
  satisfactionScore: number;
}

export interface InterviewerLoad {
  interviewerId: string;
  interviewerName: string;
  department: string;
  totalSessions: number;
  weeklySessions: number[];
  avgFeedbackHours: number;
  feedbackCompletionRate: number;
}

export interface AnomalyAnnotation {
  id: string;
  date: string;
  stage: string;
  metric: string;
  value: number;
  comment: string;
  createdBy: string;
  createdAt: string;
}

export interface MetricDefinition {
  id: string;
  metricName: string;
  definition: string;
  formula: string;
  updateFrequency: string;
}

export interface FilterOptions {
  positions: string[];
  departments: string[];
  recruiters: string[];
  channels: string[];
  stages: string[];
}

export interface ApiResponse<T> {
  data: T;
  meta: {
    filters: FilterParams;
    generatedAt: string;
    cacheHit: boolean;
  };
}
