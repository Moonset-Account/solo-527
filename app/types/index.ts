export interface Filters {
  department_id?: number;
  course_id?: number;
  cohort_id?: number;
  instructor_id?: number;
  position?: string;
}

export interface FunnelMetrics {
  total_enrollments: number;
  checked_in: number;
  completed_course: number;
  quiz_first_pass: number;
  quiz_retake_pass: number;
  quiz_any_pass: number;
  certificates_issued: number;
  checkin_rate: number;
  completion_rate: number;
  first_pass_rate: number;
  retake_pass_rate: number;
  overall_pass_rate: number;
  certificate_rate: number;
}

export interface ScoreBucket {
  label: string;
  min: number;
  max: number;
  count: number;
}

export interface DepartmentMetric {
  department_id: number;
  department_name: string;
  total_enrollments: number;
  completed_count: number;
  completion_rate: number;
  first_pass_rate: number;
  certificate_rate: number;
}

export interface CertificateTrendItem {
  issue_date: string;
  count: number;
  first_pass_count: number;
  retake_pass_count: number;
}

export interface Anomaly {
  type: "low_completion" | "high_no_show" | "high_retake_rate";
  entity_name: string;
  course_name?: string;
  department_name?: string;
  instructor_name?: string;
  value: number;
  threshold: number;
  description: string;
  severity: "high" | "medium" | "low";
}

export interface DimensionOptions {
  departments: Array<{ id: number; name: string }>;
  courses: Array<{ id: number; code: string; name: string }>;
  cohorts: Array<{ id: number; name: string }>;
  instructors: Array<{ id: number; name: string }>;
  positions: string[];
}

export interface DashboardData {
  funnel: FunnelMetrics;
  quizDistribution: ScoreBucket[];
  departmentComparison: DepartmentMetric[];
  certificateTrend: CertificateTrendItem[];
  anomalies: Anomaly[];
  dimensions: DimensionOptions;
  fromCache?: boolean;
  timestamp?: string;
}
