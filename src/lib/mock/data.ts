import type {
  Team,
  Staff,
  TeamWorkload,
  TimeoutTrendPoint,
  TagDistribution,
  StaffMetrics,
  DashboardMetrics,
  Schedule,
  ScheduleChange,
  QualitySession,
} from "@/types";

export const mockTeams: Team[] = [
  { id: "team-1", name: "客服一组", supervisorId: "super-1", staffCount: 8 },
  { id: "team-2", name: "客服二组", supervisorId: "super-1", staffCount: 7 },
  { id: "team-3", name: "客服三组", supervisorId: "super-2", staffCount: 9 },
  { id: "team-4", name: "VIP专属组", supervisorId: "super-2", staffCount: 6 },
];

const staffNames = [
  "张三", "李四", "王五", "赵六", "钱七", "孙八", "周九", "吴十",
  "郑十一", "王十二", "冯十三", "陈十四", "褚十五", "卫十六", "蒋十七",
  "沈十八", "韩十九", "杨二十", "朱廿一", "秦廿二", "尤廿三", "许廿四",
  "何廿五", "吕廿六", "施廿七", "张廿八", "孔廿九", "曹三十",
];

export const mockStaffs: Staff[] = staffNames.map((name, idx) => ({
  id: `staff-${idx + 1}`,
  name,
  teamId: `team-${(idx % 4) + 1}`,
  role: idx < 2 ? "supervisor" : "agent",
  isProbation: idx >= 25,
  probationEndDate: idx >= 25 ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
}));

const tagNames = [
  "账户问题", "订单查询", "退款申请", "物流咨询", "商品咨询",
  "活动优惠", "投诉建议", "技术支持", "发票问题", "会员服务",
  "售后维修", "退换货", "密码重置", "绑定手机", "积分问题",
];

const categories = ["账户", "订单", "商品", "服务", "技术"];

export function generateTeamWorkload(): TeamWorkload[] {
  const data: TeamWorkload[] = [];
  for (let hour = 8; hour <= 22; hour++) {
    mockTeams.forEach((team, teamIdx) => {
      const baseLoad = 40 + Math.sin((hour - 8) / 14 * Math.PI) * 30;
      const variation = (Math.random() - 0.5) * 20;
      const teamFactor = 1 + (teamIdx - 1.5) * 0.1;
      let workload = Math.min(100, Math.max(10, baseLoad * teamFactor + variation));

      data.push({
        teamId: team.id,
        teamName: team.name,
        hour,
        workload: Math.round(workload),
        sessionCount: Math.round(workload * 2.5 + Math.random() * 20),
        avgWaitTime: Math.round(workload * 0.8 + Math.random() * 30),
        staffOnDuty: Math.round(3 + workload / 30),
      });
    });
  }
  return data;
}

export function generateTimeoutTrend(days = 7): TimeoutTrendPoint[] {
  const data: TimeoutTrendPoint[] = [];
  const now = new Date();

  for (let d = days - 1; d >= 0; d--) {
    for (let h = 8; h <= 22; h += 2) {
      const date = new Date(now);
      date.setDate(date.getDate() - d);
      date.setHours(h, 0, 0, 0);

      const isPeak = h >= 10 && h <= 12 || h >= 15 && h <= 19;
      const baseWait = isPeak ? 60 : 25;
      const variation = Math.random() * 20;
      const avgWaitTime = Math.round(baseWait + variation);
      const sessionCount = Math.round(80 + Math.random() * 60);
      const timeoutCount = Math.round(sessionCount * (avgWaitTime > 45 ? 0.15 : 0.05));

      data.push({
        time: `${date.getMonth() + 1}/${date.getDate()} ${h}:00`,
        avgWaitTime,
        timeoutCount,
        timeoutRate: Math.round((timeoutCount / sessionCount) * 100) / 100,
        sessionCount,
      });
    }
  }
  return data;
}

export function generateTagDistribution(): TagDistribution[] {
  const total = 5000 + Math.round(Math.random() * 2000);
  return tagNames.map((tag, idx) => {
    const weight = Math.random() * 0.8 + 0.2;
    const count = Math.round((total / tagNames.length) * weight * (1 - idx * 0.03));
    return {
      tagName: tag,
      count,
      percentage: Math.round((count / total) * 1000) / 10,
      category: categories[idx % categories.length],
    };
  }).sort((a, b) => b.count - a.count);
}

export function generateStaffRanking(): StaffMetrics[] {
  return mockStaffs.filter(s => s.role === "agent").map((staff, idx) => {
    const baseSkill = 1 - idx * 0.02;
    const probationPenalty = staff.isProbation ? 0.85 : 1;
    const randomFactor = 0.85 + Math.random() * 0.3;
    const skill = baseSkill * probationPenalty * randomFactor;

    return {
      staffId: staff.id,
      staffName: staff.name,
      isProbation: staff.isProbation,
      sessionCount: Math.round(80 + skill * 120),
      avgWaitTime: Math.round(60 - skill * 35),
      avgDuration: Math.round(180 + (1 - skill) * 120),
      transferRate: Math.round((0.2 - skill * 0.15) * 100) / 100,
      avgQualityScore: Math.round(70 + skill * 25),
      satisfaction: Math.round(3.5 + skill * 1.5 * 10) / 10,
      workloadScore: Math.round(50 + skill * 40),
    };
  }).sort((a, b) => {
    const scoreA = a.avgQualityScore * 0.4 + a.satisfaction * 10 * 0.3 + (100 - a.transferRate * 100) * 0.3;
    const scoreB = b.avgQualityScore * 0.4 + b.satisfaction * 10 * 0.3 + (100 - b.transferRate * 100) * 0.3;
    return scoreB - scoreA;
  });
}

export function generateDashboardMetrics(): DashboardMetrics {
  return {
    totalSessions: 12456,
    avgWaitTime: 38,
    avgQualityScore: 87.5,
    timeoutRate: 0.068,
    transferRate: 0.125,
    avgSatisfaction: 4.6,
    staffOnDuty: 24,
    totalStaff: 30,
    trends: {
      sessions: 12.5,
      waitTime: -8.3,
      quality: 2.1,
      timeout: -15.2,
    },
  };
}

export function generateSchedules(date: string): Schedule[] {
  return mockStaffs.map((staff, idx) => {
    const shiftType = idx % 3 === 0 ? "morning" : idx % 3 === 1 ? "afternoon" : "night";
    const shifts: Record<string, [number, number]> = {
      morning: [8, 16],
      afternoon: [14, 22],
      night: [16, 24],
    };
    const [startHour, endHour] = shifts[shiftType];
    return {
      id: `sch-${staff.id}-${date}`,
      staffId: staff.id,
      staff,
      date,
      startHour,
      endHour,
      shiftType,
    };
  });
}

export function generateScheduleChanges(): ScheduleChange[] {
  return [
    {
      id: "change-1",
      scheduleId: "sch-staff-5-2024-01-15",
      beforeSnapshot: { startHour: 8, endHour: 16, shiftType: "morning" },
      afterSnapshot: { startHour: 14, endHour: 22, shiftType: "afternoon" },
      changedBy: "主管-张三",
      changedAt: new Date(Date.now() - 86400000).toISOString(),
      reason: "高峰时段人手不足",
    },
    {
      id: "change-2",
      scheduleId: "sch-staff-12-2024-01-15",
      beforeSnapshot: { startHour: 14, endHour: 22, shiftType: "afternoon" },
      afterSnapshot: { startHour: 8, endHour: 16, shiftType: "morning" },
      changedBy: "主管-张三",
      changedAt: new Date(Date.now() - 172800000).toISOString(),
      reason: "个人调班申请",
    },
  ];
}

export function generateLowQualitySessions(includeRestricted = true): QualitySession[] {
  return [
    {
      id: "sess-1",
      staffName: "王五",
      startTime: new Date(Date.now() - 3600000).toISOString(),
      score: 58,
      comments: "态度不耐烦，未解决用户问题",
      isRestricted: false,
      tags: ["投诉建议", "售后维修"],
    },
    {
      id: "sess-2",
      staffName: "钱七",
      startTime: new Date(Date.now() - 7200000).toISOString(),
      score: 62,
      comments: "专业知识不足，多次回答错误",
      isRestricted: false,
      tags: ["商品咨询", "技术支持"],
    },
    {
      id: "sess-3",
      staffName: "赵六",
      startTime: new Date(Date.now() - 10800000).toISOString(),
      score: 45,
      comments: "敏感信息处理不当，需要主管跟进",
      isRestricted: true,
      tags: ["账户问题", "投诉建议"],
    },
    {
      id: "sess-4",
      staffName: "孙八",
      startTime: new Date(Date.now() - 14400000).toISOString(),
      score: 65,
      comments: "响应速度慢，用户等待时间过长",
      isRestricted: false,
      tags: ["订单查询", "退款申请"],
    },
  ].filter(s => includeRestricted || !s.isRestricted);
}
