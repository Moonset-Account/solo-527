export type ActivityType = 'video' | 'homework' | 'quiz' | 'discussion' | 'certificate';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export type TimePreset = 'day' | 'week' | 'month' | 'custom';

export interface Student {
  id: string;
  name: string;
  cohortId: string;
  isMakeup: boolean;
  enrollDate: string;
}

export interface Course {
  id: string;
  name: string;
  description: string;
}

export interface Chapter {
  id: string;
  courseId: string;
  name: string;
  order: number;
}

export interface Cohort {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export interface Question {
  id: string;
  chapterId: string;
  title: string;
  difficulty: DifficultyLevel;
}

export interface LearningActivity {
  id: string;
  studentId: string;
  courseId: string;
  chapterId: string;
  activityType: ActivityType;
  questionId?: string;
  completedAt: string | null;
  firstCompletedAt: string | null;
  score?: number;
  isCorrect?: boolean;
}

export interface FilterState {
  courseIds: string[];
  chapterIds: string[];
  studentIds: string[];
  cohortIds: string[];
  questionIds: string[];
  timeRange: {
    start: string;
    end: string;
    preset: TimePreset;
  };
}

export interface FunnelNode {
  name: string;
  value: number;
  conversionRate: number;
  dropoutRate: number;
  isDropoutPoint: boolean;
  activityType: ActivityType;
}

export interface CorrectRateItem {
  chapterId: string;
  chapterName: string;
  correctRate: number;
  totalAttempts: number;
  isAbnormal: boolean;
  abnormalReason?: string;
}

export interface CohortMetric {
  cohortId: string;
  cohortName: string;
  videoCompletionRate: number;
  homeworkSubmissionRate: number;
  quizPassRate: number;
  discussionParticipationRate: number;
  certificateRate: number;
  sampleSize: number;
}

export interface KPICardData {
  title: string;
  value: number;
  unit: string;
  trend: number;
  sampleSize: number;
  isLowSample: boolean;
}

export interface SavedView {
  id: string;
  name: string;
  filters: FilterState;
  createdAt: string;
}

export interface ExportMetadata {
  exportAt: string;
  filters: FilterState;
  sampleSize: number;
  dataRange: { start: string; end: string };
}

export interface ValidationResult {
  hasMissingValues: boolean;
  missingCount: number;
  hasAnomalies: boolean;
  anomalyCount: number;
  sampleSize: number;
  warnings: string[];
}

export interface DropoutStudent {
  studentId: string;
  studentName: string;
  cohortId: string;
  cohortName: string;
  lastActivityAt: string | null;
  isMakeup: boolean;
}
