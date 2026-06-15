import dayjs from 'dayjs'
import type {
  User, Role, MetricsOverview, MetricsTrend, Fluctuation,
  AlertOverview, PermissionApplication, DataMaskingConfig,
  Dataset, TodoItem, TodoGroup, SummaryPush, AlertRule,
  MonthlyReport, FluctuationLog
} from '../types'

export const mockRoles: Role[] = [
  { id: 'role_admin', name: '系统管理员', description: '拥有系统全部权限' },
  { id: 'role_sales_director', name: '销售总监', description: '查看全部经营数据，审批权限' },
  { id: 'role_data_admin', name: '数据管理员', description: '维护权限配置和数据规则' },
  { id: 'role_business_owner', name: '业务负责人', description: '查看所辖数据，处理待办' },
  { id: 'role_supply_chain', name: '供应链经理', description: '处理供应链相关异常' }
]

export const mockUsers: User[] = [
  { id: 'user_director', username: 'director', name: '张总监', email: 'director@example.com', roleId: 'role_sales_director', avatarUrl: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'user_data_admin', username: 'dataadmin', name: '李数据', email: 'dataadmin@example.com', roleId: 'role_data_admin', avatarUrl: '', createdAt: '2024-01-02T00:00:00Z' },
  { id: 'user_business', username: 'business', name: '王业务', email: 'business@example.com', roleId: 'role_business_owner', avatarUrl: '', createdAt: '2024-01-03T00:00:00Z' },
  { id: 'user_supply', username: 'supply', name: '赵供应', email: 'supply@example.com', roleId: 'role_supply_chain', avatarUrl: '', createdAt: '2024-01-04T00:00:00Z' },
  { id: 'user_admin', username: 'admin', name: '系统管理员', email: 'admin@example.com', roleId: 'role_admin', avatarUrl: '', createdAt: '2024-01-05T00:00:00Z' }
]

export const generateTrendData = (days: number, baseValue: number, volatility = 0.15): { date: string; value: number }[] => {
  const data: { date: string; value: number }[] = []
  let value = baseValue

  for (let i = days - 1; i >= 0; i--) {
    const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD')
    const change = (Math.random() - 0.48) * volatility * baseValue
    value = Math.max(baseValue * 0.6, value + change)
    data.push({ date, value: Math.round(value * 100) / 100 })
  }

  return data
}

export const getMetricsOverview = (): MetricsOverview => {
  return {
    salesAmount: 12580.56,
    orderCount: 8942,
    avgOrderValue: 1406.8,
    grossMargin: 32.5,
    salesAmountYoY: 12.5,
    orderCountYoY: 8.3,
    avgOrderValueYoY: 3.9,
    grossMarginYoY: 2.1,
    salesAmountMoM: 5.2,
    orderCountMoM: 3.8,
    avgOrderValueMoM: 1.4,
    grossMarginMoM: 0.8
  }
}

export const getMetricsTrend = (metric: string, days = 30): MetricsTrend => {
  const baseValues: Record<string, number> = {
    sales_amount: 420,
    order_count: 300,
    avg_order_value: 1400,
    gross_margin: 32
  }

  const units: Record<string, string> = {
    sales_amount: '万元',
    order_count: '单',
    avg_order_value: '元',
    gross_margin: '%'
  }

  const base = baseValues[metric] || 100
  const current = generateTrendData(days, base)
  const previous = generateTrendData(days, base * (0.85 + Math.random() * 0.1))

  return {
    current,
    previous,
    unit: units[metric] || ''
  }
}

export const getAlertOverview = (): AlertOverview => {
  return {
    pendingCount: 12,
    todayNewCount: 3,
    highPriorityCount: 2,
    avgProcessingHours: 18.5
  }
}

export const getFluctuations = (): Fluctuation[] => {
  const now = dayjs()
  return [
    {
      id: 'fluc_001',
      title: '华东区域销售额异常下跌',
      description: '近7日华东区域销售额环比下跌15%，超出正常波动范围',
      readableReason: '华东区域主要经销商库存调整，导致采购量临时下降，预计持续2-3周',
      metric: 'sales_amount',
      currentValue: 3200,
      expectedValue: 3765,
      deviation: -15,
      priority: 'high',
      status: 'processing',
      assigneeId: 'user_business',
      assigneeName: '王业务',
      deadline: now.add(3, 'day').format('YYYY-MM-DD HH:mm:ss'),
      source: 'metric_monitor',
      detectedAt: now.subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss')
    },
    {
      id: 'fluc_002',
      title: '供应链接口调用失败率上升',
      description: '库存查询接口近1小时失败率达到8.5%，超过5%阈值',
      readableReason: '供应链系统正在进行版本升级，部分接口不稳定，预计今日22:00前恢复',
      metric: '',
      currentValue: undefined,
      expectedValue: undefined,
      deviation: undefined,
      priority: 'high',
      status: 'pending',
      assigneeId: 'user_supply',
      assigneeName: '赵供应',
      deadline: now.add(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
      source: 'api_error',
      detectedAt: now.subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss')
    },
    {
      id: 'fluc_003',
      title: '客单价连续3日下滑',
      description: '客单价连续3个工作日呈下降趋势，累计跌幅6.8%',
      readableReason: '低端产品促销活动拉低了整体客单价，活动结束后预计回升',
      metric: 'avg_order_value',
      currentValue: 1310,
      expectedValue: 1406,
      deviation: -6.8,
      priority: 'medium',
      status: 'pending',
      assigneeId: 'user_business',
      assigneeName: '王业务',
      deadline: now.add(5, 'day').format('YYYY-MM-DD HH:mm:ss'),
      source: 'metric_monitor',
      detectedAt: now.subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss')
    },
    {
      id: 'fluc_004',
      title: '毛利率异常偏高',
      description: '本月毛利率较上月上升4.2个百分点，需核实数据准确性',
      readableReason: '高毛利产品占比提升，叠加采购成本下降，属于正常经营改善',
      metric: 'gross_margin',
      currentValue: 36.7,
      expectedValue: 32.5,
      deviation: 4.2,
      priority: 'low',
      status: 'closed',
      assigneeId: 'user_data_admin',
      assigneeName: '李数据',
      deadline: now.subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
      source: 'metric_monitor',
      detectedAt: now.subtract(5, 'day').format('YYYY-MM-DD HH:mm:ss'),
      closedAt: now.subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
      resolution: '经核实，高毛利产品销售占比提升至45%，同时采购成本较上月下降2.3%，数据准确无误。'
    },
    {
      id: 'fluc_005',
      title: '订单量周末骤降',
      description: '上周六周日订单总量较前一周周末下降22%',
      readableReason: '恰逢月末，多数客户调整采购计划，属于周期性波动',
      metric: 'order_count',
      currentValue: 1560,
      expectedValue: 2000,
      deviation: -22,
      priority: 'medium',
      status: 'closed',
      assigneeId: 'user_business',
      assigneeName: '王业务',
      deadline: now.subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss'),
      source: 'metric_monitor',
      detectedAt: now.subtract(7, 'day').format('YYYY-MM-DD HH:mm:ss'),
      closedAt: now.subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss'),
      resolution: '属于月末周期性波动，本周一已恢复正常水平，无需特殊处理。'
    },
    {
      id: 'fluc_006',
      title: '物流信息接口超时',
      description: '物流轨迹查询接口响应超时次数增加',
      readableReason: '第三方物流服务商接口限流，已申请提高配额，预计明日生效',
      metric: '',
      currentValue: undefined,
      expectedValue: undefined,
      deviation: undefined,
      priority: 'medium',
      status: 'processing',
      assigneeId: 'user_supply',
      assigneeName: '赵供应',
      deadline: now.add(2, 'day').format('YYYY-MM-DD HH:mm:ss'),
      source: 'api_error',
      detectedAt: now.subtract(6, 'hour').format('YYYY-MM-DD HH:mm:ss')
    },
    {
      id: 'fluc_007',
      title: '西部区域销售额激增',
      description: '西部区域近3日销售额环比增长35%，需确认是否异常',
      readableReason: '西部大客户年度集中采购，属于正常业务增长',
      metric: 'sales_amount',
      currentValue: 1620,
      expectedValue: 1200,
      deviation: 35,
      priority: 'low',
      status: 'pending',
      assigneeId: 'user_business',
      assigneeName: '王业务',
      deadline: now.add(7, 'day').format('YYYY-MM-DD HH:mm:ss'),
      source: 'metric_monitor',
      detectedAt: now.subtract(12, 'hour').format('YYYY-MM-DD HH:mm:ss')
    }
  ]
}

export const getPermissionApplications = (): PermissionApplication[] => {
  const now = dayjs()
  return [
    {
      id: 'app_001',
      applicantId: 'user_business',
      applicantName: '王业务',
      permissionType: 'dataset_view',
      datasetId: 'ds_002',
      datasetName: '华南区销售明细',
      reason: '负责华南区业务拓展，需要查看详细销售数据',
      status: 'pending',
      createdAt: now.subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss')
    },
    {
      id: 'app_002',
      applicantId: 'user_supply',
      applicantName: '赵供应',
      permissionType: 'dataset_view',
      datasetId: 'ds_003',
      datasetName: '库存周转数据',
      reason: '供应链优化需要库存周转详细数据',
      status: 'pending',
      createdAt: now.subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss')
    },
    {
      id: 'app_003',
      applicantId: 'user_business',
      applicantName: '王业务',
      permissionType: 'metric_view',
      datasetId: '',
      datasetName: '',
      reason: '需要查看毛利率明细数据用于业务分析',
      status: 'approved',
      approverId: 'user_director',
      approverName: '张总监',
      approvalComment: '同意，注意数据保密',
      approvedAt: now.subtract(5, 'day').format('YYYY-MM-DD HH:mm:ss'),
      createdAt: now.subtract(6, 'day').format('YYYY-MM-DD HH:mm:ss')
    }
  ]
}

export const getDataMaskingConfigs = (): DataMaskingConfig[] => {
  return [
    { id: 'dm_001', fieldName: 'customer_phone', displayName: '客户手机号', maskType: 'partial' },
    { id: 'dm_002', fieldName: 'customer_name', displayName: '客户名称', maskType: 'partial' },
    { id: 'dm_003', fieldName: 'customer_email', displayName: '客户邮箱', maskType: 'partial' },
    { id: 'dm_004', fieldName: 'sale_amount', displayName: '销售金额', maskType: 'none' },
    { id: 'dm_005', fieldName: 'cost_price', displayName: '成本价', maskType: 'full' },
    { id: 'dm_006', fieldName: 'profit_margin', displayName: '利润率', maskType: 'none' },
    { id: 'dm_007', fieldName: 'address', displayName: '收货地址', maskType: 'partial' },
    { id: 'dm_008', fieldName: 'id_card', displayName: '身份证号', maskType: 'full' }
  ]
}

export const getDatasets = (): Dataset[] => {
  return [
    { id: 'ds_001', name: '全国销售汇总', description: '全国各区域销售数据汇总报表', businessLine: '销售中心', ownerId: 'user_data_admin', ownerName: '李数据', createdAt: '2024-01-15T00:00:00Z' },
    { id: 'ds_002', name: '华南区销售明细', description: '华南区域客户级销售明细数据', businessLine: '华南大区', ownerId: 'user_business', ownerName: '王业务', createdAt: '2024-02-01T00:00:00Z' },
    { id: 'ds_003', name: '库存周转数据', description: '各仓库库存周转率及明细', businessLine: '供应链', ownerId: 'user_supply', ownerName: '赵供应', createdAt: '2024-02-10T00:00:00Z' },
    { id: 'ds_004', name: '华东区销售明细', description: '华东区域客户级销售明细数据', businessLine: '华东大区', ownerId: 'user_business', ownerName: '王业务', createdAt: '2024-03-01T00:00:00Z' },
    { id: 'ds_005', name: '产品毛利分析', description: '各产品线毛利率及成本分析', businessLine: '财务', ownerId: 'user_data_admin', ownerName: '李数据', createdAt: '2024-03-15T00:00:00Z' },
    { id: 'ds_006', name: '西部大区销售明细', description: '西部区域客户级销售明细数据', businessLine: '西部大区', ownerId: 'user_business', ownerName: '王业务', createdAt: '2024-04-01T00:00:00Z' }
  ]
}

export const getTodoGroups = (): TodoGroup[] => {
  const now = dayjs()
  return [
    {
      assigneeId: 'user_business',
      assigneeName: '王业务',
      count: 5,
      items: [
        { id: 'todo_001', type: 'alert', refId: 'fluc_001', title: '处理华东区域销售额异常下跌', priority: 'high', status: 'pending', deadline: now.add(3, 'day').format('YYYY-MM-DD HH:mm:ss'), createdAt: now.subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss') },
        { id: 'todo_002', type: 'alert', refId: 'fluc_003', title: '处理客单价连续下滑问题', priority: 'medium', status: 'pending', deadline: now.add(5, 'day').format('YYYY-MM-DD HH:mm:ss'), createdAt: now.subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss') },
        { id: 'todo_003', type: 'alert', refId: 'fluc_007', title: '核实西部区域销售激增原因', priority: 'low', status: 'pending', deadline: now.add(7, 'day').format('YYYY-MM-DD HH:mm:ss'), createdAt: now.subtract(12, 'hour').format('YYYY-MM-DD HH:mm:ss') },
        { id: 'todo_004', type: 'summary', refId: 'sp_001', title: '查看每日销售摘要推送', priority: 'low', status: 'pending', deadline: now.endOf('day').format('YYYY-MM-DD HH:mm:ss'), createdAt: now.startOf('day').format('YYYY-MM-DD HH:mm:ss') },
        { id: 'todo_005', type: 'approval', refId: 'app_001', title: '提交的权限申请待审批', priority: 'medium', status: 'pending', deadline: now.add(2, 'day').format('YYYY-MM-DD HH:mm:ss'), createdAt: now.subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss') }
      ]
    },
    {
      assigneeId: 'user_supply',
      assigneeName: '赵供应',
      count: 2,
      items: [
        { id: 'todo_006', type: 'alert', refId: 'fluc_002', title: '处理供应链接口调用失败问题', priority: 'high', status: 'pending', deadline: now.add(1, 'day').format('YYYY-MM-DD HH:mm:ss'), createdAt: now.subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss') },
        { id: 'todo_007', type: 'alert', refId: 'fluc_006', title: '处理物流信息接口超时问题', priority: 'medium', status: 'processing', deadline: now.add(2, 'day').format('YYYY-MM-DD HH:mm:ss'), createdAt: now.subtract(6, 'hour').format('YYYY-MM-DD HH:mm:ss') }
      ]
    },
    {
      assigneeId: 'user_data_admin',
      assigneeName: '李数据',
      count: 2,
      items: [
        { id: 'todo_008', type: 'approval', refId: 'app_001', title: '审核王业务的数据集权限申请', priority: 'medium', status: 'pending', deadline: now.add(1, 'day').format('YYYY-MM-DD HH:mm:ss'), createdAt: now.subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss') },
        { id: 'todo_009', type: 'approval', refId: 'app_002', title: '审核赵供应的库存数据申请', priority: 'low', status: 'pending', deadline: now.add(2, 'day').format('YYYY-MM-DD HH:mm:ss'), createdAt: now.subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss') }
      ]
    },
    {
      assigneeId: 'user_director',
      assigneeName: '张总监',
      count: 1,
      items: [
        { id: 'todo_010', type: 'summary', refId: 'sp_002', title: '查看本周经营摘要报告', priority: 'medium', status: 'pending', deadline: now.endOf('week').format('YYYY-MM-DD HH:mm:ss'), createdAt: now.startOf('week').format('YYYY-MM-DD HH:mm:ss') }
      ]
    }
  ]
}

export const getSummaryPushes = (): SummaryPush[] => {
  return [
    { id: 'sp_001', name: '每日销售摘要', type: 'daily', metricIds: ['sales_amount', 'order_count', 'gross_margin'], frequency: '每天 09:00', userId: 'user_business', enabled: true, createdAt: '2024-01-10T00:00:00Z' },
    { id: 'sp_002', name: '周经营报告', type: 'weekly', metricIds: ['sales_amount', 'order_count', 'avg_order_value', 'gross_margin'], frequency: '每周一 09:00', userId: 'user_director', enabled: true, createdAt: '2024-01-08T00:00:00Z' },
    { id: 'sp_003', name: '库存日报', type: 'daily', metricIds: ['inventory_turnover', 'stock_level'], frequency: '每天 08:30', userId: 'user_supply', enabled: true, createdAt: '2024-02-15T00:00:00Z' },
    { id: 'sp_004', name: '月度财务摘要', type: 'daily', metricIds: ['revenue', 'cost', 'profit'], frequency: '每月1日 10:00', userId: 'user_data_admin', enabled: false, createdAt: '2024-03-01T00:00:00Z' }
  ]
}

export const getAlertRules = (): AlertRule[] => {
  return [
    { id: 'ar_001', metricId: 'metric_sales', metricName: '销售额', ruleType: 'threshold', thresholdConfig: { direction: 'both', percentage: 10 }, notificationType: 'inapp', assigneeId: 'user_business', assigneeName: '王业务', enabled: true, createdAt: '2024-01-10T00:00:00Z' },
    { id: 'ar_002', metricId: 'metric_orders', metricName: '订单量', ruleType: 'threshold', thresholdConfig: { direction: 'both', percentage: 15 }, notificationType: 'inapp', assigneeId: 'user_business', assigneeName: '王业务', enabled: true, createdAt: '2024-01-10T00:00:00Z' },
    { id: 'ar_003', metricId: 'metric_margin', metricName: '毛利率', ruleType: 'trend', thresholdConfig: { direction: 'down', days: 3, percentage: 2 }, notificationType: 'both', assigneeId: 'user_data_admin', assigneeName: '李数据', enabled: true, createdAt: '2024-01-15T00:00:00Z' },
    { id: 'ar_004', metricId: 'metric_aov', metricName: '客单价', ruleType: 'fluctuation', thresholdConfig: { stdDeviations: 2 }, notificationType: 'inapp', assigneeId: 'user_business', assigneeName: '王业务', enabled: false, createdAt: '2024-02-01T00:00:00Z' },
    { id: 'ar_005', metricId: '', metricName: '接口错误率', ruleType: 'threshold', thresholdConfig: { maxErrorRate: 5 }, notificationType: 'both', assigneeId: 'user_supply', assigneeName: '赵供应', enabled: true, createdAt: '2024-02-10T00:00:00Z' }
  ]
}

export const getMonthlyReport = (month: string): MonthlyReport => {
  return {
    month,
    totalSales: 38560.8,
    totalOrders: 28560,
    avgMargin: 32.5,
    fluctuationCount: 28,
    closedFluctuations: 25,
    avgProcessingHours: 22.4,
    fluctuationByCategory: [
      { name: '销售额波动', value: 12 },
      { name: '订单量波动', value: 6 },
      { name: '毛利率异常', value: 3 },
      { name: '接口错误', value: 5 },
      { name: '其他', value: 2 }
    ],
    processingTimeDistribution: [
      { name: '< 4小时', value: 8 },
      { name: '4-12小时', value: 10 },
      { name: '12-24小时', value: 5 },
      { name: '1-3天', value: 3 },
      { name: '> 3天', value: 2 }
    ]
  }
}

export const getFluctuationLogs = (fluctuationId: string): FluctuationLog[] => {
  const now = dayjs()
  return [
    {
      id: 'log_001',
      fluctuationId,
      action: 'detected',
      operatorName: '系统',
      remark: '系统自动检测到指标异常波动，偏差-15%',
      createdAt: now.subtract(3, 'day').subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss')
    },
    {
      id: 'log_002',
      fluctuationId,
      action: 'assigned',
      operatorId: 'user_director',
      operatorName: '张总监',
      remark: '指派给王业务负责处理，要求3天内给出原因分析',
      createdAt: now.subtract(3, 'day').subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss')
    },
    {
      id: 'log_003',
      fluctuationId,
      action: 'processing',
      operatorId: 'user_business',
      operatorName: '王业务',
      remark: '已开始调查，初步判断与经销商库存调整有关',
      createdAt: now.subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss')
    },
    {
      id: 'log_004',
      fluctuationId,
      action: 'comment',
      operatorId: 'user_data_admin',
      operatorName: '李数据',
      remark: '数据组已确认数据准确性，无数据质量问题',
      createdAt: now.subtract(1, 'day').subtract(4, 'hour').format('YYYY-MM-DD HH:mm:ss')
    },
    {
      id: 'log_005',
      fluctuationId,
      action: 'closed',
      operatorId: 'user_business',
      operatorName: '王业务',
      remark: '已确认原因为华东经销商库存调整，预计2-3周后恢复正常，已同步销售团队。',
      createdAt: now.subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss')
    }
  ]
}
