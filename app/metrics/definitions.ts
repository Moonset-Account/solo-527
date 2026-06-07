export interface MetricDefinition {
  name: string;
  key: string;
  description: string;
  calculation: string;
  unit: string;
  category: "funnel" | "quiz" | "department" | "certificate" | "anomaly";
  dimensions: string[];
  dataSources: string[];
}

export const METRIC_DEFINITIONS: Record<string, MetricDefinition> = {
  enrollment_count: {
    name: "报名人数",
    key: "enrollment_count",
    description: "在指定时间段内的课程报名总人数",
    calculation: "COUNT(DISTINCT user_id) FROM enrollments WHERE status = 'enrolled'",
    unit: "人",
    category: "funnel",
    dimensions: ["department", "course", "cohort", "instructor", "position"],
    dataSources: ["enrollments"],
  },
  checkin_rate: {
    name: "签到率",
    key: "checkin_rate",
    description: "已签到人数占报名人数的比例",
    calculation: "(COUNT(DISTINCT CASE WHEN checkins.checkin_time IS NOT NULL THEN enrollments.user_id END) / COUNT(DISTINCT enrollments.user_id)",
    unit: "%",
    category: "funnel",
    dimensions: ["department", "course", "cohort", "instructor", "position"],
    dataSources: ["enrollments", "checkins"],
  },
  course_completion_rate: {
    name: "课程完成率",
    key: "course_completion_rate",
    description: "完成所有课程学习内容的学员比例",
    calculation: "COUNT(DISTINCT CASE WHEN progress.completion_status = 'completed' THEN user_id END) / COUNT(DISTINCT user_id)",
    unit: "%",
    category: "funnel",
    dimensions: ["department", "course", "cohort", "instructor", "position"],
    dataSources: ["enrollments", "learning_progress"],
  },
  quiz_first_pass_rate: {
    name: "测验首次通过率",
    key: "quiz_first_pass_rate",
    description: "首次参加测验即通过的学员比例",
    calculation: "COUNT(DISTINCT CASE WHEN attempt_number = 1 AND score >= pass_score THEN user_id END) / COUNT(DISTINCT user_id)",
    unit: "%",
    category: "quiz",
    dimensions: ["department", "course", "cohort", "instructor", "position"],
    dataSources: ["quiz_attempts"],
  },
  quiz_retake_pass_rate: {
    name: "测验补考通过率",
    key: "quiz_retake_pass_rate",
    description: "补考通过测验的学员比例（非首次）",
    calculation: "COUNT(DISTINCT CASE WHEN attempt_number > 1 AND score >= pass_score AND user_id NOT IN (SELECT user_id FROM quiz_attempts WHERE attempt_number = 1 AND score >= pass_score) THEN user_id END) / COUNT(DISTINCT user_id)",
    unit: "%",
    category: "quiz",
    dimensions: ["department", "course", "cohort", "instructor", "position"],
    dataSources: ["quiz_attempts"],
  },
  certificate_rate: {
    name: "证书获得率",
    key: "certificate_rate",
    description: "获得证书的学员比例",
    calculation: "COUNT(DISTINCT CASE WHEN issued_at IS NOT NULL THEN user_id END) / COUNT(DISTINCT user_id)",
    unit: "%",
    category: "funnel",
    dimensions: ["department", "course", "cohort", "instructor", "position"],
    dataSources: ["enrollments", "certificates"],
  },
  average_quiz_score_distribution: {
    name: "测验分数分布",
    key: "average_quiz_score_distribution",
    description: "测验分数在各区间的分布情况",
    calculation: "按分数段统计人数分布",
    unit: "人",
    category: "quiz",
    dimensions: ["department", "course", "cohort", "instructor", "position"],
    dataSources: ["quiz_attempts"],
  },
  department_completion_comparison: {
    name: "部门完成率对比",
    key: "department_completion_comparison",
    description: "各部门之间的课程完成率对比",
    calculation: "按部门分组计算课程完成率",
    unit: "%",
    category: "department",
    dimensions: ["department", "course", "cohort"],
    dataSources: ["enrollments", "learning_progress", "users"],
  },
  certificate_issuance_trend: {
    name: "证书发放趋势",
    key: "certificate_issuance_trend",
    description: "按时间维度统计证书发放数量趋势",
    calculation: "按日期分组统计证书发放数量",
    unit: "张",
    category: "certificate",
    dimensions: ["department", "course", "cohort", "instructor"],
    dataSources: ["certificates"],
  },
  anomaly_low_completion: {
    name: "异常-低完成率",
    key: "anomaly_low_completion",
    description: "完成率低于阈值的课程/部门",
    calculation: "course_completion_rate < 60%",
    unit: "%",
    category: "anomaly",
    dimensions: ["department", "course", "cohort"],
    dataSources: ["enrollments", "learning_progress"],
  },
  anomaly_high_no_show: {
    name: "异常-高未签到率",
    key: "anomaly_high_no_show",
    description: "未签到率高于阈值的班期",
    calculation: "1 - checkin_rate > 30%",
    unit: "%",
    category: "anomaly",
    dimensions: ["cohort", "course", "instructor"],
    dataSources: ["enrollments", "checkins"],
  },
  anomaly_quiz_retake_rate: {
    name: "异常-高补考率",
    key: "anomaly_quiz_retake_rate",
    description: "补考率高于阈值的课程",
    calculation: "(总补考通过人数 / 总通过人数 > 40%",
    unit: "%",
    category: "anomaly",
    dimensions: ["course", "cohort", "instructor"],
    dataSources: ["quiz_attempts"],
  },
};

export const DIMENSION_LABELS: Record<string, string> = {
  department: "部门",
  course: "课程",
  cohort: "班期",
  instructor: "讲师",
  position: "岗位",
  date: "日期",
};

export const SCORE_BUCKETS = [
  { min: 0, max: 59, label: "不及格(<60)" },
  { min: 60, max: 69, label: "及格(60-69)" },
  { min: 70, max: 79, label: "中等(70-79)" },
  { min: 80, max: 89, label: "良好(80-89)" },
  { min: 90, max: 100, label: "优秀(90-100)" },
];

export const THRESHOLDS = {
  LOW_COMPLETION: 60,
  HIGH_NO_SHOW: 30,
  HIGH_RETAKE_RATE: 40,
};
