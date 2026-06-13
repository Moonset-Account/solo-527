const metrics = [
  {
    id: "1",
    name: "销售额",
    code: "sales_amount",
    description: "统计周期内的总销售金额",
    formula: "SUM(order_amount) WHERE order_status = 'completed'",
    dataSource: "交易数据库",
    unit: "元",
    category: "核心指标",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    name: "订单量",
    code: "order_count",
    description: "统计周期内的有效订单数量",
    formula: "COUNT(order_id) WHERE order_status = 'completed'",
    dataSource: "交易数据库",
    unit: "单",
    category: "核心指标",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "3",
    name: "客单价",
    code: "avg_order_value",
    description: "平均每个订单的金额",
    formula: "SUM(order_amount) / COUNT(order_id)",
    dataSource: "交易数据库",
    unit: "元",
    category: "核心指标",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "4",
    name: "转化率",
    code: "conversion_rate",
    description: "访客到下单用户的转化比例",
    formula: "paying_users / total_visitors * 100%",
    dataSource: "数据分析平台",
    unit: "%",
    category: "转化指标",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "5",
    name: "新用户数",
    code: "new_users",
    description: "统计周期内新增的付费用户数",
    formula: "COUNT(DISTINCT user_id) WHERE first_order_date IN period",
    dataSource: "用户数据库",
    unit: "人",
    category: "用户指标",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "6",
    name: "复购率",
    code: "repurchase_rate",
    description: "老用户在统计周期内再次购买的比例",
    formula: "returning_users / total_old_users * 100%",
    dataSource: "用户数据库",
    unit: "%",
    category: "用户指标",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
];

function generateMetricData(metricId: string, days: number) {
  const data = [];
  const baseValues: Record<string, number> = {
    "1": 500000,
    "2": 2000,
    "3": 250,
    "4": 3.5,
    "5": 500,
    "6": 35,
  };
  
  const base = baseValues[metricId] || 100;
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    let variation = (Math.random() - 0.5) * 0.2;
    if (isWeekend) variation += 0.1;
    
    const value = base * (1 + variation);
    
    data.push({
      date: date.toISOString().split("T")[0],
      value: Math.round(value * 100) / 100,
    });
  }
  
  return data;
}

const generateAnomalies = () => {
  const anomalies = [];
  const severities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
  const statuses = ["OPEN", "INVESTIGATING", "RESOLVED", "IGNORED"];
  const rootCauseCategories = ["市场因素", "产品问题", "价格策略", "渠道问题", "促销活动影响", "季节性波动"];
  
  for (let i = 0; i < 25; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const detectedAt = new Date();
    detectedAt.setDate(detectedAt.getDate() - daysAgo);
    
    const metricId = String(Math.floor(Math.random() * 6) + 1);
    const metric = metrics.find(m => m.id === metricId)!;
    const actualValue = 100000 + Math.random() * 400000;
    const expectedValue = actualValue * (1 + (Math.random() * 0.3 - 0.15));
    const deviation = actualValue - expectedValue;
    const deviationPercentage = deviation / expectedValue;
    
    const status = i < 8 ? (i < 3 ? "OPEN" : "INVESTIGATING") : statuses[Math.floor(Math.random() * statuses.length)];
    const severityIndex = Math.min(Math.floor(Math.abs(deviationPercentage) * 20), 3);
    
    anomalies.push({
      id: `anomaly-${i + 1}`,
      alertRuleId: `rule-${Math.floor(Math.random() * 5) + 1}`,
      alertRule: { name: `${metric.name}异常告警` },
      metricId,
      metric,
      detectedAt,
      periodStart: new Date(detectedAt.getTime() - 86400000),
      periodEnd: detectedAt,
      actualValue: Math.round(actualValue),
      expectedValue: Math.round(expectedValue),
      deviation: Math.round(deviation),
      deviationPercentage: Math.round(deviationPercentage * 1000) / 10,
      severity: severities[severityIndex],
      status,
      summary: status === "RESOLVED" ? "已完成根因分析和处理" : null,
      rootCause: i > 10 ? rootCauseCategories[Math.floor(Math.random() * rootCauseCategories.length)] : null,
      rootCauseCategory: i > 10 ? rootCauseCategories[Math.floor(Math.random() * rootCauseCategories.length)] : null,
      assignedToId: i < 5 ? "user-1" : null,
      assignedTo: i < 5 ? { id: "user-1", name: "张经理", avatarUrl: null } : null,
      resolvedAt: status === "RESOLVED" ? new Date(detectedAt.getTime() + Math.random() * 86400000 * 3) : null,
      createdAt: detectedAt,
      updatedAt: detectedAt,
      comments: [],
    });
  }
  
  return anomalies.sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());
};

const alertRules = [
  {
    id: "rule-1",
    name: "日销售额下降告警",
    metricId: "1",
    metric: metrics[0],
    period: "DAY",
    thresholdType: "PERCENTAGE",
    thresholdValue: -10,
    direction: "BELOW",
    severity: "HIGH",
    channels: [{ type: "in_app", recipients: ["all"] }, { type: "email", recipients: ["director@example.com"] }],
    isEnabled: true,
    createdById: "user-1",
    createdBy: { name: "销售总监", email: "director@example.com" },
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z",
    _count: { anomalies: 12 },
  },
  {
    id: "rule-2",
    name: "周订单量波动告警",
    metricId: "2",
    metric: metrics[1],
    period: "WEEK",
    thresholdType: "PERCENTAGE",
    thresholdValue: 15,
    direction: "BOTH",
    severity: "MEDIUM",
    channels: [{ type: "in_app", recipients: ["all"] }],
    isEnabled: true,
    createdById: "user-1",
    createdBy: { name: "销售总监", email: "director@example.com" },
    createdAt: "2024-01-10T00:00:00Z",
    updatedAt: "2024-02-01T00:00:00Z",
    _count: { anomalies: 8 },
  },
  {
    id: "rule-3",
    name: "转化率异常监控",
    metricId: "4",
    metric: metrics[3],
    period: "DAY",
    thresholdType: "PERCENTAGE",
    thresholdValue: -5,
    direction: "BELOW",
    severity: "CRITICAL",
    channels: [{ type: "in_app", recipients: ["all"] }, { type: "wework", recipients: ["sales-group"] }],
    isEnabled: true,
    createdById: "user-2",
    createdBy: { name: "数据运营", email: "data@example.com" },
    createdAt: "2024-01-20T00:00:00Z",
    updatedAt: "2024-01-20T00:00:00Z",
    _count: { anomalies: 5 },
  },
  {
    id: "rule-4",
    name: "月销售目标达成预警",
    metricId: "1",
    metric: metrics[0],
    period: "MONTH",
    thresholdType: "PERCENTAGE",
    thresholdValue: 80,
    direction: "BELOW",
    severity: "HIGH",
    channels: [{ type: "email", recipients: ["director@example.com"] }],
    isEnabled: false,
    createdById: "user-1",
    createdBy: { name: "销售总监", email: "director@example.com" },
    createdAt: "2024-02-01T00:00:00Z",
    updatedAt: "2024-02-15T00:00:00Z",
    _count: { anomalies: 2 },
  },
  {
    id: "rule-5",
    name: "复购率下降监控",
    metricId: "6",
    metric: metrics[5],
    period: "WEEK",
    thresholdType: "PERCENTAGE",
    thresholdValue: -3,
    direction: "BELOW",
    severity: "MEDIUM",
    channels: [{ type: "in_app", recipients: ["all"] }],
    isEnabled: true,
    createdById: "user-2",
    createdBy: { name: "数据运营", email: "data@example.com" },
    createdAt: "2024-01-25T00:00:00Z",
    updatedAt: "2024-01-25T00:00:00Z",
    _count: { anomalies: 3 },
  },
];

const generateTrendData = (days: number) => {
  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const count = Math.floor(Math.random() * 8) + 1;
    const high = Math.floor(count * 0.3);
    const critical = Math.floor(count * 0.1);
    
    data.push({
      date: date.toISOString().split("T")[0],
      count,
      high,
      critical,
    });
  }
  return data;
};

export const mockData = {
  metrics,
  anomalies: generateAnomalies(),
  alertRules,
  generateMetricData,
  generateTrendData,
  
  dashboardOverview: {
    totalMetrics: 6,
    activeAlerts: 8,
    thisMonthAnomalies: 42,
    lastMonthAnomalies: 35,
    monthOverMonth: 20,
  },
};
