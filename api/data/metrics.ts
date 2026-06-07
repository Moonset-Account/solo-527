export const METRICS = {
  consultationToAppointment: {
    name: '咨询→预约转化率',
    formula: '已预约咨询数 / 总咨询数 × 100%',
    description: '预约状态为 confirmed 或之后',
  },
  appointmentToVisit: {
    name: '预约→到店转化率',
    formula: '已到店预约数 / 已确认预约数 × 100%',
    description: 'arrived_at 不为空',
  },
  visitToPlan: {
    name: '到店→方案转化率',
    formula: '有方案的到店数 / 总到店数 × 100%',
    description: '至少一条 treatment_plan',
  },
  planToPayment: {
    name: '方案→付款转化率',
    formula: '已付款方案数 / 总方案数 × 100%',
    description: 'payment 状态为 completed',
  },
  paymentToFollowUp: {
    name: '付款→复诊转化率',
    formula: '已复诊付款数 / 总付款数 × 100%',
    description: 'actual_visit_at 不为空',
  },
  overallConversion: {
    name: '整体转化率',
    formula: '最终复诊数 / 总咨询数 × 100%',
    description: '全链路',
  },
  followUpRate: {
    name: '复诊率',
    formula: '已复诊数 / 应复诊数 × 100%',
    description: 'next_visit_at 已过且有 actual_visit_at',
  },
  consultantLoad: {
    name: '顾问负载',
    formula: '顾问在管各阶段客户数',
    description: '当前 status 非 completed 的客户数',
  },
  channelCostEfficiency: {
    name: '渠道成本效率',
    formula: '该渠道成单金额 / 渠道投入成本',
    description: '需外部成本数据',
  },
} as const;

export const ANOMALY_THRESHOLDS = {
  conversionRateDrop: 0.15,
  consultantOverload: 30,
  channelConversionLow: 0.2,
  followUpRateDrop: 0.1,
} as const;
