export interface FilterState {
  memberTypeIds: number[];
  storeIds: number[];
  coachIds: number[];
  courseIds: number[];
  month?: string;
}

export interface FilterOptions {
  stores: { id: number; name: string }[];
  coaches: { id: number; name: string; store: string }[];
  courses: { id: number; name: string; category: string }[];
  memberTypes: { id: number; name: string }[];
}

export interface AnomalySummary {
  anomalies: {
    type: string;
    severity: 'high' | 'medium' | 'low';
    message: string;
    value: number;
  }[];
  warnings: string[];
  summary_stats: {
    active_members: number;
    checkins_30d: number;
    churn_rate: number;
    avg_rating: number | null;
  };
}

export interface CohortData {
  cohort_month: string;
  cohort_size: number;
  retention: (number | null)[];
  sample_warning: boolean;
}

export interface RetentionCohortResponse {
  cohort_data: CohortData[];
  warnings: string[];
  months: number;
}

export interface CourseData {
  course_id: number;
  name: string;
  category: string;
  total_bookings: number;
  capacity: number;
  booking_rate: number;
  checkin_rate: number;
  cancel_rate: number;
  hot_score: number;
}

export interface CourseHeatmapResponse {
  courses: CourseData[];
  warnings: string[];
}

export interface CoachData {
  coach_id: number;
  name: string;
  level: string;
  store: string;
  weekly_hours: number;
  student_count: number;
  pt_conversion: number;
  retention_rate: number;
}

export interface CoachLoadResponse {
  coaches: CoachData[];
  warnings: string[];
}

export interface ChurnMember {
  member_id: number;
  name: string;
  member_type: string;
  store: string;
  join_date: string;
  last_checkin: string;
  days_inactive: number;
  avg_weekly_freq: number;
  risk_level: '高风险' | '中风险' | '低风险';
}

export interface ChurnWarningResponse {
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  members: ChurnMember[];
  warnings: string[];
}
