import {
  FunnelData,
  CohortData,
  FeatureUsage,
  PathData,
  ChurnReason,
  ETLStatus,
  MetricConfig,
  FilterDimensions,
} from '../types';

const channels = ['自然搜索', '付费广告', '社交媒体', '邮件营销', '直接访问', '推荐邀请'];
const versions = ['v2.1.0', 'v2.0.5', 'v2.0.0', 'v1.9.2'];
const modules = ['项目管理', '数据分析', '团队协作', '文件存储', '集成中心', '设置'];
const teams = ['产品团队', '研发团队', '市场团队', '销售团队', '客户成功', '运营团队'];
const users = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'];

export const filterOptions = {
  users,
  teams,
  channels,
  versions,
  modules,
};

export const generateFunnelData = (filters: FilterDimensions): FunnelData => {
  const baseMultiplier = filters.trafficType === 'experiment' ? 0.7 : 1;
  const channelMultiplier = filters.channels.length > 0 ? 0.6 : 1;
  const multiplier = baseMultiplier * channelMultiplier;

  const steps = [
    { id: 'register', name: '用户注册', count: Math.round(10000 * multiplier) },
    { id: 'activate', name: '账号激活', count: Math.round(7500 * multiplier) },
    { id: 'invite', name: '邀请成员', count: Math.round(4200 * multiplier) },
    { id: 'first_use', name: '首次使用核心功能', count: Math.round(3100 * multiplier) },
    { id: 'first_pay', name: '首次付费', count: Math.round(1240 * multiplier) },
    { id: 'renew', name: '续费/升级', count: Math.round(868 * multiplier) },
  ];

  return {
    steps: steps.map((step, index) => ({
      ...step,
      conversionRate: index === 0 ? 100 : Math.round((step.count / steps[0].count) * 10000) / 100,
      dropOffRate: index === 0 ? 0 : Math.round((1 - step.count / steps[index - 1].count) * 10000) / 100,
    })),
    totalUsers: steps[0].count,
    overallConversion: Math.round((steps[steps.length - 1].count / steps[0].count) * 10000) / 100,
  };
};

export const generateCohortData = (): CohortData => {
  const cohorts = ['2024-W01', '2024-W02', '2024-W03', '2024-W04', '2024-W05', '2024-W06', '2024-W07', '2024-W08'];
  
  return cohorts.map((cohort, i) => {
    const baseSize = 1000 + Math.random() * 500;
    const decay = 0.85 + Math.random() * 0.1;
    return {
      cohort,
      cohortSize: Math.round(baseSize),
      week0: 100,
      week1: i < 7 ? Math.round(75 * Math.pow(decay, 0) + Math.random() * 10) : null as any,
      week2: i < 6 ? Math.round(62 * Math.pow(decay, 1) + Math.random() * 8) : null as any,
      week3: i < 5 ? Math.round(54 * Math.pow(decay, 2) + Math.random() * 6) : null as any,
      week4: i < 4 ? Math.round(48 * Math.pow(decay, 3) + Math.random() * 5) : null as any,
      week5: i < 3 ? Math.round(42 * Math.pow(decay, 4) + Math.random() * 4) : null as any,
      week6: i < 2 ? Math.round(38 * Math.pow(decay, 5) + Math.random() * 3) : null as any,
      week7: i < 1 ? Math.round(35 * Math.pow(decay, 6) + Math.random() * 3) : null as any,
    };
  });
};

export const generateFeatureUsage = (): FeatureUsage[] => {
  const features = [
    { id: 'kanban', name: '看板视图', module: '项目管理' },
    { id: 'gantt', name: '甘特图', module: '项目管理' },
    { id: 'dashboard', name: '数据仪表盘', module: '数据分析' },
    { id: 'report', name: '自定义报表', module: '数据分析' },
    { id: 'chat', name: '实时聊天', module: '团队协作' },
    { id: 'meeting', name: '视频会议', module: '团队协作' },
    { id: 'doc', name: '在线文档', module: '文件存储' },
    { id: 'drive', name: '云盘', module: '文件存储' },
    { id: 'slack', name: 'Slack 集成', module: '集成中心' },
    { id: 'api', name: '开放 API', module: '集成中心' },
  ];

  return features.map(f => ({
    ...f,
    users: Math.round(500 + Math.random() * 2500),
    sessions: Math.round(2000 + Math.random() * 15000),
    avgDuration: Math.round(60 + Math.random() * 300),
    adoptionRate: Math.round((20 + Math.random() * 60) * 100) / 100,
    trend: Math.round((-10 + Math.random() * 30) * 100) / 100,
  })).sort((a, b) => b.users - a.users);
};

export const generatePathData = (): PathData => {
  const nodes = [
    { id: 'entry', name: '进入产品', value: 10000, category: 'entry' as const },
    { id: 'dashboard', name: '查看仪表盘', value: 6500, category: 'feature' as const },
    { id: 'projects', name: '项目列表', value: 5200, category: 'feature' as const },
    { id: 'team', name: '团队管理', value: 3800, category: 'feature' as const },
    { id: 'reports', name: '报表中心', value: 3100, category: 'feature' as const },
    { id: 'settings', name: '设置', value: 2200, category: 'feature' as const },
    { id: 'files', name: '文件管理', value: 1900, category: 'feature' as const },
    { id: 'integrations', name: '集成中心', value: 1200, category: 'feature' as const },
    { id: 'billing', name: '账单管理', value: 950, category: 'feature' as const },
    { id: 'exit', name: '退出产品', value: 4500, category: 'exit' as const },
  ];

  const links = [
    { source: 'entry', target: 'dashboard', value: 4200 },
    { source: 'entry', target: 'projects', value: 3500 },
    { source: 'entry', target: 'team', value: 1500 },
    { source: 'entry', target: 'exit', value: 800 },
    { source: 'dashboard', target: 'projects', value: 1800 },
    { source: 'dashboard', target: 'reports', value: 1500 },
    { source: 'dashboard', target: 'exit', value: 1000 },
    { source: 'projects', target: 'team', value: 1200 },
    { source: 'projects', target: 'files', value: 1000 },
    { source: 'projects', target: 'exit', value: 1200 },
    { source: 'team', target: 'settings', value: 800 },
    { source: 'team', target: 'billing', value: 600 },
    { source: 'team', target: 'exit', value: 1200 },
    { source: 'reports', target: 'dashboard', value: 500 },
    { source: 'reports', target: 'exit', value: 1100 },
    { source: 'settings', target: 'integrations', value: 700 },
    { source: 'settings', target: 'exit', value: 700 },
    { source: 'files', target: 'exit', value: 900 },
    { source: 'integrations', target: 'exit', value: 500 },
    { source: 'billing', target: 'exit', value: 350 },
  ];

  return { nodes, links };
};

export const generateChurnReasons = (): ChurnReason[] => {
  const reasons = [
    { id: '1', reason: '产品功能不满足需求', count: 245 },
    { id: '2', reason: '价格过高', count: 198 },
    { id: '3', reason: '转向竞品', count: 156 },
    { id: '4', reason: '团队规模缩减', count: 124 },
    { id: '5', reason: '使用体验不佳', count: 98 },
    { id: '6', reason: '客户支持响应慢', count: 76 },
    { id: '7', reason: '其他原因', count: 103 },
  ];

  const total = reasons.reduce((sum, r) => sum + r.count, 0);
  return reasons.map(r => ({
    ...r,
    percentage: Math.round((r.count / total) * 10000) / 100,
  }));
};

export const etlStatus: ETLStatus = {
  lastUpdated: '2024-12-15 08:30:00',
  status: 'success',
  nextRun: '2024-12-16 08:30:00',
  recordsProcessed: 2456789,
};

export const metricConfigs: MetricConfig[] = [
  {
    id: 'activation_rate',
    name: '激活率',
    definition: '完成邮箱验证并首次登录的用户占注册用户的比例',
    calculation: '激活用户数 / 注册用户数 * 100%',
  },
  {
    id: 'retention_7d',
    name: '7日留存率',
    definition: '注册后第7天仍活跃的用户占该注册批次的比例',
    calculation: '第7天活跃用户数 / 注册用户数 * 100%',
  },
  {
    id: 'conversion_to_pay',
    name: '付费转化率',
    definition: '首次付费用户占有过活跃行为用户的比例',
    calculation: '首次付费用户数 / 激活用户数 * 100%',
  },
  {
    id: 'churn_rate',
    name: '月流失率',
    definition: '上月付费用户中本月不再付费的比例',
    calculation: '流失付费用户数 / 上月付费用户数 * 100%',
  },
];
