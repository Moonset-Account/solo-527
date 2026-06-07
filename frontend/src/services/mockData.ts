import { 
  FilterOptions, 
  AnomalySummary, 
  RetentionCohortResponse,
  CourseHeatmapResponse,
  CoachLoadResponse,
  ChurnWarningResponse,
  FilterState
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

export const generateMockAnomalySummary = (filters: FilterState): AnomalySummary => {
  const baseMembers = 386;
  const baseCheckins = 2847;
  
  const storeMultiplier = filters.storeIds?.length ? 0.4 + Math.random() * 0.3 : 1;
  const typeMultiplier = filters.memberTypeIds?.length ? 0.3 + Math.random() * 0.4 : 1;
  const coachMultiplier = filters.coachIds?.length ? 0.2 + Math.random() * 0.5 : 1;
  const monthMultiplier = filters.month ? 0.6 + Math.random() * 0.4 : 1;
  
  const multiplier = storeMultiplier * typeMultiplier * coachMultiplier * monthMultiplier;
  
  const activeMembers = Math.floor(baseMembers * multiplier);
  const checkins30d = Math.floor(baseCheckins * multiplier);
  
  const hasAnomaly = Math.random() > 0.5;
  const churnRate = hasAnomaly ? 0.12 + Math.random() * 0.1 : 0.05 + Math.random() * 0.08;
  const avgRating = 3.8 + Math.random() * 0.8;
  
  const anomalies: any[] = [];
  
  if (churnRate > 0.15) {
    anomalies.push({
      type: "churn_rate",
      severity: churnRate > 0.2 ? "high" : "medium",
      message: `当前月流失率达${(churnRate * 100).toFixed(1)}%，${churnRate > 0.2 ? '超过' : '接近'}20%警戒线`,
      value: churnRate
    });
  }
  
  if (Math.random() > 0.6) {
    const change = (Math.random() - 0.5) * 0.8;
    if (Math.abs(change) > 0.3) {
      anomalies.push({
        type: "checkin_volume",
        severity: Math.abs(change) > 0.5 ? "high" : "medium",
        message: `近30天签到量环比{change > 0 ? '上升' : '下降'}${Math.abs(change * 100).toFixed(1)}%`,
        value: change
      });
    }
  }
  
  const warnings: string[] = [];
  if (activeMembers < 30) {
    warnings.push(`样本量不足（当前${activeMembers}人，建议不少于30人）`);
  }
  
  return {
    anomalies,
    warnings,
    summary_stats: {
      active_members: activeMembers,
      checkins_30d: checkins30d,
      churn_rate: parseFloat(churnRate.toFixed(3)),
      avg_rating: parseFloat(avgRating.toFixed(1))
    }
  };
};

export const generateMockRetentionCohort = (filters: FilterState, months: number = 6): RetentionCohortResponse => {
  const storeFilter = filters.storeIds?.length || 0;
  const typeFilter = filters.memberTypeIds?.length || 0;
  const coachFilter = filters.coachIds?.length || 0;
  const monthFilter = filters.month ? 1 : 0;
  
  const filterIntensity = (storeFilter * 0.3 + typeFilter * 0.3 + coachFilter * 0.2 + monthFilter * 0.2);
  const sizeMultiplier = Math.max(0.2, 1 - filterIntensity * 0.5);
  
  const baseSizes = [85, 72, 93, 68, 45, 23];
  const cohort_data = [];
  const warnings: string[] = [];
  
  const cohortCount = Math.min(6, Math.max(3, 7 - Math.floor(filterIntensity * 3)));
  
  for (let i = 0; i < cohortCount; i++) {
    const cohortSize = Math.floor(baseSizes[i] * sizeMultiplier * (0.8 + Math.random() * 0.4));
    const retention: (number | null)[] = [];
    
    const baseRetention = 1 - filterIntensity * 0.1;
    
    for (let j = 0; j <= months; j++) {
      if (j >= cohortCount - i) {
        retention.push(null);
      } else {
        const decay = Math.pow(0.75 + Math.random() * 0.1, j);
        const rate = Math.max(0, Math.min(1, baseRetention * decay * (0.9 + Math.random() * 0.2)));
        retention.push(parseFloat(rate.toFixed(3)));
      }
    }
    
    const sample_warning = cohortSize < 30;
    if (sample_warning) {
      warnings.push(`2024-0${i + 1}组样本量不足（当前${cohortSize}人，建议不少于30人）`);
    }
    
    cohort_data.push({
      cohort_month: `2024-0${i + 1}`,
      cohort_size: cohortSize,
      retention,
      sample_warning
    });
  }
  
  return {
    cohort_data,
    warnings,
    months
  };
};

export const generateMockCourseHeatmap = (filters: FilterState): CourseHeatmapResponse => {
  const baseCourses = [
    { course_id: 2, name: "动感单车", category: "有氧", capacity: 30, base_score: 0.88 },
    { course_id: 4, name: "HIIT燃脂", category: "有氧", capacity: 25, base_score: 0.82 },
    { course_id: 1, name: "瑜伽基础", category: "瑜伽", capacity: 20, base_score: 0.76 },
    { course_id: 6, name: "拳击课", category: "格斗", capacity: 10, base_score: 0.74 },
    { course_id: 3, name: "力量训练", category: "力量", capacity: 15, base_score: 0.72 },
    { course_id: 5, name: "普拉提", category: "瑜伽", capacity: 12, base_score: 0.68 },
    { course_id: 7, name: "游泳课", category: "水上", capacity: 15, base_score: 0.60 },
  ];
  
  let filteredCourses = baseCourses;
  if (filters.courseIds?.length) {
    filteredCourses = baseCourses.filter(c => filters.courseIds!.includes(c.course_id));
  }
  
  const storeMultiplier = filters.storeIds?.length ? 0.5 + Math.random() * 0.3 : 1;
  const coachMultiplier = filters.coachIds?.length ? 0.4 + Math.random() * 0.4 : 1;
  const monthMultiplier = filters.month ? 0.7 + Math.random() * 0.3 : 1;
  
  const courses = filteredCourses.map(c => {
    const multiplier = storeMultiplier * coachMultiplier * monthMultiplier;
    const totalBookings = Math.floor((150 + Math.random() * 300) * multiplier);
    const hotScore = Math.min(1, c.base_score * (0.9 + Math.random() * 0.2));
    const bookingRate = Math.min(1, hotScore * (0.9 + Math.random() * 0.15));
    const checkinRate = 0.7 + Math.random() * 0.25;
    const cancelRate = 0.05 + Math.random() * 0.25;
    
    return {
      course_id: c.course_id,
      name: c.name,
      category: c.category,
      total_bookings: totalBookings,
      capacity: c.capacity,
      booking_rate: parseFloat(bookingRate.toFixed(3)),
      checkin_rate: parseFloat(checkinRate.toFixed(3)),
      cancel_rate: parseFloat(cancelRate.toFixed(3)),
      hot_score: parseFloat(hotScore.toFixed(3))
    };
  }).sort((a, b) => b.hot_score - a.hot_score);
  
  const warnings: string[] = [];
  if (courses.length < 3) {
    warnings.push(`样本量不足（当前${courses.length}门课程，建议不少于3门）`);
  }
  
  return {
    courses,
    warnings
  };
};

export const generateMockCoachLoad = (filters: FilterState): CoachLoadResponse => {
  const baseCoaches = [
    { coach_id: 1, name: "张教练", level: "资深", store: "朝阳旗舰店", base_hours: 28.5, base_students: 32 },
    { coach_id: 2, name: "李教练", level: "高级", store: "海淀分店", base_hours: 24.0, base_students: 28 },
    { coach_id: 3, name: "王教练", level: "中级", store: "浦东分店", base_hours: 18.5, base_students: 22 },
    { coach_id: 4, name: "刘教练", level: "高级", store: "朝阳旗舰店", base_hours: 32.0, base_students: 35 },
    { coach_id: 5, name: "陈教练", level: "中级", store: "海淀分店", base_hours: 15.0, base_students: 18 },
    { coach_id: 6, name: "杨教练", level: "初级", store: "浦东分店", base_hours: 12.0, base_students: 12 },
    { coach_id: 7, name: "赵教练", level: "资深", store: "朝阳旗舰店", base_hours: 26.5, base_students: 30 },
    { coach_id: 8, name: "黄教练", level: "高级", store: "海淀分店", base_hours: 22.0, base_students: 25 },
    { coach_id: 9, name: "周教练", level: "中级", store: "浦东分店", base_hours: 16.5, base_students: 20 },
    { coach_id: 10, name: "吴教练", level: "初级", store: "朝阳旗舰店", base_hours: 10.0, base_students: 10 },
  ];
  
  let filteredCoaches = baseCoaches;
  if (filters.coachIds?.length) {
    filteredCoaches = baseCoaches.filter(c => filters.coachIds!.includes(c.coach_id));
  }
  if (filters.storeIds?.length) {
    const storeNames = mockFilterOptions.stores.filter(s => filters.storeIds!.includes(s.id)).map(s => s.name);
    filteredCoaches = filteredCoaches.filter(c => storeNames.includes(c.store));
  }
  
  const monthMultiplier = filters.month ? 0.7 + Math.random() * 0.4 : 1;
  const typeMultiplier = filters.memberTypeIds?.length ? 0.6 + Math.random() * 0.3 : 1;
  
  const coaches = filteredCoaches.map(c => {
    const multiplier = monthMultiplier * typeMultiplier;
    return {
      coach_id: c.coach_id,
      name: c.name,
      level: c.level,
      store: c.store,
      weekly_hours: parseFloat((c.base_hours * multiplier).toFixed(1)),
      student_count: Math.floor(c.base_students * multiplier),
      pt_conversion: parseFloat((0.15 + Math.random() * 0.4).toFixed(3)),
      retention_rate: parseFloat((0.45 + Math.random() * 0.45).toFixed(3))
    };
  });
  
  const warnings: string[] = [];
  if (coaches.length < 3) {
    warnings.push(`样本量不足（当前${coaches.length}位教练，建议不少于3位）`);
  }
  
  return {
    coaches,
    warnings
  };
};

export const generateMockChurnWarning = (filters: FilterState, limit: number = 100): ChurnWarningResponse => {
  const baseMembers = [
    { member_id: 1001, name: "王伟", member_type: "年卡", store: "朝阳旗舰店", join_date: "2024-01-15", last_checkin: "2024-05-20", days_inactive: 35, avg_weekly_freq: 2.8, risk_level: "高风险" as const },
    { member_id: 1045, name: "李娜", member_type: "私教会员", store: "海淀分店", join_date: "2024-02-20", last_checkin: "2024-05-25", days_inactive: 30, avg_weekly_freq: 3.2, risk_level: "高风险" as const },
    { member_id: 1089, name: "张强", member_type: "季卡", store: "浦东分店", join_date: "2024-03-10", last_checkin: "2024-05-28", days_inactive: 27, avg_weekly_freq: 2.1, risk_level: "高风险" as const },
    { member_id: 1123, name: "刘芳", member_type: "年卡", store: "朝阳旗舰店", join_date: "2024-01-08", last_checkin: "2024-06-02", days_inactive: 22, avg_weekly_freq: 1.8, risk_level: "中风险" as const },
    { member_id: 1156, name: "陈明", member_type: "月卡", store: "海淀分店", join_date: "2024-04-01", last_checkin: "2024-06-05", days_inactive: 19, avg_weekly_freq: 1.5, risk_level: "中风险" as const },
    { member_id: 1189, name: "杨丽", member_type: "季卡", store: "浦东分店", join_date: "2024-03-15", last_checkin: "2024-06-08", days_inactive: 16, avg_weekly_freq: 1.2, risk_level: "中风险" as const },
    { member_id: 1201, name: "赵磊", member_type: "月卡", store: "朝阳旗舰店", join_date: "2024-05-01", last_checkin: "2024-06-10", days_inactive: 14, avg_weekly_freq: 0.8, risk_level: "低风险" as const },
    { member_id: 1234, name: "黄敏", member_type: "年卡", store: "海淀分店", join_date: "2024-02-10", last_checkin: "2024-06-12", days_inactive: 12, avg_weekly_freq: 2.5, risk_level: "低风险" as const },
    { member_id: 1267, name: "周杰", member_type: "私教会员", store: "浦东分店", join_date: "2024-01-20", last_checkin: "2024-06-13", days_inactive: 11, avg_weekly_freq: 3.0, risk_level: "低风险" as const },
    { member_id: 1290, name: "吴婷", member_type: "季卡", store: "朝阳旗舰店", join_date: "2024-03-05", last_checkin: "2024-06-14", days_inactive: 10, avg_weekly_freq: 1.9, risk_level: "低风险" as const },
  ];
  
  let filteredMembers = [...baseMembers];
  
  if (filters.storeIds?.length) {
    const storeNames = mockFilterOptions.stores.filter(s => filters.storeIds!.includes(s.id)).map(s => s.name);
    filteredMembers = filteredMembers.filter(m => storeNames.includes(m.store));
  }
  
  if (filters.memberTypeIds?.length) {
    const typeNames = mockFilterOptions.memberTypes.filter(t => filters.memberTypeIds!.includes(t.id)).map(t => t.name);
    filteredMembers = filteredMembers.filter(m => typeNames.includes(m.member_type));
  }
  
  const highRisk = filteredMembers.filter(m => m.risk_level === "高风险");
  const mediumRisk = filteredMembers.filter(m => m.risk_level === "中风险");
  const lowRisk = filteredMembers.filter(m => m.risk_level === "低风险");
  
  const warnings: string[] = [];
  if (filteredMembers.length < 10) {
    warnings.push(`样本量不足（当前${filteredMembers.length}人，建议不少于10人）`);
  }
  
  return {
    high_risk_count: highRisk.length,
    medium_risk_count: mediumRisk.length,
    low_risk_count: lowRisk.length,
    members: filteredMembers.slice(0, limit),
    warnings
  };
};
