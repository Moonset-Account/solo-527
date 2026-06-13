import { PrismaClient, UserRole, AlertPeriod, ThresholdType, AlertDirection, AlertSeverity, AnomalyStatus } from '@prisma/client'

const db = new PrismaClient()

const METRIC_BASELINES: Record<string, number> = {
  sales_amount: 500000,
  order_count: 2000,
  avg_order_value: 250,
  conversion_rate: 3.5,
  new_users: 500,
  repurchase_rate: 35,
}

const ROOT_CAUSE_CATEGORIES = [
  '市场波动',
  '系统故障',
  '数据口径变更',
  '运营活动影响',
  '季节性因素',
  '其他',
]

function daysAgo(days: number, hours = 0, minutes = 0): Date {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setHours(hours, minutes, 0, 0)
  return date
}

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

async function main() {
  console.log('开始种子数据初始化...')

  await db.$connect()

  console.log('清理现有数据...')
  await db.anomalyComment.deleteMany()
  await db.anomaly.deleteMany()
  await db.alertRule.deleteMany()
  await db.metricChangeLog.deleteMany()
  await db.metricDataPoint.deleteMany()
  await db.metric.deleteMany()
  await db.user.deleteMany()

  console.log('1. 创建用户...')
  const director = await db.user.create({
    data: {
      clerkId: 'user_director_1',
      email: 'director@example.com',
      name: '张总监',
      role: UserRole.SALES_DIRECTOR,
    },
  })

  const manager = await db.user.create({
    data: {
      clerkId: 'user_manager_1',
      email: 'manager@example.com',
      name: '李经理',
      role: UserRole.SALES_MANAGER,
    },
  })

  const ops = await db.user.create({
    data: {
      clerkId: 'user_ops_1',
      email: 'ops@example.com',
      name: '王运营',
      role: UserRole.DATA_OPERATOR,
    },
  })

  console.log('   ✓ 创建了 3 个用户')

  console.log('2. 创建指标...')
  const salesAmount = await db.metric.create({
    data: {
      name: '销售额',
      code: 'sales_amount',
      description: '统计周期内的总销售金额',
      formula: "SUM(order_amount) WHERE order_status = 'completed'",
      dataSource: '交易数据库',
      unit: '元',
      category: '销售',
    },
  })

  const orderCount = await db.metric.create({
    data: {
      name: '订单量',
      code: 'order_count',
      description: '统计周期内的有效订单数量',
      formula: "COUNT(order_id) WHERE order_status = 'completed'",
      dataSource: '交易数据库',
      unit: '单',
      category: '销售',
    },
  })

  const avgOrderValue = await db.metric.create({
    data: {
      name: '客单价',
      code: 'avg_order_value',
      description: '平均每个订单的金额',
      formula: 'SUM(order_amount) / COUNT(order_id)',
      dataSource: '交易数据库',
      unit: '元',
      category: '销售',
    },
  })

  const conversionRate = await db.metric.create({
    data: {
      name: '转化率',
      code: 'conversion_rate',
      description: '访客到下单用户的转化比例',
      formula: 'paying_users / total_visitors * 100%',
      dataSource: '数据分析平台',
      unit: '%',
      category: '转化',
    },
  })

  const newUsers = await db.metric.create({
    data: {
      name: '新用户数',
      code: 'new_users',
      description: '统计周期内新增的付费用户数',
      formula: 'COUNT(DISTINCT user_id) WHERE first_order_date IN period',
      dataSource: '用户数据库',
      unit: '人',
      category: '用户',
    },
  })

  const repurchaseRate = await db.metric.create({
    data: {
      name: '复购率',
      code: 'repurchase_rate',
      description: '老用户在统计周期内再次购买的比例',
      formula: 'returning_users / total_old_users * 100%',
      dataSource: '用户数据库',
      unit: '%',
      category: '用户',
    },
  })

  const metrics = [salesAmount, orderCount, avgOrderValue, conversionRate, newUsers, repurchaseRate]
  console.log('   ✓ 创建了 6 个指标')

  console.log('3. 创建告警规则...')
  const rule1 = await db.alertRule.create({
    data: {
      name: '日销售额跌幅告警',
      metricId: salesAmount.id,
      period: AlertPeriod.DAY,
      thresholdType: ThresholdType.PERCENTAGE,
      thresholdValue: 10,
      direction: AlertDirection.BELOW,
      severity: AlertSeverity.HIGH,
      channels: [{ type: 'in_app', recipients: ['all'] }, { type: 'email', recipients: ['director@example.com'] }],
      isEnabled: true,
      createdById: director.id,
    },
  })

  const rule2 = await db.alertRule.create({
    data: {
      name: '周订单量异常告警',
      metricId: orderCount.id,
      period: AlertPeriod.WEEK,
      thresholdType: ThresholdType.ABSOLUTE,
      thresholdValue: 500,
      direction: AlertDirection.BELOW,
      severity: AlertSeverity.MEDIUM,
      channels: [{ type: 'in_app', recipients: ['all'] }],
      isEnabled: true,
      createdById: director.id,
    },
  })

  const rule3 = await db.alertRule.create({
    data: {
      name: '转化率异常监控',
      metricId: conversionRate.id,
      period: AlertPeriod.DAY,
      thresholdType: ThresholdType.PERCENTAGE,
      thresholdValue: 5,
      direction: AlertDirection.BELOW,
      severity: AlertSeverity.CRITICAL,
      channels: [{ type: 'in_app', recipients: ['all'] }, { type: 'wework', recipients: ['sales-group'] }],
      isEnabled: true,
      createdById: director.id,
    },
  })

  const rule4 = await db.alertRule.create({
    data: {
      name: '月销售目标达成预警',
      metricId: salesAmount.id,
      period: AlertPeriod.MONTH,
      thresholdType: ThresholdType.PERCENTAGE,
      thresholdValue: 20,
      direction: AlertDirection.BELOW,
      severity: AlertSeverity.HIGH,
      channels: [{ type: 'email', recipients: ['director@example.com'] }],
      isEnabled: false,
      createdById: director.id,
    },
  })

  const rule5 = await db.alertRule.create({
    data: {
      name: '复购率下降监控',
      metricId: repurchaseRate.id,
      period: AlertPeriod.WEEK,
      thresholdType: ThresholdType.PERCENTAGE,
      thresholdValue: 3,
      direction: AlertDirection.BELOW,
      severity: AlertSeverity.MEDIUM,
      channels: [{ type: 'in_app', recipients: ['all'] }],
      isEnabled: true,
      createdById: director.id,
    },
  })

  const rule6 = await db.alertRule.create({
    data: {
      name: '客单价双向波动告警',
      metricId: avgOrderValue.id,
      period: AlertPeriod.DAY,
      thresholdType: ThresholdType.PERCENTAGE,
      thresholdValue: 15,
      direction: AlertDirection.BOTH,
      severity: AlertSeverity.LOW,
      channels: [{ type: 'in_app', recipients: ['ops'] }],
      isEnabled: true,
      createdById: director.id,
    },
  })

  const alertRules = [rule1, rule2, rule3, rule4, rule5, rule6]
  console.log('   ✓ 创建了 6 个告警规则')

  console.log('4. 创建异常记录...')
  const anomalies = []

  anomalies.push(await db.anomaly.create({
    data: {
      alertRuleId: rule1.id,
      metricId: salesAmount.id,
      detectedAt: daysAgo(2, 9, 30),
      periodStart: daysAgo(3, 0, 0),
      periodEnd: daysAgo(2, 23, 59),
      actualValue: 380000,
      expectedValue: 500000,
      deviation: -120000,
      deviationPercentage: -24,
      severity: AlertSeverity.CRITICAL,
      status: AnomalyStatus.OPEN,
      summary: null,
      rootCause: null,
      rootCauseCategory: null,
      assignedToId: manager.id,
      resolvedAt: null,
    },
  }))

  anomalies.push(await db.anomaly.create({
    data: {
      alertRuleId: rule3.id,
      metricId: conversionRate.id,
      detectedAt: daysAgo(1, 10, 15),
      periodStart: daysAgo(2, 0, 0),
      periodEnd: daysAgo(1, 23, 59),
      actualValue: 2.8,
      expectedValue: 3.5,
      deviation: -0.7,
      deviationPercentage: -20,
      severity: AlertSeverity.HIGH,
      status: AnomalyStatus.INVESTIGATING,
      summary: null,
      rootCause: null,
      rootCauseCategory: null,
      assignedToId: ops.id,
      resolvedAt: null,
    },
  }))

  anomalies.push(await db.anomaly.create({
    data: {
      alertRuleId: rule2.id,
      metricId: orderCount.id,
      detectedAt: daysAgo(5, 8, 0),
      periodStart: daysAgo(12, 0, 0),
      periodEnd: daysAgo(5, 23, 59),
      actualValue: 11200,
      expectedValue: 14000,
      deviation: -2800,
      deviationPercentage: -20,
      severity: AlertSeverity.MEDIUM,
      status: AnomalyStatus.INVESTIGATING,
      summary: null,
      rootCause: null,
      rootCauseCategory: null,
      assignedToId: manager.id,
      resolvedAt: null,
    },
  }))

  anomalies.push(await db.anomaly.create({
    data: {
      alertRuleId: rule1.id,
      metricId: salesAmount.id,
      detectedAt: daysAgo(7, 9, 0),
      periodStart: daysAgo(8, 0, 0),
      periodEnd: daysAgo(7, 23, 59),
      actualValue: 420000,
      expectedValue: 500000,
      deviation: -80000,
      deviationPercentage: -16,
      severity: AlertSeverity.HIGH,
      status: AnomalyStatus.RESOLVED,
      summary: '已完成根因分析并恢复正常',
      rootCause: '竞品大型促销活动导致用户流失，已启动针对性优惠活动',
      rootCauseCategory: '市场波动',
      assignedToId: manager.id,
      resolvedAt: daysAgo(5, 16, 30),
    },
  }))

  anomalies.push(await db.anomaly.create({
    data: {
      alertRuleId: rule5.id,
      metricId: repurchaseRate.id,
      detectedAt: daysAgo(10, 9, 0),
      periodStart: daysAgo(17, 0, 0),
      periodEnd: daysAgo(10, 23, 59),
      actualValue: 29.5,
      expectedValue: 35,
      deviation: -5.5,
      deviationPercentage: -15.7,
      severity: AlertSeverity.MEDIUM,
      status: AnomalyStatus.RESOLVED,
      summary: '会员系统故障已修复',
      rootCause: '会员积分系统升级导致老用户权益计算异常，已修复并补发积分',
      rootCauseCategory: '系统故障',
      assignedToId: ops.id,
      resolvedAt: daysAgo(8, 11, 0),
    },
  }))

  anomalies.push(await db.anomaly.create({
    data: {
      alertRuleId: rule6.id,
      metricId: avgOrderValue.id,
      detectedAt: daysAgo(14, 10, 0),
      periodStart: daysAgo(15, 0, 0),
      periodEnd: daysAgo(14, 23, 59),
      actualValue: 320,
      expectedValue: 250,
      deviation: 70,
      deviationPercentage: 28,
      severity: AlertSeverity.LOW,
      status: AnomalyStatus.IGNORED,
      summary: null,
      rootCause: null,
      rootCauseCategory: null,
      assignedToId: null,
      resolvedAt: null,
    },
  }))

  anomalies.push(await db.anomaly.create({
    data: {
      alertRuleId: rule1.id,
      metricId: salesAmount.id,
      detectedAt: daysAgo(18, 9, 0),
      periodStart: daysAgo(19, 0, 0),
      periodEnd: daysAgo(18, 23, 59),
      actualValue: 440000,
      expectedValue: 500000,
      deviation: -60000,
      deviationPercentage: -12,
      severity: AlertSeverity.MEDIUM,
      status: AnomalyStatus.RESOLVED,
      summary: '数据口径调整完成',
      rootCause: '订单统计口径变更，将退款订单从有效订单中排除',
      rootCauseCategory: '数据口径变更',
      assignedToId: ops.id,
      resolvedAt: daysAgo(16, 14, 0),
    },
  }))

  anomalies.push(await db.anomaly.create({
    data: {
      alertRuleId: rule3.id,
      metricId: conversionRate.id,
      detectedAt: daysAgo(22, 10, 30),
      periodStart: daysAgo(23, 0, 0),
      periodEnd: daysAgo(22, 23, 59),
      actualValue: 4.2,
      expectedValue: 3.5,
      deviation: 0.7,
      deviationPercentage: 20,
      severity: AlertSeverity.MEDIUM,
      status: AnomalyStatus.RESOLVED,
      summary: '双十一活动效果显著',
      rootCause: '双十一预热活动带来大量精准流量，转化率提升',
      rootCauseCategory: '运营活动影响',
      assignedToId: manager.id,
      resolvedAt: daysAgo(20, 9, 0),
    },
  }))

  anomalies.push(await db.anomaly.create({
    data: {
      alertRuleId: rule2.id,
      metricId: orderCount.id,
      detectedAt: daysAgo(25, 8, 0),
      periodStart: daysAgo(32, 0, 0),
      periodEnd: daysAgo(25, 23, 59),
      actualValue: 16800,
      expectedValue: 14000,
      deviation: 2800,
      deviationPercentage: 20,
      severity: AlertSeverity.LOW,
      status: AnomalyStatus.IGNORED,
      summary: null,
      rootCause: null,
      rootCauseCategory: null,
      assignedToId: null,
      resolvedAt: null,
    },
  }))

  anomalies.push(await db.anomaly.create({
    data: {
      alertRuleId: rule4.id,
      metricId: salesAmount.id,
      detectedAt: daysAgo(28, 9, 0),
      periodStart: daysAgo(58, 0, 0),
      periodEnd: daysAgo(28, 23, 59),
      actualValue: 12000000,
      expectedValue: 15000000,
      deviation: -3000000,
      deviationPercentage: -20,
      severity: AlertSeverity.HIGH,
      status: AnomalyStatus.RESOLVED,
      summary: '季节性因素已确认',
      rootCause: '春节假期影响，属于正常季节性波动',
      rootCauseCategory: '季节性因素',
      assignedToId: manager.id,
      resolvedAt: daysAgo(26, 10, 0),
    },
  }))

  console.log(`   ✓ 创建了 ${anomalies.length} 个异常记录`)

  console.log('5. 创建异常评论...')
  const commentContents = [
    '已收到告警，开始排查原因。',
    '初步分析可能与最近的营销活动有关。',
    '确认是系统接口异常导致的数据延迟。',
    '技术团队正在修复中。',
    '问题已修复，数据恢复正常。',
    '建议优化监控阈值，减少误报。',
    '已同步给相关业务部门。',
    '需要进一步确认影响范围。',
    '已完成根因分析报告。',
    '后续将加强此指标的监控力度。',
  ]

  const users = [director, manager, ops]
  let commentCount = 0

  for (const anomaly of anomalies) {
    const numComments = Math.floor(Math.random() * 3) + 3
    for (let i = 0; i < numComments; i++) {
      const user = users[Math.floor(Math.random() * users.length)]
      const content = commentContents[Math.floor(Math.random() * commentContents.length)]
      const commentDate = new Date(anomaly.detectedAt.getTime() + (i + 1) * 3600000 * (Math.random() * 5 + 1))

      await db.anomalyComment.create({
        data: {
          anomalyId: anomaly.id,
          userId: user.id,
          content,
          createdAt: commentDate,
        },
      })
      commentCount++
    }
  }

  console.log(`   ✓ 创建了 ${commentCount} 条异常评论`)

  console.log('6. 创建指标数据点 (30天)...')
  let dataPointCount = 0

  for (const metric of metrics) {
    const baseValue = METRIC_BASELINES[metric.code] || 100

    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const dayOfWeek = date.getDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

      let variation = (Math.random() - 0.5) * 0.2
      if (isWeekend) variation += 0.05

      if (i >= 18 && i <= 22 && metric.code === 'sales_amount') {
        variation -= 0.15
      }
      if (i >= 22 && i <= 25 && metric.code === 'conversion_rate') {
        variation += 0.2
      }

      const value = baseValue * (1 + variation)
      const decimals = metric.unit === '%' || metric.unit === '元' && metric.code === 'avg_order_value' ? 2 : 0

      await db.metricDataPoint.create({
        data: {
          metricId: metric.id,
          date,
          value: roundTo(value, decimals),
          period: AlertPeriod.DAY,
        },
      })
      dataPointCount++
    }
  }

  console.log(`   ✓ 创建了 ${dataPointCount} 个指标数据点`)

  console.log('7. 创建指标变更日志...')
  const changeLogs = []

  changeLogs.push(await db.metricChangeLog.create({
    data: {
      metricId: salesAmount.id,
      fieldChanged: 'formula',
      oldValue: "SUM(order_amount) WHERE order_status = 'paid'",
      newValue: "SUM(order_amount) WHERE order_status = 'completed'",
      createdById: ops.id,
      createdAt: daysAgo(20, 10, 0),
      approvedById: director.id,
      approvedAt: daysAgo(19, 14, 30),
      description: '将订单状态从已支付调整为已完成，排除退款订单',
    },
  }))

  changeLogs.push(await db.metricChangeLog.create({
    data: {
      metricId: conversionRate.id,
      fieldChanged: 'dataSource',
      oldValue: 'GA分析平台',
      newValue: '数据分析平台',
      createdById: ops.id,
      createdAt: daysAgo(15, 9, 0),
      approvedById: null,
      approvedAt: null,
      description: '数据源迁移，待审批',
    },
  }))

  changeLogs.push(await db.metricChangeLog.create({
    data: {
      metricId: newUsers.id,
      fieldChanged: 'description',
      oldValue: '统计周期内新增的注册用户数',
      newValue: '统计周期内新增的付费用户数',
      createdById: manager.id,
      createdAt: daysAgo(10, 11, 0),
      approvedById: director.id,
      approvedAt: daysAgo(9, 16, 0),
      description: '明确新用户定义为首付费用户',
    },
  }))

  changeLogs.push(await db.metricChangeLog.create({
    data: {
      metricId: avgOrderValue.id,
      fieldChanged: 'formula',
      oldValue: 'total_sales / total_orders',
      newValue: 'SUM(order_amount) / COUNT(order_id)',
      createdById: ops.id,
      createdAt: daysAgo(5, 14, 0),
      approvedById: null,
      approvedAt: null,
      description: '优化公式表述，更清晰易懂',
    },
  }))

  console.log(`   ✓ 创建了 ${changeLogs.length} 个指标变更日志`)

  console.log('')
  console.log('========================================')
  console.log('  种子数据初始化完成！')
  console.log('========================================')
  console.log('')
  console.log('创建的数据汇总：')
  console.log(`  用户: 3 个 (总监 1 名, 经理 1 名, 运营 1 名)`)
  console.log(`  指标: 6 个`)
  console.log(`  告警规则: 6 个`)
  console.log(`  异常记录: ${anomalies.length} 个`)
  console.log(`  异常评论: ${commentCount} 条`)
  console.log(`  指标数据点: ${dataPointCount} 个 (6指标 × 30天)`)
  console.log(`  指标变更日志: ${changeLogs.length} 个`)
  console.log('')
}

main()
  .catch((e) => {
    console.error('种子数据初始化失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
    process.exit(0)
  })
