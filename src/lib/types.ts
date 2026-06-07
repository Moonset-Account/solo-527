export type FunnelStage = {
  key: string;
  label: string;
};

export type FunnelFilter = {
  campusIds?: string[];
  courseIds?: string[];
  ageGroups?: string[];
  channels?: string[];
  dateRange?: { start: Date; end: Date };
};

export type FunnelData = {
  stage: string;
  count: number;
  rate: number;
};

export type FunnelResponse = {
  stages: FunnelData[];
  filters: FunnelFilter;
};

export type WaitlistEntry = {
  id: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  campusId: string;
  campusName: string;
  position: number;
  status: string;
  channel: string;
  originalEnrollTime: Date;
  convertedTime?: Date | null;
  waitDays?: number | null;
};

export type AdjustRequest = {
  entryId: string;
  newPosition: number;
  reason: string;
};

export type AdjustRecord = {
  id: string;
  entryId: string;
  operatorId: string;
  operatorName: string;
  oldPosition: number;
  newPosition: number;
  reason: string;
  createdAt: Date;
};

export type CourseRanking = {
  courseId: string;
  courseName: string;
  campusName: string;
  waitlistCount: number;
  capacity: number;
  avgWaitDays: number;
  lowSample: boolean;
  suggestion: "urgent" | "recommended" | "normal";
};

export type ExportConfig = {
  format: "xlsx" | "csv";
  filename: string;
  sheets?: { name: string; data: Record<string, unknown>[] }[];
};

export type MetricsData = {
  totalWaitlist: number;
  avgWaitDays: number;
  conversionRate: number;
  refundRate: number;
};

export type TrendData = {
  date: string;
  waitlistCount: number;
  conversionRate: number;
};
