import {
  RawEvent,
  ETLPipelineStage,
  FilterDimensions,
  DateRange,
  AggregatedResult,
  FunnelData,
  CohortData,
  FeatureUsage,
  PathData,
  ChurnReason,
} from '../types';
import { eventRepository } from './eventRepository';
import { parseISO, eachWeekOfInterval, getWeek, getYear } from 'date-fns';

export type ETLProgressCallback = (stage: string, progress: number, message: string) => void;

export type CleanStats = {
  totalInput: number;
  duplicatesRemoved: number;
  missingValuesFixed: number;
  outliersRemoved: number;
  invalidEventsDropped: number;
  totalOutput: number;
};

const VALID_EVENT_TYPES = [
  'register',
  'activate',
  'invite',
  'first_feature_use',
  'first_pay',
  'feature_use',
  'churn',
  'session',
] as const;

const VALID_CHANNELS = [
  '自然搜索',
  '付费广告',
  '社交媒体',
  '邮件营销',
  '直接访问',
  '推荐邀请',
];

export class ETLEngine {
  private stats: CleanStats = {
    totalInput: 0,
    duplicatesRemoved: 0,
    missingValuesFixed: 0,
    outliersRemoved: 0,
    invalidEventsDropped: 0,
    totalOutput: 0,
  };

  private stages: ETLPipelineStage[] = [];

  reset() {
    this.stats = {
      totalInput: 0,
      duplicatesRemoved: 0,
      missingValuesFixed: 0,
      outliersRemoved: 0,
      invalidEventsDropped: 0,
      totalOutput: 0,
    };
    this.stages = [];
  }

  getStats(): CleanStats {
    return { ...this.stats };
  }

  getStages(): ETLPipelineStage[] {
    return [...this.stages];
  }

  private addStage(name: string, status: ETLPipelineStage['status'], recordsIn: number, recordsOut: number, error?: string) {
    const now = new Date().toISOString();
    this.stages.push({
      name,
      status,
      recordsIn,
      recordsOut,
      startedAt: status !== 'pending' ? now : undefined,
      completedAt: status === 'completed' || status === 'failed' ? now : undefined,
      error,
    });
  }

  async extract(
    _source: string,
    _filters: FilterDimensions,
    dateRange: DateRange,
    count = 5000
  ): Promise<RawEvent[]> {
    this.addStage('extract', 'running', 0, 0);

    const events = await eventRepository.generateEvents(dateRange, count, { includeDirtyData: true });

    this.stats.totalInput = events.length;
    this.addStage('extract', 'completed', events.length, events.length);

    return events;
  }

  async clean(events: RawEvent[]): Promise<{ events: RawEvent[]; stats: CleanStats }> {
    this.addStage('clean', 'running', events.length, 0);
    let cleaned = [...events];

    const beforeCount = cleaned.length;
    const seen = new Set<string>();
    cleaned = cleaned.filter(event => {
      const key = `${event.userId || ''}_${event.eventType}_${event.timestamp}_${event.channel}`;
      if (seen.has(key)) {
        this.stats.duplicatesRemoved++;
        return false;
      }
      seen.add(key);
      return true;
    });
    console.log(`[ETL Clean] 去重: ${beforeCount} → ${cleaned.length} (移除 ${this.stats.duplicatesRemoved} 条)`);

    cleaned = cleaned.map(event => {
      let modified = false;

      if (!event.userId) {
        event.userId = `anon_${Math.random().toString(36).substr(2, 9)}`;
        modified = true;
      }
      if (!event.teamId) {
        event.teamId = `default_team`;
        modified = true;
      }
      if (!VALID_CHANNELS.includes(event.channel)) {
        event.channel = '直接访问';
        modified = true;
      }
      if (!event.version) {
        event.version = 'unknown';
        modified = true;
      }
      if (!event.timestamp || isNaN(parseISO(event.timestamp).getTime())) {
        event.timestamp = new Date().toISOString();
        modified = true;
      }
      if (event.eventType === 'session' && (event.sessionDuration === undefined || event.sessionDuration < 0)) {
        event.sessionDuration = 0;
        modified = true;
      }

      if (modified) this.stats.missingValuesFixed++;
      return event;
    });

    const beforeValid = cleaned.length;
    cleaned = cleaned.filter(event => {
      if (!VALID_EVENT_TYPES.includes(event.eventType)) {
        this.stats.invalidEventsDropped++;
        return false;
      }
      if (event.sessionDuration !== undefined && event.sessionDuration > 86400) {
        this.stats.outliersRemoved++;
        return false;
      }
      return true;
    });
    console.log(`[ETL Clean] 有效性过滤: ${beforeValid} → ${cleaned.length} (丢弃 ${this.stats.invalidEventsDropped} 无效, ${this.stats.outliersRemoved} 异常)`);

    this.stats.totalOutput = cleaned.length;
    this.addStage('clean', 'completed', events.length, cleaned.length);

    return { events: cleaned, stats: { ...this.stats } };
  }

  async transform(
    events: RawEvent[],
    filters: FilterDimensions,
    dateRange: DateRange
  ): Promise<AggregatedResult> {
    this.addStage('transform', 'running', events.length, 0);

    let filtered = [...events];

    if (filters.users.length > 0) {
      filtered = filtered.filter(e => filters.users.includes(e.userId));
    }
    if (filters.teams.length > 0) {
      filtered = filtered.filter(e => filters.teams.includes(e.teamId));
    }
    if (filters.channels.length > 0) {
      filtered = filtered.filter(e => filters.channels.includes(e.channel));
    }
    if (filters.versions.length > 0) {
      filtered = filtered.filter(e => filters.versions.includes(e.version));
    }
    if (filters.modules.length > 0) {
      filtered = filtered.filter(e => !e.module || filters.modules.includes(e.module));
    }
    if (filters.trafficType !== 'all') {
      filtered = filtered.filter(e => e.trafficType === filters.trafficType);
    }

    const funnel = this.buildFunnel(filtered);
    const cohort = this.buildCohort(filtered, dateRange);
    const features = this.buildFeatureUsage(filtered);
    const paths = this.buildPathAnalysis(filtered);
    const churn = this.buildChurnReasons(filtered);

    const users = new Set(filtered.map(e => e.userId));
    const sessions = filtered.filter(e => e.eventType === 'session');
    const totalSessionDuration = sessions.reduce((sum, s) => sum + (s.sessionDuration || 0), 0);

    const result: AggregatedResult = {
      queryId: `qry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      generatedAt: new Date().toISOString(),
      filters,
      dateRange,
      totalUsers: users.size,
      funnel,
      cohort,
      features,
      paths,
      churn,
      summary: {
        activationRate: funnel.steps.length > 1 ? Number(((funnel.steps[1].count / funnel.steps[0].count) * 100).toFixed(1)) : 0,
        payConversionRate: funnel.steps.length > 4 ? Number(((funnel.steps[4].count / funnel.steps[3].count) * 100).toFixed(1)) : 0,
        avgRetention7d: this.calculateAvgRetention7d(cohort),
        totalSessions: sessions.length,
        avgSessionDuration: sessions.length > 0 ? totalSessionDuration / sessions.length : 0,
      },
    };

    this.addStage('transform', 'completed', events.length, 1);
    return result;
  }

  private buildFunnel(events: RawEvent[]): FunnelData {
    const steps = [
      { id: 'register', name: '用户注册', eventType: 'register' as const },
      { id: 'activate', name: '账号激活', eventType: 'activate' as const },
      { id: 'invite', name: '邀请成员', eventType: 'invite' as const },
      { id: 'first_use', name: '首次使用核心功能', eventType: 'first_feature_use' as const },
      { id: 'first_pay', name: '首次付费', eventType: 'first_pay' as const },
    ];

    const funnelSteps = steps.map((step, idx) => {
      const count = events.filter(e => e.eventType === step.eventType).length;
      const prevCount = idx > 0 ? events.filter(e => e.eventType === steps[idx - 1].eventType).length : count;
      return {
        id: step.id,
        name: step.name,
        count,
        conversionRate: idx === 0 ? 100 : Number(((count / prevCount) * 100).toFixed(1)),
        dropOffRate: idx === 0 ? 0 : Number((100 - (count / prevCount) * 100).toFixed(1)),
      };
    });

    return {
      steps: funnelSteps,
      totalUsers: funnelSteps[0]?.count || 0,
      overallConversion: funnelSteps.length > 0 ? Number(((funnelSteps[funnelSteps.length - 1].count / funnelSteps[0].count) * 100).toFixed(2)) : 0,
    };
  }

  private buildCohort(events: RawEvent[], dateRange: DateRange): CohortData {
    const registerEvents = events.filter(e => e.eventType === 'register');
    const startDate = parseISO(dateRange.start);
    const endDate = parseISO(dateRange.end);

    const weeks = eachWeekOfInterval({ start: startDate, end: endDate });
    const cohortLabels = weeks.map(w => `${getYear(w)}W${String(getWeek(w)).padStart(2, '0')}`);

    const cohortUserMap = new Map<string, Set<string>>();
    registerEvents.forEach(e => {
      const weekStart = parseISO(e.timestamp);
      const cohort = `${getYear(weekStart)}W${String(getWeek(weekStart)).padStart(2, '0')}`;
      if (!cohortUserMap.has(cohort)) cohortUserMap.set(cohort, new Set());
      cohortUserMap.get(cohort)!.add(e.userId);
    });

    const activityByWeek = new Map<string, Set<string>>();
    events.filter(e => e.eventType !== 'register').forEach(e => {
      const weekStart = parseISO(e.timestamp);
      const week = `${getYear(weekStart)}W${String(getWeek(weekStart)).padStart(2, '0')}`;
      if (!activityByWeek.has(week)) activityByWeek.set(week, new Set());
      activityByWeek.get(week)!.add(e.userId);
    });

    const cohortData = cohortLabels.slice(0, 8).map((cohort, cohortIdx) => {
      const cohortUsers = cohortUserMap.get(cohort) || new Set();
      const size = cohortUsers.size;
      const weekData: any = { cohort, cohortSize: size, week0: 100 };

      for (let w = 1; w < 8; w++) {
        if (cohortIdx + w >= cohortLabels.length) {
          weekData[`week${w}`] = null;
        } else {
          const activityWeek = cohortLabels[cohortIdx + w];
          const activeUsers = activityByWeek.get(activityWeek) || new Set();
          const retained = [...cohortUsers].filter(u => activeUsers.has(u));
          weekData[`week${w}`] = size > 0 ? Math.round((retained.length / size) * 100) : 0;
        }
      }
      return weekData;
    });

    return cohortData;
  }

  private buildFeatureUsage(events: RawEvent[]): FeatureUsage[] {
    const featureEvents = events.filter(e => e.eventType === 'feature_use' && e.module && e.feature);
    const totalUsers = new Set(events.map(e => e.userId)).size;

    const featureMap = new Map<string, { users: Set<string>; sessions: number; totalDuration: number }>();

    featureEvents.forEach(e => {
      const key = `${e.module}:${e.feature}`;
      if (!featureMap.has(key)) {
        featureMap.set(key, { users: new Set(), sessions: 0, totalDuration: 0 });
      }
      const data = featureMap.get(key)!;
      data.users.add(e.userId);
      data.sessions++;
      data.totalDuration += e.sessionDuration || 60;
    });

    const features: FeatureUsage[] = [];
    featureMap.forEach((data, key) => {
      const [module, name] = key.split(':');
      features.push({
        id: key,
        name,
        module,
        users: data.users.size,
        sessions: data.sessions,
        avgDuration: data.sessions > 0 ? Math.round(data.totalDuration / data.sessions) : 0,
        adoptionRate: totalUsers > 0 ? Number(((data.users.size / totalUsers) * 100).toFixed(1)) : 0,
        trend: Number((Math.random() * 40 - 20).toFixed(1)),
      });
    });

    return features.sort((a, b) => b.users - a.users).slice(0, 20);
  }

  private buildPathAnalysis(events: RawEvent[]): PathData {
    const userSessions = new Map<string, RawEvent[]>();
    events.filter(e => e.eventType === 'feature_use' && e.feature).forEach(e => {
      if (!userSessions.has(e.userId)) userSessions.set(e.userId, []);
      userSessions.get(e.userId)!.push(e);
    });

    userSessions.forEach(session => {
      session.sort((a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime());
    });

    const nodeMap = new Map<string, number>();
    const linkMap = new Map<string, number>();

    nodeMap.set('entry:入口', 0);
    nodeMap.set('exit:离开', 0);

    userSessions.forEach(session => {
      const features = session.map(e => `${e.module}:${e.feature}`).slice(0, 10);
      if (features.length === 0) return;

      nodeMap.set('entry:入口', (nodeMap.get('entry:入口') || 0) + 1);
      this.incrementNode(nodeMap, features[0]);
      this.incrementLink(linkMap, 'entry:入口', features[0]);

      for (let i = 0; i < features.length - 1; i++) {
        this.incrementLink(linkMap, features[i], features[i + 1]);
      }

      this.incrementNode(nodeMap, 'exit:离开');
      this.incrementLink(linkMap, features[features.length - 1], 'exit:离开');
    });

    const nodes = [...nodeMap.entries()].slice(0, 15).map(([id, value]) => {
      const [category, name] = id.split(':');
      return {
        id,
        name,
        value,
        category: (category === 'entry' || category === 'exit' ? category : 'feature') as 'entry' | 'feature' | 'exit',
      };
    });

    const nodeIds = new Set(nodes.map(n => n.id));
    const links = [...linkMap.entries()]
      .filter(([key]) => {
        const [source, target] = key.split('|');
        return nodeIds.has(source) && nodeIds.has(target);
      })
      .map(([key, value]) => {
        const [source, target] = key.split('|');
        return { source, target, value };
      })
      .slice(0, 25);

    return { nodes, links };
  }

  private incrementNode(map: Map<string, number>, id: string) {
    map.set(id, (map.get(id) || 0) + 1);
  }

  private incrementLink(map: Map<string, number>, source: string, target: string) {
    const key = `${source}|${target}`;
    map.set(key, (map.get(key) || 0) + 1);
  }

  private buildChurnReasons(events: RawEvent[]): ChurnReason[] {
    const churnEvents = events.filter(e => e.eventType === 'churn' && e.churnReason);
    const reasonMap = new Map<string, number>();

    churnEvents.forEach(e => {
      reasonMap.set(e.churnReason!, (reasonMap.get(e.churnReason!) || 0) + 1);
    });

    const total = churnEvents.length;
    const reasons: ChurnReason[] = [];
    reasonMap.forEach((count, reason) => {
      reasons.push({
        id: `churn_${reason}`,
        reason,
        count,
        percentage: total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0,
      });
    });

    return reasons.sort((a, b) => b.count - a.count);
  }

  private calculateAvgRetention7d(cohort: CohortData): number {
    const values = cohort
      .map(row => row.week1)
      .filter((v): v is number => v !== null);
    return values.length > 0 ? Number((values.reduce((s, v) => s + v, 0) / values.length).toFixed(1)) : 0;
  }

  async runFullPipeline(
    filters: FilterDimensions,
    dateRange: DateRange,
    onProgress?: ETLProgressCallback
  ): Promise<{ result: AggregatedResult; stages: ETLPipelineStage[]; stats: CleanStats }> {
    this.reset();

    try {
      onProgress?.('extract', 0, '正在抽取原始事件...');
      const rawEvents = await this.extract('events_db', filters, dateRange, 8000);
      onProgress?.('extract', 25, `抽取完成: ${rawEvents.length} 条原始事件`);

      onProgress?.('clean', 25, '正在清洗数据...');
      const { events: cleaned } = await this.clean(rawEvents);
      onProgress?.('clean', 60, `清洗完成: ${cleaned.length} 条有效事件`);

      onProgress?.('transform', 60, '正在聚合分析...');
      const result = await this.transform(cleaned, filters, dateRange);
      onProgress?.('transform', 95, '聚合完成，生成数据模型');

      this.addStage('load', 'running', 1, 1);
      this.addStage('load', 'completed', 1, 1);
      onProgress?.('load', 100, '数据加载完成');

      return {
        result,
        stages: this.getStages(),
        stats: this.getStats(),
      };
    } catch (error: any) {
      this.addStage('transform', 'failed', 0, 0, error.message);
      throw error;
    }
  }
}

export const etlEngine = new ETLEngine();
