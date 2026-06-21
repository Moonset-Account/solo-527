import { generateUUID } from '$utils';
import { subDays, format } from 'date-fns';
import type {
  MetricDefinition,
  MetricData,
  AnomalyRecord,
  AnomalyNote,
  DailySummary,
  PushRecord,
  ExportTask,
  OperationLog,
  ErrorLog
} from '$types';

const today = new Date();

export const mockMetricDefinitions: MetricDefinition[] = [
  {
    id: generateUUID(),
    key: 'dau',
    name: '日活跃用户',
    category: '用户规模',
    unit: '人',
    formula: '每日登录APP的去重用户数',
    dataSource: '用户行为数据库',
    updateFrequency: 'daily',
    description: '每日活跃用户数，反映产品的用户活跃度',
    owner: '张三',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: generateUUID(),
    key: 'new_users',
    name: '新增用户',
    category: '用户增长',
    unit: '人',
    formula: '当日新注册的用户数',
    dataSource: '用户注册系统',
    updateFrequency: 'daily',
    description: '每日新增注册用户数，衡量拉新效果',
    owner: '张三',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: generateUUID(),
    key: 'retention_1d',
    name: '次日留存率',
    category: '用户留存',
    unit: '%',
    formula: '次日回访用户数 / 当日新增用户数',
    dataSource: '用户行为数据库',
    updateFrequency: 'daily',
    description: '新用户次日留存率，反映产品初期粘性',
    owner: '李四',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: generateUUID(),
    key: 'retention_7d',
    name: '7日留存率',
    category: '用户留存',
    unit: '%',
    formula: '第7日回访用户数 / 当日新增用户数',
    dataSource: '用户行为数据库',
    updateFrequency: 'daily',
    description: '新用户7日留存率，反映中期用户粘性',
    owner: '李四',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: generateUUID(),
    key: 'conversion_rate',
    name: '付费转化率',
    category: '收入转化',
    unit: '%',
    formula: '付费用户数 / 活跃用户数',
    dataSource: '交易系统',
    updateFrequency: 'daily',
    description: '活跃用户转化为付费用户的比例',
    owner: '王五',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: generateUUID(),
    key: 'paying_users',
    name: '付费用户数',
    category: '收入转化',
    unit: '人',
    formula: '当日有支付行为的去重用户数',
    dataSource: '交易系统',
    updateFrequency: 'daily',
    description: '每日付费用户数量',
    owner: '王五',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: generateUUID(),
    key: 'arpu',
    name: 'ARPU',
    category: '收入转化',
    unit: '元',
    formula: '当日总收入 / 当日活跃用户数',
    dataSource: '交易系统',
    updateFrequency: 'daily',
    description: '每用户平均收入',
    owner: '王五',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: generateUUID(),
    key: 'gmv',
    name: 'GMV',
    category: '收入转化',
    unit: '元',
    formula: '当日总成交金额',
    dataSource: '交易系统',
    updateFrequency: 'daily',
    description: '商品交易总额',
    owner: '王五',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

function generateMetricData(days: number): MetricData[] {
  const data: MetricData[] = [];
  const baseValues: Record<string, number> = {
    dau: 120000,
    new_users: 8500,
    retention_1d: 0.45,
    retention_7d: 0.25,
    conversion_rate: 0.035,
    paying_users: 4200,
    arpu: 28,
    gmv: 3360000
  };

  for (let i = days - 1; i >= 0; i--) {
    const date = format(subDays(today, i), 'yyyy-MM-dd');
    const dayFactor = 1 + (Math.random() - 0.5) * 0.1;

    for (const def of mockMetricDefinitions) {
      const base = baseValues[def.key] || 1000;
      const trend = 1 + (days - i) * 0.002;
      let value = base * dayFactor * trend;

      if (def.unit === '%') {
        value = Math.min(Math.max(value, 0.01), 0.99);
      }

      const prevValue = value * (1 + (Math.random() - 0.5) * 0.05);
      const wow = value / (prevValue * (1 + (Math.random() - 0.5) * 0.03)) - 1;
      const dod = value / prevValue - 1;

      data.push({
        id: generateUUID(),
        date,
        metricKey: def.key,
        value: Math.round(value * 10000) / 10000,
        prevValue: Math.round(prevValue * 10000) / 10000,
        wow: Math.round(wow * 10000) / 10000,
        dod: Math.round(dod * 10000) / 10000,
        source: 'system',
        createdAt: `${date}T08:00:00Z`,
        updatedAt: `${date}T08:00:00Z`
      });
    }
  }

  return data;
}

export const mockMetricData = generateMetricData(60);

function generateAnomalies(): AnomalyRecord[] {
  const anomalies: AnomalyRecord[] = [
    {
      id: generateUUID(),
      date: format(today, 'yyyy-MM-dd'),
      metricKey: 'dau',
      metricName: '日活跃用户',
      value: 98500,
      expectedValue: 120000,
      deviation: -21500,
      deviationPercent: -0.179,
      severity: 'high',
      status: 'investigating',
      description: '今日日活较预期下降明显，疑似渠道流量波动',
      detectedAt: format(today, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
      channel: 'all'
    },
    {
      id: generateUUID(),
      date: format(today, 'yyyy-MM-dd'),
      metricKey: 'new_users',
      metricName: '新增用户',
      value: 6200,
      expectedValue: 8500,
      deviation: -2300,
      deviationPercent: -0.271,
      severity: 'critical',
      status: 'open',
      description: '新增用户大幅下降，主要来自应用商店渠道',
      detectedAt: format(today, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
      channel: 'app_store'
    },
    {
      id: generateUUID(),
      date: format(subDays(today, 1), 'yyyy-MM-dd'),
      metricKey: 'conversion_rate',
      metricName: '付费转化率',
      value: 0.028,
      expectedValue: 0.035,
      deviation: -0.007,
      deviationPercent: -0.2,
      severity: 'medium',
      status: 'resolved',
      description: '昨日付费转化率下降，已确认是促销活动结束导致',
      detectedAt: format(subDays(today, 1), "yyyy-MM-dd'T'10:00:00'Z'"),
      resolvedAt: format(subDays(today, 1), "yyyy-MM-dd'T'15:30:00'Z'"),
      resolvedBy: '张三',
      channel: 'all'
    },
    {
      id: generateUUID(),
      date: format(subDays(today, 2), 'yyyy-MM-dd'),
      metricKey: 'retention_1d',
      metricName: '次日留存率',
      value: 0.38,
      expectedValue: 0.45,
      deviation: -0.07,
      deviationPercent: -0.156,
      severity: 'high',
      status: 'resolved',
      description: '新用户次日留存下降，因注册引导流程变更导致，已回滚',
      detectedAt: format(subDays(today, 2), "yyyy-MM-dd'T'09:00:00'Z'"),
      resolvedAt: format(subDays(today, 2), "yyyy-MM-dd'T'18:00:00'Z'"),
      resolvedBy: '李四',
      channel: 'all'
    },
    {
      id: generateUUID(),
      date: format(subDays(today, 5), 'yyyy-MM-dd'),
      metricKey: 'gmv',
      metricName: 'GMV',
      value: 4200000,
      expectedValue: 3360000,
      deviation: 840000,
      deviationPercent: 0.25,
      severity: 'medium',
      status: 'resolved',
      description: 'GMV大幅增长，618大促活动效果显著',
      detectedAt: format(subDays(today, 5), "yyyy-MM-dd'T'08:00:00'Z'"),
      resolvedAt: format(subDays(today, 5), "yyyy-MM-dd'T'10:00:00'Z'"),
      resolvedBy: '王五',
      channel: 'all'
    }
  ];
  return anomalies;
}

export const mockAnomalies = generateAnomalies();

export const mockAnomalyNotes: AnomalyNote[] = [
  {
    id: generateUUID(),
    anomalyId: mockAnomalies[1].id,
    content: '初步排查发现应用商店渠道流量下降50%，已联系渠道运营确认',
    author: '张三',
    createdAt: format(today, "yyyy-MM-dd'T'10:30:00'Z'"),
    updatedAt: format(today, "yyyy-MM-dd'T'10:30:00'Z'")
  },
  {
    id: generateUUID(),
    anomalyId: mockAnomalies[1].id,
    content: '渠道反馈是苹果审核延迟导致新版本未按时上线，预计明天恢复',
    author: '张三',
    createdAt: format(today, "yyyy-MM-dd'T'14:20:00'Z'"),
    updatedAt: format(today, "yyyy-MM-dd'T'14:20:00'Z'")
  },
  {
    id: generateUUID(),
    anomalyId: mockAnomalies[0].id,
    content: 'DAU下降主要受新增用户减少影响，老用户活跃度正常',
    author: '李四',
    createdAt: format(today, "yyyy-MM-dd'T'11:00:00'Z'"),
    updatedAt: format(today, "yyyy-MM-dd'T'11:00:00'Z'")
  }
];

export const mockDailySummary: DailySummary = {
  id: generateUUID(),
  date: format(subDays(today, 1), 'yyyy-MM-dd'),
  content: `昨日整体数据表现平稳，日活用户12.5万，环比增长2.1%。新增用户8,600人，较前日略有提升。
付费转化率保持在3.6%的健康水平，ARPU值28.5元。GMV达到356万元，超出预期3.2%。
需要关注的是次日留存率微降0.5个百分点，建议持续观察新用户质量。`,
  highlights: [
    '日活用户突破12.5万，创近30天新高',
    'GMV达356万元，超预期3.2%',
    '7日留存率回升至25.8%'
  ],
  lows: [
    '次日留存率环比下降0.5个百分点',
    '应用商店渠道新增减少'
  ],
  generatedBy: 'system',
  generatedAt: format(subDays(today, 1), "yyyy-MM-dd'T'08:30:00'Z'"),
  updatedAt: format(subDays(today, 1), "yyyy-MM-dd'T'09:00:00'Z'"),
  status: 'published'
};

export const mockPushRecords: PushRecord[] = [
  {
    id: generateUUID(),
    summaryId: mockDailySummary.id,
    channel: 'email',
    recipients: ['zhangsan@example.com', 'lisi@example.com', 'wangwu@example.com'],
    status: 'sent',
    sentAt: format(subDays(today, 1), "yyyy-MM-dd'T'09:05:00'Z'"),
    createdAt: format(subDays(today, 1), "yyyy-MM-dd'T'09:00:00'Z'")
  },
  {
    id: generateUUID(),
    summaryId: mockDailySummary.id,
    channel: 'wework',
    recipients: ['运营团队群'],
    status: 'sent',
    sentAt: format(subDays(today, 1), "yyyy-MM-dd'T'09:02:00'Z'"),
    createdAt: format(subDays(today, 1), "yyyy-MM-dd'T'09:00:00'Z'")
  }
];

export const mockExportTasks: ExportTask[] = [
  {
    id: generateUUID(),
    type: 'metrics',
    format: 'csv',
    status: 'completed',
    params: { dateFrom: '2024-01-01', dateTo: '2024-01-31', metricKey: 'dau' },
    fileUrl: '/exports/dau_202401.csv',
    createdBy: '张三',
    createdAt: format(subDays(today, 3), "yyyy-MM-dd'T'14:30:00'Z'"),
    completedAt: format(subDays(today, 3), "yyyy-MM-dd'T'14:32:00'Z'")
  },
  {
    id: generateUUID(),
    type: 'anomalies',
    format: 'excel',
    status: 'processing',
    params: { dateFrom: '2024-01-01', dateTo: '2024-01-31', severity: 'high' },
    createdBy: '李四',
    createdAt: format(today, "yyyy-MM-dd'T'10:15:00'Z'")
  }
];

export const mockOperationLogs: OperationLog[] = [
  {
    id: generateUUID(),
    action: 'update',
    resourceType: 'metric_definition',
    resourceId: 'dau',
    afterData: { description: '每日活跃用户数（更新版）' },
    beforeData: { description: '每日活跃用户数' },
    operator: '张三',
    createdAt: format(subDays(today, 2), "yyyy-MM-dd'T'11:00:00'Z'")
  },
  {
    id: generateUUID(),
    action: 'create',
    resourceType: 'anomaly_note',
    resourceId: 'note-001',
    afterData: { content: '已确认渠道问题' },
    operator: '李四',
    createdAt: format(subDays(today, 1), "yyyy-MM-dd'T'15:30:00'Z'")
  },
  {
    id: generateUUID(),
    action: 'update',
    resourceType: 'daily_summary',
    resourceId: mockDailySummary.id,
    afterData: { status: 'published' },
    beforeData: { status: 'draft' },
    operator: '王五',
    createdAt: format(subDays(today, 1), "yyyy-MM-dd'T'09:00:00'Z'")
  }
];

export const mockErrorLogs: ErrorLog[] = [
  {
    id: generateUUID(),
    type: 'api',
    endpoint: '/api/external/user-data',
    method: 'GET',
    statusCode: 500,
    errorMessage: '第三方用户数据接口超时',
    stackTrace: 'Error: timeout\n    at fetchUserData (api.ts:42)',
    severity: 'critical',
    alertSent: true,
    alertSentAt: format(subDays(today, 1), "yyyy-MM-dd'T'14:30:00'Z'"),
    createdAt: format(subDays(today, 1), "yyyy-MM-dd'T'14:28:00'Z'")
  },
  {
    id: generateUUID(),
    type: 'push',
    endpoint: '',
    method: '',
    errorMessage: '邮件推送服务连接失败',
    severity: 'warning',
    alertSent: false,
    createdAt: format(subDays(today, 2), "yyyy-MM-dd'T'09:05:00'Z'")
  },
  {
    id: generateUUID(),
    type: 'api',
    endpoint: '/api/metrics/batch',
    method: 'POST',
    statusCode: 429,
    errorMessage: '请求频率超限',
    severity: 'warning',
    alertSent: false,
    createdAt: format(subDays(today, 3), "yyyy-MM-dd'T'16:20:00'Z'")
  }
];
