import {
  FunnelData,
  CohortData,
  FeatureUsage,
  PathData,
  ChurnReason,
  FilterDimensions,
  DateRange,
  ETLStatus,
  ExportTask,
} from '../types';
import { format, parseISO, differenceInDays, subWeeks, eachWeekOfInterval } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class DataCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000;

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  get size(): number {
    return this.cache.size;
  }
}

export const dataCache = new DataCache();

const generateCacheKey = (prefix: string, filters: FilterDimensions, dateRange: DateRange): string => {
  const filterKey = [
    filters.users.sort().join(','),
    filters.teams.sort().join(','),
    filters.channels.sort().join(','),
    filters.versions.sort().join(','),
    filters.modules.sort().join(','),
    filters.trafficType,
  ].join('|');
  return `${prefix}:${dateRange.start}:${dateRange.end}:${btoa(filterKey)}`;
};

const calculateMultiplier = (filters: FilterDimensions, dateRange: DateRange): number => {
  let multiplier = 1;

  if (filters.trafficType === 'experiment') {
    multiplier *= 0.65;
  } else if (filters.trafficType === 'organic') {
    multiplier *= 0.85;
  }

  const activeFilters = [
    filters.users.length,
    filters.teams.length,
    filters.channels.length,
    filters.versions.length,
    filters.modules.length,
  ].filter(n => n > 0).length;

  if (activeFilters > 0) {
    multiplier *= Math.pow(0.7, activeFilters);
  }

  const days = differenceInDays(parseISO(dateRange.end), parseISO(dateRange.start));
  const dayMultiplier = Math.max(0.3, Math.min(2, days / 30));
  multiplier *= dayMultiplier;

  return multiplier;
};

export const etlEngine = {
  status: {
    lastUpdated: format(new Date(Date.now() - 30 * 60 * 1000), 'yyyy-MM-dd HH:mm:ss'),
    status: 'success' as const,
    nextRun: format(new Date(Date.now() + 60 * 60 * 1000), 'yyyy-MM-dd HH:mm:ss'),
    recordsProcessed: 2456789,
  } as ETLStatus,

  async runETL(): Promise<ETLStatus> {
    await new Promise(resolve => setTimeout(resolve, 3000));
    const now = new Date();
    this.status = {
      lastUpdated: format(now, 'yyyy-MM-dd HH:mm:ss'),
      status: 'success',
      nextRun: format(new Date(now.getTime() + 60 * 60 * 1000), 'yyyy-MM-dd HH:mm:ss'),
      recordsProcessed: Math.floor(2000000 + Math.random() * 1000000),
    };
    dataCache.invalidate();
    return this.status;
  },

  getStatus(): ETLStatus {
    return { ...this.status };
  },
};

export const apiService = {
  async fetchFunnelData(filters: FilterDimensions, dateRange: DateRange): Promise<FunnelData> {
    const cacheKey = generateCacheKey('funnel', filters, dateRange);
    const cached = dataCache.get<FunnelData>(cacheKey);
    if (cached) return cached;

    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));

    const multiplier = calculateMultiplier(filters, dateRange);
    const channelAdjust = filters.channels.length > 0 ? 0.5 : 1;
    const teamAdjust = filters.teams.length > 0 ? 0.4 : 1;
    const versionAdjust = filters.versions.length > 0 ? 0.6 : 1;
    const userAdjust = filters.users.length > 0 ? 0.3 : 1;

    const baseMultiplier = multiplier * channelAdjust * teamAdjust * versionAdjust * userAdjust;

    const steps = [
      { id: 'register', name: '用户注册', count: Math.round(10000 * baseMultiplier) },
      { id: 'activate', name: '账号激活', count: Math.round(7500 * baseMultiplier * (0.9 + Math.random() * 0.1)) },
      { id: 'invite', name: '邀请成员', count: Math.round(4200 * baseMultiplier * (0.85 + Math.random() * 0.15)) },
      { id: 'first_use', name: '首次使用核心功能', count: Math.round(3100 * baseMultiplier * (0.8 + Math.random() * 0.2)) },
      { id: 'first_pay', name: '首次付费', count: Math.round(1240 * baseMultiplier * (0.75 + Math.random() * 0.25)) },
      { id: 'renew', name: '续费/升级', count: Math.round(868 * baseMultiplier * (0.7 + Math.random() * 0.3)) },
    ];

    const result: FunnelData = {
      steps: steps.map((step, index) => ({
        ...step,
        conversionRate: index === 0 ? 100 : Math.round((step.count / steps[0].count) * 10000) / 100,
        dropOffRate: index === 0 ? 0 : Math.round((1 - step.count / steps[index - 1].count) * 10000) / 100,
      })),
      totalUsers: steps[0].count,
      overallConversion: Math.round((steps[steps.length - 1].count / steps[0].count) * 10000) / 100,
    };

    dataCache.set(cacheKey, result);
    return result;
  },

  async fetchCohortData(filters: FilterDimensions, dateRange: DateRange): Promise<CohortData> {
    const cacheKey = generateCacheKey('cohort', filters, dateRange);
    const cached = dataCache.get<CohortData>(cacheKey);
    if (cached) return cached;

    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400));

    const multiplier = calculateMultiplier(filters, dateRange);
    const startDate = parseISO(dateRange.start);
    const weeks = eachWeekOfInterval({
      start: subWeeks(startDate, 7),
      end: parseISO(dateRange.end),
    }, { weekStartsOn: 1 }).slice(0, 8);

    const versionBoost = filters.versions.includes('v2.1.0') ? 1.15 : 1;
    const channelBoost = filters.channels.includes('推荐邀请') ? 1.1 : 1;

    const result: CohortData = weeks.map((week, i) => {
      const baseSize = Math.round((1000 + Math.random() * 500) * multiplier);
      const decay = (0.85 + Math.random() * 0.1) * versionBoost * channelBoost;
      const weekLabel = format(week, "'W'ww", { locale: zhCN });
      const yearLabel = format(week, 'yyyy');
      return {
        cohort: `${yearLabel}-${weekLabel}`,
        cohortSize: baseSize,
        week0: 100,
        week1: i < 7 ? Math.max(0, Math.round(75 * Math.pow(decay, 0) + Math.random() * 10 - 5)) : (null as any),
        week2: i < 6 ? Math.max(0, Math.round(62 * Math.pow(decay, 1) + Math.random() * 8 - 4)) : (null as any),
        week3: i < 5 ? Math.max(0, Math.round(54 * Math.pow(decay, 2) + Math.random() * 6 - 3)) : (null as any),
        week4: i < 4 ? Math.max(0, Math.round(48 * Math.pow(decay, 3) + Math.random() * 5 - 2)) : (null as any),
        week5: i < 3 ? Math.max(0, Math.round(42 * Math.pow(decay, 4) + Math.random() * 4 - 2)) : (null as any),
        week6: i < 2 ? Math.max(0, Math.round(38 * Math.pow(decay, 5) + Math.random() * 3 - 1)) : (null as any),
        week7: i < 1 ? Math.max(0, Math.round(35 * Math.pow(decay, 6) + Math.random() * 3 - 1)) : (null as any),
      };
    });

    dataCache.set(cacheKey, result);
    return result;
  },

  async fetchFeatureUsage(filters: FilterDimensions, dateRange: DateRange): Promise<FeatureUsage[]> {
    const cacheKey = generateCacheKey('features', filters, dateRange);
    const cached = dataCache.get<FeatureUsage[]>(cacheKey);
    if (cached) return cached;

    await new Promise(resolve => setTimeout(resolve, 250 + Math.random() * 350));

    const multiplier = calculateMultiplier(filters, dateRange);
    const moduleFilter = filters.modules.length > 0 ? filters.modules : null;

    const allFeatures = [
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

    const filteredFeatures = moduleFilter
      ? allFeatures.filter(f => moduleFilter.includes(f.module))
      : allFeatures;

    const teamModuleBoost: Record<string, number> = {};
    filters.teams.forEach(team => {
      if (team === '产品团队') teamModuleBoost['项目管理'] = 1.3;
      if (team === '研发团队') teamModuleBoost['集成中心'] = 1.4;
      if (team === '市场团队') teamModuleBoost['数据分析'] = 1.3;
      if (team === '销售团队') teamModuleBoost['团队协作'] = 1.2;
    });

    const result: FeatureUsage[] = filteredFeatures.map(f => {
      const moduleBoost = (teamModuleBoost[f.module] || 1);
      const versionBoost = filters.versions.includes('v2.1.0') && f.id === 'dashboard' ? 1.5 : 1;
      const baseUsers = Math.round((500 + Math.random() * 2500) * multiplier * moduleBoost * versionBoost);
      
      return {
        ...f,
        users: baseUsers,
        sessions: Math.round((2000 + Math.random() * 15000) * multiplier * moduleBoost),
        avgDuration: Math.round(60 + Math.random() * 300),
        adoptionRate: Math.round((20 + Math.random() * 60) * 100) / 100,
        trend: Math.round((-10 + Math.random() * 30) * 100) / 100,
      };
    }).sort((a, b) => b.users - a.users);

    dataCache.set(cacheKey, result);
    return result;
  },

  async fetchPathData(filters: FilterDimensions, dateRange: DateRange): Promise<PathData> {
    const cacheKey = generateCacheKey('paths', filters, dateRange);
    const cached = dataCache.get<PathData>(cacheKey);
    if (cached) return cached;

    await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 500));

    const multiplier = calculateMultiplier(filters, dateRange);
    const entryCount = Math.round(10000 * multiplier);

    const teamPathAdjust: Record<string, number> = {};
    filters.teams.forEach(team => {
      if (team === '产品团队') teamPathAdjust['projects'] = 1.5;
      if (team === '研发团队') teamPathAdjust['integrations'] = 1.6;
      if (team === '市场团队') teamPathAdjust['reports'] = 1.4;
    });

    const baseNodes = [
      { id: 'entry', name: '进入产品', value: entryCount, category: 'entry' as const },
      { id: 'dashboard', name: '查看仪表盘', value: Math.round(6500 * multiplier * (teamPathAdjust['dashboard'] || 1)), category: 'feature' as const },
      { id: 'projects', name: '项目列表', value: Math.round(5200 * multiplier * (teamPathAdjust['projects'] || 1)), category: 'feature' as const },
      { id: 'team', name: '团队管理', value: Math.round(3800 * multiplier), category: 'feature' as const },
      { id: 'reports', name: '报表中心', value: Math.round(3100 * multiplier * (teamPathAdjust['reports'] || 1)), category: 'feature' as const },
      { id: 'settings', name: '设置', value: Math.round(2200 * multiplier), category: 'feature' as const },
      { id: 'files', name: '文件管理', value: Math.round(1900 * multiplier), category: 'feature' as const },
      { id: 'integrations', name: '集成中心', value: Math.round(1200 * multiplier * (teamPathAdjust['integrations'] || 1)), category: 'feature' as const },
      { id: 'billing', name: '账单管理', value: Math.round(950 * multiplier), category: 'feature' as const },
      { id: 'exit', name: '退出产品', value: Math.round(4500 * multiplier), category: 'exit' as const },
    ];

    const baseLinks = [
      { source: 'entry', target: 'dashboard', value: Math.round(4200 * multiplier) },
      { source: 'entry', target: 'projects', value: Math.round(3500 * multiplier) },
      { source: 'entry', target: 'team', value: Math.round(1500 * multiplier) },
      { source: 'entry', target: 'exit', value: Math.round(800 * multiplier) },
      { source: 'dashboard', target: 'projects', value: Math.round(1800 * multiplier) },
      { source: 'dashboard', target: 'reports', value: Math.round(1500 * multiplier) },
      { source: 'dashboard', target: 'exit', value: Math.round(1000 * multiplier) },
      { source: 'projects', target: 'team', value: Math.round(1200 * multiplier) },
      { source: 'projects', target: 'files', value: Math.round(1000 * multiplier) },
      { source: 'projects', target: 'exit', value: Math.round(1200 * multiplier) },
      { source: 'team', target: 'settings', value: Math.round(800 * multiplier) },
      { source: 'team', target: 'billing', value: Math.round(600 * multiplier) },
      { source: 'team', target: 'exit', value: Math.round(1200 * multiplier) },
      { source: 'reports', target: 'dashboard', value: Math.round(500 * multiplier) },
      { source: 'reports', target: 'exit', value: Math.round(1100 * multiplier) },
      { source: 'settings', target: 'integrations', value: Math.round(700 * multiplier) },
      { source: 'settings', target: 'exit', value: Math.round(700 * multiplier) },
      { source: 'files', target: 'exit', value: Math.round(900 * multiplier) },
      { source: 'integrations', target: 'exit', value: Math.round(500 * multiplier) },
      { source: 'billing', target: 'exit', value: Math.round(350 * multiplier) },
    ];

    const result: PathData = {
      nodes: baseNodes,
      links: baseLinks,
    };

    dataCache.set(cacheKey, result);
    return result;
  },

  async fetchChurnReasons(filters: FilterDimensions, dateRange: DateRange): Promise<ChurnReason[]> {
    const cacheKey = generateCacheKey('churn', filters, dateRange);
    const cached = dataCache.get<ChurnReason[]>(cacheKey);
    if (cached) return cached;

    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 200));

    const multiplier = calculateMultiplier(filters, dateRange);

    const reasonWeights: Record<string, number> = {};
    if (filters.versions.includes('v2.0.0')) {
      reasonWeights['使用体验不佳'] = 1.5;
    }
    if (filters.trafficType === 'experiment') {
      reasonWeights['转向竞品'] = 0.7;
    }
    if (filters.teams.includes('客户成功')) {
      reasonWeights['客户支持响应慢'] = 0.5;
    }

    const reasons = [
      { id: '1', reason: '产品功能不满足需求', baseCount: Math.round(245 * multiplier), weight: reasonWeights['产品功能不满足需求'] || 1 },
      { id: '2', reason: '价格过高', baseCount: Math.round(198 * multiplier), weight: reasonWeights['价格过高'] || 1 },
      { id: '3', reason: '转向竞品', baseCount: Math.round(156 * multiplier), weight: reasonWeights['转向竞品'] || 1 },
      { id: '4', reason: '团队规模缩减', baseCount: Math.round(124 * multiplier), weight: reasonWeights['团队规模缩减'] || 1 },
      { id: '5', reason: '使用体验不佳', baseCount: Math.round(98 * multiplier), weight: reasonWeights['使用体验不佳'] || 1 },
      { id: '6', reason: '客户支持响应慢', baseCount: Math.round(76 * multiplier), weight: reasonWeights['客户支持响应慢'] || 1 },
      { id: '7', reason: '其他原因', baseCount: Math.round(103 * multiplier), weight: 1 },
    ];

    const adjusted = reasons.map(r => ({
      ...r,
      count: Math.max(1, Math.round(r.baseCount * r.weight)),
    }));

    const total = adjusted.reduce((sum, r) => sum + r.count, 0);
    const result: ChurnReason[] = adjusted
      .map(r => ({
        id: r.id,
        reason: r.reason,
        count: r.count,
        percentage: Math.round((r.count / total) * 10000) / 100,
      }))
      .sort((a, b) => b.count - a.count);

    dataCache.set(cacheKey, result);
    return result;
  },

  async fetchAllData(filters: FilterDimensions, dateRange: DateRange) {
    const [funnel, cohort, features, paths, churn] = await Promise.all([
      this.fetchFunnelData(filters, dateRange),
      this.fetchCohortData(filters, dateRange),
      this.fetchFeatureUsage(filters, dateRange),
      this.fetchPathData(filters, dateRange),
      this.fetchChurnReasons(filters, dateRange),
    ]);
    return { funnel, cohort, features, paths, churn };
  },
};

export const exportService = {
  tasks: [] as ExportTask[],

  async createExport(
    filters: FilterDimensions,
    dateRange: DateRange,
    format: 'csv' | 'xlsx' | 'pdf',
    viewType: string
  ): Promise<ExportTask> {
    const task: ExportTask = {
      id: `export_${Date.now()}`,
      name: `${viewType}_${dateRange.start}_${dateRange.end}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    this.tasks.unshift(task);

    setTimeout(async () => {
      task.status = 'processing';
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1500));

      const data = await apiService.fetchAllData(filters, dateRange);
      let content: string;
      let mimeType: string;
      let filename: string;
      let blob: Blob;

      if (format === 'csv') {
        content = this.generateCSV(viewType, data);
        mimeType = 'text/csv;charset=utf-8';
        filename = `${task.name}.csv`;
        blob = new Blob(['\ufeff' + content], { type: mimeType });
      } else if (format === 'xlsx') {
        content = this.generateExcelXML(viewType, data);
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename = `${task.name}.xlsx`;
        blob = new Blob([content], { type: mimeType });
      } else {
        content = this.generatePDFContent(viewType, data, filters, dateRange);
        mimeType = 'text/html';
        filename = `${task.name}.html`;
        blob = new Blob([content], { type: mimeType });
      }

      const url = URL.createObjectURL(blob);
      task.status = 'completed';
      task.completedAt = new Date().toISOString();
      task.downloadUrl = url;

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => URL.revokeObjectURL(url), 60000);
    }, 100);

    return task;
  },

  generateCSV(viewType: string, data: any): string {
    const rows: string[][] = [];
    rows.push(['SaaS 留存分析看板 - 数据导出']);
    rows.push(['导出时间', new Date().toLocaleString('zh-CN')]);
    rows.push([]);

    if (viewType === 'funnel' || viewType === 'all') {
      rows.push(['=== 转化漏斗数据 ===']);
      rows.push(['步骤', '用户数', '转化率(%)', '流失率(%)']);
      data.funnel.steps.forEach((step: any) => {
        rows.push([step.name, step.count.toString(), step.conversionRate.toString(), step.dropOffRate.toString()]);
      });
      rows.push([]);
      rows.push(['总用户数', data.funnel.totalUsers.toString()]);
      rows.push(['整体转化率(%)', data.funnel.overallConversion.toString()]);
      rows.push([]);
    }

    if (viewType === 'cohort' || viewType === 'all') {
      rows.push(['=== Cohort 留存数据 ===']);
      rows.push(['Cohort', '用户数', 'W0', 'W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7']);
      data.cohort.forEach((row: any) => {
        rows.push([
          row.cohort,
          row.cohortSize.toString(),
          row.week0?.toString() || '-',
          row.week1?.toString() || '-',
          row.week2?.toString() || '-',
          row.week3?.toString() || '-',
          row.week4?.toString() || '-',
          row.week5?.toString() || '-',
          row.week6?.toString() || '-',
          row.week7?.toString() || '-',
        ]);
      });
      rows.push([]);
    }

    if (viewType === 'features' || viewType === 'all') {
      rows.push(['=== 功能热度数据 ===']);
      rows.push(['功能名称', '模块', '使用用户数', '会话数', '平均使用时长(秒)', '渗透率(%)', '变化趋势(%)']);
      data.features.forEach((f: any) => {
        rows.push([
          f.name,
          f.module,
          f.users.toString(),
          f.sessions.toString(),
          f.avgDuration.toString(),
          f.adoptionRate.toString(),
          f.trend.toString(),
        ]);
      });
      rows.push([]);
    }

    if (viewType === 'paths' || viewType === 'all') {
      rows.push(['=== 用户路径数据 ===']);
      rows.push(['节点ID', '节点名称', '用户数', '分类']);
      data.paths.nodes.forEach((node: any) => {
        rows.push([node.id, node.name, node.value.toString(), node.category]);
      });
      rows.push([]);
      rows.push(['源节点', '目标节点', '流量']);
      data.paths.links.forEach((link: any) => {
        rows.push([link.source, link.target, link.value.toString()]);
      });
      rows.push([]);
    }

    rows.push(['=== 流失原因数据 ===']);
    rows.push(['原因', '数量', '占比(%)']);
    data.churn.forEach((reason: any) => {
      rows.push([reason.reason, reason.count.toString(), reason.percentage.toString()]);
    });

    return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  },

  generateExcelXML(viewType: string, data: any): string {
    let sheets = '';
    
    const addSheet = (name: string, content: string) => {
      sheets += `<Worksheet ss:Name="${name}"><Table>${content}</Table></Worksheet>`;
    };

    if (viewType === 'funnel' || viewType === 'all') {
      let rows = `<Row><Cell ss:StyleID="s62"><Data ss:Type="String">转化漏斗分析</Data></Cell></Row>`;
      rows += `<Row><Cell><Data ss:Type="String">步骤</Data></Cell><Cell><Data ss:Type="String">用户数</Data></Cell><Cell><Data ss:Type="String">转化率(%)</Data></Cell><Cell><Data ss:Type="String">流失率(%)</Data></Cell></Row>`;
      data.funnel.steps.forEach((step: any) => {
        rows += `<Row><Cell><Data ss:Type="String">${step.name}</Data></Cell><Cell><Data ss:Type="Number">${step.count}</Data></Cell><Cell><Data ss:Type="Number">${step.conversionRate}</Data></Cell><Cell><Data ss:Type="Number">${step.dropOffRate}</Data></Cell></Row>`;
      });
      addSheet('转化漏斗', rows);
    }

    if (viewType === 'cohort' || viewType === 'all') {
      let rows = `<Row><Cell ss:StyleID="s62"><Data ss:Type="String">Cohort 留存分析</Data></Cell></Row>`;
      rows += `<Row><Cell><Data ss:Type="String">Cohort</Data></Cell><Cell><Data ss:Type="String">用户数</Data></Cell><Cell><Data ss:Type="String">W0</Data></Cell><Cell><Data ss:Type="String">W1</Data></Cell><Cell><Data ss:Type="String">W2</Data></Cell><Cell><Data ss:Type="String">W3</Data></Cell><Cell><Data ss:Type="String">W4</Data></Cell><Cell><Data ss:Type="String">W5</Data></Cell><Cell><Data ss:Type="String">W6</Data></Cell><Cell><Data ss:Type="String">W7</Data></Cell></Row>`;
      data.cohort.forEach((row: any) => {
        rows += `<Row><Cell><Data ss:Type="String">${row.cohort}</Data></Cell><Cell><Data ss:Type="Number">${row.cohortSize}</Data></Cell><Cell><Data ss:Type="Number">${row.week0 || ''}</Data></Cell><Cell><Data ss:Type="Number">${row.week1 || ''}</Data></Cell><Cell><Data ss:Type="Number">${row.week2 || ''}</Data></Cell><Cell><Data ss:Type="Number">${row.week3 || ''}</Data></Cell><Cell><Data ss:Type="Number">${row.week4 || ''}</Data></Cell><Cell><Data ss:Type="Number">${row.week5 || ''}</Data></Cell><Cell><Data ss:Type="Number">${row.week6 || ''}</Data></Cell><Cell><Data ss:Type="Number">${row.week7 || ''}</Data></Cell></Row>`;
      });
      addSheet('Cohort留存', rows);
    }

    if (viewType === 'features' || viewType === 'all') {
      let rows = `<Row><Cell ss:StyleID="s62"><Data ss:Type="String">功能热度分析</Data></Cell></Row>`;
      rows += `<Row><Cell><Data ss:Type="String">功能名称</Data></Cell><Cell><Data ss:Type="String">模块</Data></Cell><Cell><Data ss:Type="String">使用用户数</Data></Cell><Cell><Data ss:Type="String">会话数</Data></Cell><Cell><Data ss:Type="String">平均使用时长(秒)</Data></Cell><Cell><Data ss:Type="String">渗透率(%)</Data></Cell><Cell><Data ss:Type="String">变化趋势(%)</Data></Cell></Row>`;
      data.features.forEach((f: any) => {
        rows += `<Row><Cell><Data ss:Type="String">${f.name}</Data></Cell><Cell><Data ss:Type="String">${f.module}</Data></Cell><Cell><Data ss:Type="Number">${f.users}</Data></Cell><Cell><Data ss:Type="Number">${f.sessions}</Data></Cell><Cell><Data ss:Type="Number">${f.avgDuration}</Data></Cell><Cell><Data ss:Type="Number">${f.adoptionRate}</Data></Cell><Cell><Data ss:Type="Number">${f.trend}</Data></Cell></Row>`;
      });
      addSheet('功能热度', rows);
    }

    if (viewType === 'paths' || viewType === 'all') {
      let rows = `<Row><Cell ss:StyleID="s62"><Data ss:Type="String">用户路径分析</Data></Cell></Row>`;
      rows += `<Row><Cell><Data ss:Type="String">节点名称</Data></Cell><Cell><Data ss:Type="String">用户数</Data></Cell></Row>`;
      data.paths.nodes.forEach((node: any) => {
        rows += `<Row><Cell><Data ss:Type="String">${node.name}</Data></Cell><Cell><Data ss:Type="Number">${node.value}</Data></Cell></Row>`;
      });
      addSheet('用户路径', rows);
    }

    let churnRows = `<Row><Cell ss:StyleID="s62"><Data ss:Type="String">流失原因分析</Data></Cell></Row>`;
    churnRows += `<Row><Cell><Data ss:Type="String">原因</Data></Cell><Cell><Data ss:Type="String">数量</Data></Cell><Cell><Data ss:Type="String">占比(%)</Data></Cell></Row>`;
    data.churn.forEach((reason: any) => {
      churnRows += `<Row><Cell><Data ss:Type="String">${reason.reason}</Data></Cell><Cell><Data ss:Type="Number">${reason.count}</Data></Cell><Cell><Data ss:Type="Number">${reason.percentage}</Data></Cell></Row>`;
    });
    addSheet('流失原因', churnRows);

    return `<?xml version="1.0" encoding="UTF-8"?>
      <?mso-application progid="Excel.Sheet"?>
      <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
        xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
        <Styles>
          <Style ss:ID="s62">
            <Font ss:Bold="1" ss:Size="14"/>
          </Style>
        </Styles>
        ${sheets}
      </Workbook>`;
  },

  generatePDFContent(viewType: string, data: any, filters: FilterDimensions, dateRange: DateRange): string {
    const filterSummary = [
      filters.users.length > 0 ? `用户: ${filters.users.join(', ')}` : null,
      filters.teams.length > 0 ? `团队: ${filters.teams.join(', ')}` : null,
      filters.channels.length > 0 ? `渠道: ${filters.channels.join(', ')}` : null,
      filters.versions.length > 0 ? `版本: ${filters.versions.join(', ')}` : null,
      filters.modules.length > 0 ? `模块: ${filters.modules.join(', ')}` : null,
      filters.trafficType !== 'all' ? `流量类型: ${filters.trafficType === 'experiment' ? '实验组' : '自然流量'}` : null,
    ].filter(Boolean).join(' | ');

    let dataHTML = '';

    if (viewType === 'funnel' || viewType === 'all') {
      dataHTML += `
        <h2>转化漏斗分析</h2>
        <table border="1" cellpadding="8" cellspacing="0" style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          <thead><tr style="background:#f0f4f8;"><th>步骤</th><th>用户数</th><th>转化率(%)</th><th>流失率(%)</th></tr></thead>
          <tbody>
            ${data.funnel.steps.map((s: any) => `<tr><td>${s.name}</td><td>${s.count.toLocaleString()}</td><td>${s.conversionRate}%</td><td>${s.dropOffRate}%</td></tr>`).join('')}
          </tbody>
        </table>
        <p><strong>总用户数:</strong> ${data.funnel.totalUsers.toLocaleString()} | <strong>整体转化率:</strong> ${data.funnel.overallConversion}%</p>
      `;
    }

    if (viewType === 'cohort' || viewType === 'all') {
      dataHTML += `
        <h2>Cohort 留存分析</h2>
        <table border="1" cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:12px;">
          <thead><tr style="background:#f0f4f8;"><th>Cohort</th><th>用户数</th><th>W0</th><th>W1</th><th>W2</th><th>W3</th><th>W4</th><th>W5</th><th>W6</th><th>W7</th></tr></thead>
          <tbody>
            ${data.cohort.map((row: any) => `
              <tr>
                <td>${row.cohort}</td><td>${row.cohortSize.toLocaleString()}</td>
                <td>${row.week0 || '-'}%</td><td>${row.week1 || '-'}%</td><td>${row.week2 || '-'}%</td><td>${row.week3 || '-'}%</td>
                <td>${row.week4 || '-'}%</td><td>${row.week5 || '-'}%</td><td>${row.week6 || '-'}%</td><td>${row.week7 || '-'}%</td>
              </tr>`).join('')}
          </tbody>
        </table>
      `;
    }

    if (viewType === 'features' || viewType === 'all') {
      dataHTML += `
        <h2>功能热度分析</h2>
        <table border="1" cellpadding="8" cellspacing="0" style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          <thead><tr style="background:#f0f4f8;"><th>功能名称</th><th>模块</th><th>使用用户数</th><th>会话数</th><th>渗透率(%)</th><th>趋势(%)</th></tr></thead>
          <tbody>
            ${data.features.map((f: any) => `<tr><td>${f.name}</td><td>${f.module}</td><td>${f.users.toLocaleString()}</td><td>${f.sessions.toLocaleString()}</td><td>${f.adoptionRate}%</td><td style="color:${f.trend >= 0 ? 'green' : 'red'}">${f.trend >= 0 ? '+' : ''}${f.trend}%</td></tr>`).join('')}
          </tbody>
        </table>
      `;
    }

    if (viewType === 'paths' || viewType === 'all') {
      dataHTML += `
        <h2>用户路径节点</h2>
        <table border="1" cellpadding="8" cellspacing="0" style="width:60%;border-collapse:collapse;margin-bottom:20px;">
          <thead><tr style="background:#f0f4f8;"><th>节点</th><th>用户数</th><th>分类</th></tr></thead>
          <tbody>
            ${data.paths.nodes.map((n: any) => `<tr><td>${n.name}</td><td>${n.value.toLocaleString()}</td><td>${n.category}</td></tr>`).join('')}
          </tbody>
        </table>
      `;
    }

    dataHTML += `
      <h2>流失原因分析</h2>
      <table border="1" cellpadding="8" cellspacing="0" style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <thead><tr style="background:#f0f4f8;"><th>原因</th><th>数量</th><th>占比(%)</th></tr></thead>
        <tbody>
          ${data.churn.map((r: any) => `<tr><td>${r.reason}</td><td>${r.count}</td><td>${r.percentage}%</td></tr>`).join('')}
        </tbody>
      </table>
    `;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>SaaS 留存分析报告</title>
        <style>
          body { font-family: 'Microsoft YaHei', sans-serif; padding: 40px; color: #333; }
          h1 { color: #0ea5e9; border-bottom: 3px solid #0ea5e9; padding-bottom: 10px; }
          h2 { color: #0369a1; margin-top: 30px; }
          .header-info { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
          .header-info p { margin: 5px 0; }
        </style>
      </head>
      <body>
        <h1>SaaS 留存分析看板 - 数据报告</h1>
        <div class="header-info">
          <p><strong>导出时间:</strong> ${new Date().toLocaleString('zh-CN')}</p>
          <p><strong>日期范围:</strong> ${dateRange.start} ~ ${dateRange.end}</p>
          <p><strong>筛选条件:</strong> ${filterSummary || '无'}</p>
        </div>
        ${dataHTML}
        <hr style="margin-top:40px;border:none;border-top:1px solid #e2e8f0;">
        <p style="color:#94a3b8;font-size:12px;">Generated by SaaS Retention Analytics Platform</p>
      </body>
      </html>
    `;
  },

  getTasks(): ExportTask[] {
    return [...this.tasks];
  },
};
