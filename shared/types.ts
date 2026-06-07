export interface FilterParams {
  positions?: string[];
  departments?: string[];
  recruiters?: string[];
  channels?: string[];
  stages?: string[];
  interviewerScope?: string;
  dateRange: { start: string; end: string };
}

export type StageName = "posted" | "applied" | "screened" | "interviewed" | "offered" | "hired";

export interface FunnelStage {
  stage: StageName;
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
  avgSatisfaction: number;
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

export type UserRole = "hr_admin" | "recruiting_manager" | "interviewer";

export interface CandidateExperience {
  avgSatisfaction: number;
  totalFeedbacks: number;
  satisfactionDistribution: Record<string, number>;
  avgFeedbackDelayHours: number;
}

export interface ApiResponse<T> {
  data: T;
  meta: {
    filters: FilterParams;
    generatedAt: string;
    cacheHit: boolean;
  };
}
