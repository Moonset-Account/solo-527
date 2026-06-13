import { db } from "@/server/db";

export const seedDatabase = async () => {
  const existingMetrics = await db.metric.count();
  if (existingMetrics > 0) {
    return { seeded: false, message: "数据库已存在数据，跳过播种" };
  }

  const director = await db.user.upsert({
    where: { email: "director@example.com" },
    update: {},
    create: {
      clerkId: "clerk_director_001",
      email: "director@example.com",
      name: "张总监",
      role: "SALES_DIRECTOR",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=director",
    },
  });

  const manager = await db.user.upsert({
    where: { email: "manager@example.com" },
    update: {},
    create: {
      clerkId: "clerk_manager_001",
      email: "manager@example.com",
      name: "李经理",
      role: "SALES_MANAGER",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=manager",
    },
  });

  const operator = await db.user.upsert({
    where: { email: "operator@example.com" },
    update: {},
    create: {
      clerkId: "clerk_operator_001",
      email: "operator@example.com",
      name: "王运营",
      role: "DATA_OPERATOR",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=operator",
    },
  });

  const metricsData = [
    {
      name: "月度销售额",
      code: "MONTHLY_SALES",
      description: "每月总销售额",
      formula: "SUM(销售金额)",
      dataSource: "销售系统",
      unit: "元",
      category: "销售指标",
    },
    {
      name: "新客户数",
      code: "NEW_CUSTOMERS",
      description: "每月新增客户数量",
      formula: "COUNT(新客户)",
      dataSource: "CRM系统",
      unit: "个",
      category: "客户指标",
    },
    {
      name: "客户留存率",
      code: "CUSTOMER_RETENTION",
      description: "客户留存比例",
      formula: "留存客户数/总客户数",
      dataSource: "CRM系统",
      unit: "%",
      category: "客户指标",
    },
    {
      name: "平均订单金额",
      code: "AVG_ORDER_VALUE",
      description: "每笔订单的平均金额",
      formula: "总销售额/订单数",
      dataSource: "销售系统",
      unit: "元",
      category: "销售指标",
    },
    {
      name: "销售转化率",
      code: "SALES_CONVERSION",
      description: "线索转化为客户的比例",
      formula: "转化客户数/线索总数",
      dataSource: "CRM系统",
      unit: "%",
      category: "销售指标",
    },
    {
      name: "活跃用户数",
      code: "ACTIVE_USERS",
      description: "月活跃用户数量",
      formula: "COUNT(活跃用户)",
      dataSource: "用户系统",
      unit: "人",
      category: "用户指标",
    },
  ];

  const metrics = [];
  for (const m of metricsData) {
    const metric = await db.metric.create({ data: m });
    metrics.push(metric);
  }

  const alertRulesData = [
    {
      name: "销售额骤降告警",
      metricId: metrics[0]!.id,
      period: "DAY" as const,
      thresholdType: "PERCENTAGE" as const,
      thresholdValue: -20,
      direction: "BELOW" as const,
      severity: "HIGH" as const,
      channels: [{ type: "in_app", recipients: ["all"] }],
      createdById: director.id,
    },
    {
      name: "新客户数异常",
      metricId: metrics[1]!.id,
      period: "WEEK" as const,
      thresholdType: "PERCENTAGE" as const,
      thresholdValue: 30,
      direction: "BOTH" as const,
      severity: "MEDIUM" as const,
      channels: [{ type: "email", recipients: ["manager@example.com"] }],
      createdById: manager.id,
    },
    {
      name: "留存率低于阈值",
      metricId: metrics[2]!.id,
      period: "MONTH" as const,
      thresholdType: "ABSOLUTE" as const,
      thresholdValue: 70,
      direction: "BELOW" as const,
      severity: "CRITICAL" as const,
      channels: [
        { type: "in_app", recipients: ["all"] },
        { type: "wework", recipients: ["总监群"] },
      ],
      createdById: director.id,
    },
    {
      name: "平均订单金额波动",
      metricId: metrics[3]!.id,
      period: "DAY" as const,
      thresholdType: "PERCENTAGE" as const,
      thresholdValue: 15,
      direction: "BOTH" as const,
      severity: "LOW" as const,
      channels: [{ type: "in_app", recipients: ["operations"] }],
      createdById: operator.id,
    },
    {
      name: "转化率骤降",
      metricId: metrics[4]!.id,
      period: "WEEK" as const,
      thresholdType: "PERCENTAGE" as const,
      thresholdValue: -25,
      direction: "BELOW" as const,
      severity: "HIGH" as const,
      channels: [{ type: "email", recipients: ["director@example.com"] }],
      createdById: manager.id,
    },
  ];

  const alertRules = [];
  for (const rule of alertRulesData) {
    const created = await db.alertRule.create({
      data: {
        ...rule,
        channels: rule.channels as any,
      },
    });
    alertRules.push(created);
  }

  const now = new Date();
  const dataPoints: Array<{
    metricId: string;
    date: Date;
    value: number;
    period: "DAY" | "WEEK" | "MONTH";
  }> = [];

  const baseValues = [1500000, 120, 85, 3500, 12, 5000];

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    for (let j = 0; j < metrics.length; j++) {
      const metric = metrics[j]!;
      const base = baseValues[j]!;
      const variation = (Math.random() - 0.5) * 0.2;
      const weekendFactor = date.getDay() === 0 || date.getDay() === 6 ? 0.7 : 1;
      const value = Math.round(base * (1 + variation) * weekendFactor * 100) / 100;

      dataPoints.push({
        metricId: metric.id,
        date,
        value,
        period: "DAY",
      });
    }
  }

  await db.metricDataPoint.createMany({ data: dataPoints });

  const anomalyData = [
    {
      alertRuleId: alertRules[0]!.id,
      metricId: metrics[0]!.id,
      periodStart: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      periodEnd: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
      actualValue: 980000,
      expectedValue: 1500000,
      deviation: -520000,
      deviationPercentage: -34.7,
      severity: "CRITICAL" as const,
      status: "OPEN" as const,
      summary: "销售额大幅下降，需要紧急调查",
      assignedToId: manager.id,
    },
    {
      alertRuleId: alertRules[1]!.id,
      metricId: metrics[1]!.id,
      periodStart: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      periodEnd: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      actualValue: 168,
      expectedValue: 120,
      deviation: 48,
      deviationPercentage: 40,
      severity: "MEDIUM" as const,
      status: "INVESTIGATING" as const,
      summary: "新客户数异常增长",
      rootCause: "营销活动效果显著",
      rootCauseCategory: "市场活动",
      assignedToId: operator.id,
    },
    {
      alertRuleId: alertRules[2]!.id,
      metricId: metrics[2]!.id,
      periodStart: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      periodEnd: new Date(now),
      actualValue: 62.5,
      expectedValue: 85,
      deviation: -22.5,
      deviationPercentage: -26.5,
      severity: "HIGH" as const,
      status: "OPEN" as const,
      summary: "客户留存率持续走低",
      assignedToId: director.id,
    },
    {
      alertRuleId: alertRules[3]!.id,
      metricId: metrics[3]!.id,
      periodStart: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      periodEnd: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      actualValue: 4200,
      expectedValue: 3500,
      deviation: 700,
      deviationPercentage: 20,
      severity: "LOW" as const,
      status: "RESOLVED" as const,
      summary: "大额订单推高平均客单价",
      rootCause: "企业客户大额采购",
      rootCauseCategory: "正常业务波动",
      resolvedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      alertRuleId: alertRules[4]!.id,
      metricId: metrics[4]!.id,
      periodStart: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000),
      periodEnd: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      actualValue: 8.2,
      expectedValue: 12,
      deviation: -3.8,
      deviationPercentage: -31.7,
      severity: "HIGH" as const,
      status: "INVESTIGATING" as const,
      summary: "销售转化率持续下降",
      assignedToId: manager.id,
    },
    {
      alertRuleId: alertRules[0]!.id,
      metricId: metrics[0]!.id,
      periodStart: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      periodEnd: new Date(now.getTime() - 19 * 24 * 60 * 60 * 1000),
      actualValue: 1850000,
      expectedValue: 1500000,
      deviation: 350000,
      deviationPercentage: 23.3,
      severity: "MEDIUM" as const,
      status: "IGNORED" as const,
      summary: "单日销售额突增",
      rootCause: "季度末冲量",
      rootCauseCategory: "正常业务波动",
    },
    {
      alertRuleId: alertRules[1]!.id,
      metricId: metrics[1]!.id,
      periodStart: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000),
      periodEnd: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000),
      actualValue: 88,
      expectedValue: 120,
      deviation: -32,
      deviationPercentage: -26.7,
      severity: "MEDIUM" as const,
      status: "RESOLVED" as const,
      summary: "新客户数下降",
      rootCause: "竞品促销活动影响",
      rootCauseCategory: "竞争因素",
      resolvedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      assignedToId: operator.id,
    },
    {
      alertRuleId: alertRules[2]!.id,
      metricId: metrics[2]!.id,
      periodStart: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
      periodEnd: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      actualValue: 78,
      expectedValue: 85,
      deviation: -7,
      deviationPercentage: -8.2,
      severity: "LOW" as const,
      status: "RESOLVED" as const,
      summary: "留存率小幅下降",
      rootCause: "季节性波动",
      rootCauseCategory: "正常业务波动",
      resolvedAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
    },
    {
      alertRuleId: alertRules[4]!.id,
      metricId: metrics[4]!.id,
      periodStart: new Date(now.getTime() - 42 * 24 * 60 * 60 * 1000),
      periodEnd: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000),
      actualValue: 15.6,
      expectedValue: 12,
      deviation: 3.6,
      deviationPercentage: 30,
      severity: "MEDIUM" as const,
      status: "RESOLVED" as const,
      summary: "转化率异常升高",
      rootCause: "销售培训效果显现",
      rootCauseCategory: "内部优化",
      resolvedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      assignedToId: manager.id,
    },
    {
      alertRuleId: alertRules[3]!.id,
      metricId: metrics[3]!.id,
      periodStart: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      periodEnd: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000),
      actualValue: 2800,
      expectedValue: 3500,
      deviation: -700,
      deviationPercentage: -20,
      severity: "LOW" as const,
      status: "OPEN" as const,
      summary: "平均订单金额下降",
    },
  ];

  const anomalies = [];
  for (const a of anomalyData) {
    const anomaly = await db.anomaly.create({ data: a });
    anomalies.push(anomaly);
  }

  const commentsData = [
    {
      anomalyId: anomalies[0]!.id,
      userId: director.id,
      content: "请销售团队立即调查原因，本周内给出报告。",
    },
    {
      anomalyId: anomalies[0]!.id,
      userId: manager.id,
      content: "收到，正在安排团队分析数据，预计明天有初步结论。",
    },
    {
      anomalyId: anomalies[1]!.id,
      userId: operator.id,
      content: "初步分析是因为上周的促销活动效果很好。",
    },
    {
      anomalyId: anomalies[2]!.id,
      userId: director.id,
      content: "这个问题很严重，需要客户成功团队介入。",
    },
    {
      anomalyId: anomalies[4]!.id,
      userId: manager.id,
      content: "正在和销售团队沟通，了解具体原因。",
    },
    {
      anomalyId: anomalies[9]!.id,
      userId: operator.id,
      content: "小额订单增多，可能与新用户活动有关。",
    },
  ];

  for (const c of commentsData) {
    await db.anomalyComment.create({ data: c });
  }

  const changeLogsData = [
    {
      metricId: metrics[0]!.id,
      fieldChanged: "description",
      oldValue: "月销售额",
      newValue: "月度销售额",
      createdById: operator.id,
      approvedById: manager.id,
      approvedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      description: "优化指标描述，更清晰明确",
    },
    {
      metricId: metrics[3]!.id,
      fieldChanged: "formula",
      oldValue: "销售额/订单数",
      newValue: "总销售额/订单数",
      createdById: operator.id,
      approvedById: director.id,
      approvedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      description: "修正公式描述",
    },
    {
      metricId: metrics[4]!.id,
      fieldChanged: "threshold",
      oldValue: "10%",
      newValue: "12%",
      createdById: manager.id,
      description: "调整基准线，待审批",
    },
    {
      metricId: metrics[1]!.id,
      fieldChanged: "dataSource",
      oldValue: "销售系统",
      newValue: "CRM系统",
      createdById: operator.id,
      approvedById: manager.id,
      approvedAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
      description: "更正数据源",
    },
    {
      metricId: metrics[5]!.id,
      fieldChanged: "category",
      oldValue: "客户指标",
      newValue: "用户指标",
      createdById: operator.id,
      description: "调整指标分类",
    },
    {
      metricId: metrics[2]!.id,
      fieldChanged: "formula",
      oldValue: "留存客户数/总客户数",
      newValue: "付费留存客户数/总付费客户数",
      createdById: operator.id,
      rejectedById: director.id,
      rejectedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      description: "缩小统计范围，不符合业务定义",
    },
  ];

  for (const log of changeLogsData) {
    await db.metricChangeLog.create({ data: log });
  }

  return { seeded: true, message: "数据库播种完成" };
};
