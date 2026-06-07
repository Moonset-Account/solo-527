export type StageType = 'resume' | 'screen' | 'interview_1' | 'interview_2' | 'interview_3' | 'offer' | 'onboard';

export type CandidateStatus = 'in_progress' | 'hired' | 'rejected' | 'offer_declined';

export type ResultType = 'pass' | 'fail' | 'pending';

export interface StageRecord {
  id: string;
  candidateId: string;
  stage: StageType;
  stageName: string;
  startDate: Date;
  endDate?: Date;
  interviewerId?: string;
  interviewerName?: string;
  result?: ResultType;
  durationDays?: number;
  notes?: string;
  isAnomaly: boolean;
  anomalyReason?: string;
}

export interface Feedback {
  id: string;
  candidateId: string;
  stage: StageType;
  satisfaction: number;
  comments: string;
  submitDate: Date;
  keywords: string[];
}

export interface Candidate {
  id: string;
  name: string;
  positionId: string;
  positionName: string;
  departmentId: string;
  departmentName: string;
  channelId: string;
  channelName: string;
  recruiterId: string;
  recruiterName: string;
  applyDate: Date;
  currentStage: StageType;
  currentStageName: string;
  status: CandidateStatus;
  stages: StageRecord[];
  feedback?: Feedback;
  totalCycleDays?: number;
}

export interface Department {
  id: string;
  name: string;
}

export interface Position {
  id: string;
  name: string;
  departmentId: string;
  departmentName: string;
  recruiterId: string;
  recruiterName: string;
  publishDate: Date;
  status: 'open' | 'closed' | 'paused';
  headCount: number;
}

export interface Recruiter {
  id: string;
  name: string;
  departmentId: string;
  departmentName: string;
}

export interface Interviewer {
  id: string;
  name: string;
  department: string;
  interviewCount: number;
  totalHours: number;
}

export interface Channel {
  id: string;
  name: string;
  type: 'free' | 'paid' | 'referral' | 'campus';
  costPerCandidate: number;
}

export interface FilterState {
  dateRange: [Date, Date];
  departments: string[];
  positions: string[];
  recruiters: string[];
  channels: string[];
  stages: StageType[];
  status: CandidateStatus[];
}

export interface KPIData {
  positionCount: number;
  resumeCount: number;
  interviewCount: number;
  offerCount: number;
  onboardCount: number;
  avgCycleDays: number;
  conversionRate: number;
  offerAcceptRate: number;
}

export interface TrendDataPoint {
  date: string;
  resumeCount: number;
  interviewCount: number;
  offerCount: number;
  onboardCount: number;
}

export interface FunnelDataPoint {
  stage: string;
  stageType: StageType;
  count: number;
  conversionRate: number;
}

export interface StageDurationData {
  stage: string;
  stageType: StageType;
  avgDays: number;
  medianDays: number;
  p75Days: number;
  p90Days: number;
  minDays: number;
  maxDays: number;
}

export interface ChannelQualityData {
  channelId: string;
  channelName: string;
  resumeCount: number;
  interviewRate: number;
  offerRate: number;
  onboardRate: number;
  costPerHire: number;
  qualityScore: number;
}

export interface InterviewerLoadData {
  interviewerId: string;
  interviewerName: string;
  department: string;
  interviewCount: number;
  totalHours: number;
  avgPerWeek: number;
}

export interface DataQualityReport {
  totalRecords: number;
  missingFields: { field: string; count: number; percentage: number }[];
  anomalyCount: number;
  duplicateCount: number;
  dataCompleteness: number;
}

export interface DataDictionaryItem {
  fieldName: string;
  displayName: string;
  description: string;
  type: string;
  enumValues?: { value: string; label: string }[];
  unit?: string;
}
