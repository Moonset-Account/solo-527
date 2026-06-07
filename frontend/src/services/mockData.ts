import { 
  FilterOptions, 
  AnomalySummary, 
  RetentionCohortResponse,
  CourseHeatmapResponse,
  CoachLoadResponse,
  ChurnWarningResponse
} from '@/types';

export const mockFilterOptions: FilterOptions = {
  stores: [
    { id: 1, name: "朝阳旗舰店" },
    { id: 2, name: "海淀分店" },
    { id: 3, name: "浦东分店" },
  ],
  coaches: [
    { id: 1, name: "张教练", store: "朝阳旗舰店" },
    { id: 2, name: "李教练", store: "海淀分店" },
    { id: 3, name: "王教练", store: "浦东分店" },
    { id: 4, name: "刘教练", store: "朝阳旗舰店" },
    { id: 5, name: "陈教练", store: "海淀分店" },
    { id: 6, name: "杨教练", store: "浦东分店" },
    { id: 7, name: "赵教练", store: "朝阳旗舰店" },
    { id: 8, name: "黄教练", store: "海淀分店" },
    { id: 9, name: "周教练", store: "浦东分店" },
    { id: 10, name: "吴教练", store: "朝阳旗舰店" },
  ],
  courses: [
    { id: 1, name: "瑜伽基础", category: "瑜伽" },
    { id: 2, name: "动感单车", category: "有氧" },
    { id: 3, name: "力量训练", category: "力量" },
    { id: 4, name: "HIIT燃脂", category: "有氧" },
    { id: 5, name: "普拉提", category: "瑜伽" },
    { id: 6, name: "拳击课", category: "格斗" },
    { id: 7, name: "游泳课", category: "水上" },
  ],
  memberTypes: [
    { id: 1, name: "月卡" },
    { id: 2, name: "季卡" },
    { id: 3, name: "年卡" },
    { id: 4, name: "私教会员" },
  ],
};

export const mockAnomalySummary: AnomalySummary = {
  anomalies: [
    {
      type: "checkin_volume",
      severity: "high",
      message: "近30天签到量环比30天下降52.3%，需关注会员活跃情况",
      value: -0.523
    },
    {
      type: "churn_rate",
      severity: "medium",
      message: "当前月流失率达15.8%，接近20%警戒线",
      value: 0.158
    },
    {
      type: "booking_cancel",
      severity: "medium",
      message: "近30天课程取消率达28.5%，建议优化课程安排",
      value: 0.285
    },
  ],
  warnings: [],
  summary_stats: {
    active_members: 386,
    checkins_30d: 2847,
    churn_rate: 0.158,
    avg_rating: 4.2
  }
};

export const mockRetentionCohort: RetentionCohortResponse = {
  cohort_data: [
    {
      cohort_month: "2024-01",
      cohort_size: 85,
      retention: [1.0, 0.68, 0.52, 0.45, 0.38, 0.32, 0.28],
      sample_warning: false
    },
    {
      cohort_month: "2024-02",
      cohort_size: 72,
      retention: [1.0, 0.72, 0.58, 0.48, 0.42, 0.35, null],
      sample_warning: false
    },
    {
      cohort_month: "2024-03",
      cohort_size: 93,
      retention: [1.0, 0.75, 0.62, 0.53, 0.44, null, null],
      sample_warning: false
    },
    {
      cohort_month: "2024-04",
      cohort_size: 68,
      retention: [1.0, 0.70, 0.55, 0.46, null, null, null],
      sample_warning: false
    },
    {
      cohort_month: "2024-05",
      cohort_size: 45,
      retention: [1.0, 0.78, 0.60, null, null, null, null],
      sample_warning: true
    },
    {
      cohort_month: "2024-06",
      cohort_size: 23,
      retention: [1.0, 0.65, null, null, null, null, null],
      sample_warning: true
    },
  ],
  warnings: ["2024-05组样本量不足（当前45人，建议不少于30人）", "2024-06组样本量不足（当前23人，建议不少于30人）"],
  months: 6
};

export const mockCourseHeatmap: CourseHeatmapResponse = {
  courses: [
    {
      course_id: 2,
      name: "动感单车",
      category: "有氧",
      total_bookings: 428,
      capacity: 30,
      booking_rate: 0.85,
      checkin_rate: 0.92,
      cancel_rate: 0.08,
      hot_score: 0.88
    },
    {
      course_id: 4,
      name: "HIIT燃脂",
      category: "有氧",
      total_bookings: 356,
      capacity: 25,
      booking_rate: 0.82,
      checkin_rate: 0.88,
      cancel_rate: 0.12,
      hot_score: 0.82
    },
    {
      course_id: 1,
      name: "瑜伽基础",
      category: "瑜伽",
      total_bookings: 312,
      capacity: 20,
      booking_rate: 0.78,
      checkin_rate: 0.85,
      cancel_rate: 0.15,
      hot_score: 0.76
    },
    {
      course_id: 6,
      name: "拳击课",
      category: "格斗",
      total_bookings: 198,
      capacity: 10,
      booking_rate: 0.88,
      checkin_rate: 0.75,
      cancel_rate: 0.25,
      hot_score: 0.74
    },
    {
      course_id: 3,
      name: "力量训练",
      category: "力量",
      total_bookings: 275,
      capacity: 15,
      booking_rate: 0.72,
      checkin_rate: 0.80,
      cancel_rate: 0.20,
      hot_score: 0.72
    },
    {
      course_id: 5,
      name: "普拉提",
      category: "瑜伽",
      total_bookings: 156,
      capacity: 12,
      booking_rate: 0.65,
      checkin_rate: 0.82,
      cancel_rate: 0.18,
      hot_score: 0.68
    },
    {
      course_id: 7,
      name: "游泳课",
      category: "水上",
      total_bookings: 134,
      capacity: 15,
      booking_rate: 0.58,
      checkin_rate: 0.75,
      cancel_rate: 0.25,
      hot_score: 0.60
    },
  ],
  warnings: []
};

export const mockCoachLoad: CoachLoadResponse = {
  coaches: [
    {
      coach_id: 1,
      name: "张教练",
      level: "资深",
      store: "朝阳旗舰店",
      weekly_hours: 28.5,
      student_count: 32,
      pt_conversion: 0.45,
      retention_rate: 0.82
    },
    {
      coach_id: 2,
      name: "李教练",
      level: "高级",
      store: "海淀分店",
      weekly_hours: 24.0,
      student_count: 28,
      pt_conversion: 0.38,
      retention_rate: 0.75
    },
    {
      coach_id: 3,
      name: "王教练",
      level: "中级",
      store: "浦东分店",
      weekly_hours: 18.5,
      student_count: 22,
      pt_conversion: 0.32,
      retention_rate: 0.68
    },
    {
      coach_id: 4,
      name: "刘教练",
      level: "高级",
      store: "朝阳旗舰店",
      weekly_hours: 32.0,
      student_count: 35,
      pt_conversion: 0.52,
      retention_rate: 0.88
    },
    {
      coach_id: 5,
      name: "陈教练",
      level: "中级",
      store: "海淀分店",
      weekly_hours: 15.0,
      student_count: 18,
      pt_conversion: 0.28,
      retention_rate: 0.62
    },
    {
      coach_id: 6,
      name: "杨教练",
      level: "初级",
      store: "浦东分店",
      weekly_hours: 12.0,
      student_count: 12,
      pt_conversion: 0.20,
      retention_rate: 0.55
    },
    {
      coach_id: 7,
      name: "赵教练",
      level: "资深",
      store: "朝阳旗舰店",
      weekly_hours: 26.5,
      student_count: 30,
      pt_conversion: 0.48,
      retention_rate: 0.80
    },
    {
      coach_id: 8,
      name: "黄教练",
      level: "高级",
      store: "海淀分店",
      weekly_hours: 22.0,
      student_count: 25,
      pt_conversion: 0.35,
      retention_rate: 0.72
    },
    {
      coach_id: 9,
      name: "周教练",
      level: "中级",
      store: "浦东分店",
      weekly_hours: 16.5,
      student_count: 20,
      pt_conversion: 0.30,
      retention_rate: 0.65
    },
    {
      coach_id: 10,
      name: "吴教练",
      level: "初级",
      store: "朝阳旗舰店",
      weekly_hours: 10.0,
      student_count: 10,
      pt_conversion: 0.18,
      retention_rate: 0.50
    },
  ],
  warnings: []
};

export const mockChurnWarning: ChurnWarningResponse = {
  high_risk_count: 12,
  medium_risk_count: 28,
  low_risk_count: 45,
  members: [
    {
      member_id: 1001,
      name: "王伟",
      member_type: "年卡",
      store: "朝阳旗舰店",
      join_date: "2024-01-15",
      last_checkin: "2024-05-20",
      days_inactive: 35,
      avg_weekly_freq: 2.8,
      risk_level: "高风险"
    },
    {
      member_id: 1045,
      name: "李娜",
      member_type: "私教会员",
      store: "海淀分店",
      join_date: "2024-02-20",
      last_checkin: "2024-05-25",
      days_inactive: 30,
      avg_weekly_freq: 3.2,
      risk_level: "高风险"
    },
    {
      member_id: 1089,
      name: "张强",
      member_type: "季卡",
      store: "浦东分店",
      join_date: "2024-03-10",
      last_checkin: "2024-05-28",
      days_inactive: 27,
      avg_weekly_freq: 2.1,
      risk_level: "高风险"
    },
    {
      member_id: 1123,
      name: "刘芳",
      member_type: "年卡",
      store: "朝阳旗舰店",
      join_date: "2024-01-08",
      last_checkin: "2024-06-02",
      days_inactive: 22,
      avg_weekly_freq: 1.8,
      risk_level: "中风险"
    },
    {
      member_id: 1156,
      name: "陈明",
      member_type: "月卡",
      store: "海淀分店",
      join_date: "2024-04-01",
      last_checkin: "2024-06-05",
      days_inactive: 19,
      avg_weekly_freq: 1.5,
      risk_level: "中风险"
    },
    {
      member_id: 1189,
      name: "杨丽",
      member_type: "季卡",
      store: "浦东分店",
      join_date: "2024-03-15",
      last_checkin: "2024-06-08",
      days_inactive: 16,
      avg_weekly_freq: 1.2,
      risk_level: "中风险"
    },
    {
      member_id: 1201,
      name: "赵磊",
      member_type: "月卡",
      store: "朝阳旗舰店",
      join_date: "2024-05-01",
      last_checkin: "2024-06-10",
      days_inactive: 14,
      avg_weekly_freq: 0.8,
      risk_level: "低风险"
    },
    {
      member_id: 1234,
      name: "黄敏",
      member_type: "年卡",
      store: "海淀分店",
      join_date: "2024-02-10",
      last_checkin: "2024-06-12",
      days_inactive: 12,
      avg_weekly_freq: 2.5,
      risk_level: "低风险"
    },
  ],
  warnings: []
};
