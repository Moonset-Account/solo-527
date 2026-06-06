import { RawEvent, FilterDimensions, DateRange } from '../types';
import { parseISO } from 'date-fns';

const CHANNELS = ['自然搜索', '付费广告', '社交媒体', '邮件营销', '直接访问', '推荐邀请'];
const VERSIONS = ['v2.1.0', 'v2.0.5', 'v2.0.0', 'v1.9.2'];
const MODULES = ['项目管理', '数据分析', '团队协作', '文件存储', '集成中心', '设置'];
const FEATURES: Record<string, string[]> = {
  '项目管理': ['看板视图', '甘特图', '任务列表', '里程碑', '任务依赖'],
  '数据分析': ['数据仪表盘', '自定义报表', '漏斗分析', 'Cohort分析', '路径分析'],
  '团队协作': ['实时聊天', '视频会议', '评论', '@提醒', '共享文档'],
  '文件存储': ['上传下载', '版本管理', '在线预览', '文件分享', '回收站'],
  '集成中心': ['API接入', 'Webhook', '第三方应用', '单点登录'],
  '设置': ['个人设置', '团队设置', '安全设置', '通知设置'],
};
const CHURN_REASONS = ['价格过高', '功能不足', '易用性差', '客服响应慢', '竞品替代', '团队解散'];

const EVENT_TYPE_WEIGHTS: Record<RawEvent['eventType'], number> = {
  register: 15,
  activate: 12,
  invite: 5,
  first_feature_use: 10,
  first_pay: 3,
  feature_use: 40,
  churn: 5,
  session: 10,
};

export type EventQueryParams = {
  filters?: FilterDimensions;
  dateRange?: DateRange;
  eventTypes?: RawEvent['eventType'][];
  limit?: number;
  offset?: number;
  userId?: string;
  teamId?: string;
};

class EventRepository {
  private cache: Map<string, RawEvent[]> = new Map();
  private cacheTTL = 10 * 60 * 1000;

  async generateEvents(
    dateRange: DateRange,
    count: number,
    options?: { includeDirtyData?: boolean }
  ): Promise<RawEvent[]> {
    const cacheKey = `events_${dateRange.start}_${dateRange.end}_${count}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      return [...cached];
    }

    const events: RawEvent[] = [];
    const startDate = parseISO(dateRange.start);
    const endDate = parseISO(dateRange.end);
    const dateSpan = endDate.getTime() - startDate.getTime();
    const totalWeight = Object.values(EVENT_TYPE_WEIGHTS).reduce((s, w) => s + w, 0);

    const registeredUsers = new Set<string>();

    for (let i = 0; i < count; i++) {
      const eventType = this.weightedRandomEventType(totalWeight);
      const timestamp = new Date(startDate.getTime() + Math.random() * dateSpan).toISOString();
      
      let userId: string;
      if ((eventType === 'register' || eventType === 'activate') && registeredUsers.size < count * 0.3) {
        userId = `user_${String(i + Math.floor(Math.random() * 10000)).padStart(5, '0')}`;
        registeredUsers.add(userId);
      } else if (registeredUsers.size > 0) {
        const users = Array.from(registeredUsers);
        userId = users[Math.floor(Math.random() * users.length)];
      } else {
        userId = `user_${String(i + Math.floor(Math.random() * 10000)).padStart(5, '0')}`;
        registeredUsers.add(userId);
      }

      const event: RawEvent = {
        userId,
        teamId: `team_${String(Math.floor(Math.random() * 500)).padStart(4, '0')}`,
        eventType,
        timestamp,
        channel: CHANNELS[Math.floor(Math.random() * CHANNELS.length)],
        version: Math.random() > 0.3 ? 'v2.1.0' : Math.random() > 0.5 ? 'v2.0.5' : 'v2.0.0',
        trafficType: Math.random() > 0.3 ? 'organic' : 'experiment',
      };

      if (eventType === 'feature_use' || eventType === 'first_feature_use') {
        event.module = MODULES[Math.floor(Math.random() * MODULES.length)];
        event.feature = FEATURES[event.module][Math.floor(Math.random() * FEATURES[event.module].length)];
      }

      if (eventType === 'churn') {
        event.churnReason = CHURN_REASONS[Math.floor(Math.random() * CHURN_REASONS.length)];
      }

      if (eventType === 'session') {
        event.sessionDuration = Math.floor(Math.random() * 3600);
      }

      if (options?.includeDirtyData && Math.random() < 0.03) {
        if (Math.random() < 0.4) delete (event as any).userId;
        if (Math.random() < 0.3) (event as any).eventType = 'invalid_type';
        if (Math.random() < 0.3) (event as any).timestamp = 'invalid_date';
      }

      events.push(event);
    }

    this.cache.set(cacheKey, events);
    setTimeout(() => this.cache.delete(cacheKey), this.cacheTTL);

    return events;
  }

  private weightedRandomEventType(totalWeight: number): RawEvent['eventType'] {
    let r = Math.random() * totalWeight;
    for (const [type, weight] of Object.entries(EVENT_TYPE_WEIGHTS)) {
      r -= weight;
      if (r <= 0) return type as RawEvent['eventType'];
    }
    return 'feature_use';
  }

  async query(params: EventQueryParams): Promise<{ events: RawEvent[]; total: number }> {
    const { filters, dateRange, eventTypes, limit = 100, offset = 0 } = params;

    let events = await this.generateEvents(
      dateRange || { start: '2024-01-01', end: '2024-12-31' },
      10000
    );

    if (eventTypes && eventTypes.length > 0) {
      events = events.filter(e => eventTypes.includes(e.eventType));
    }

    if (filters) {
      if (filters.users.length > 0) {
        events = events.filter(e => filters.users.includes(e.userId));
      }
      if (filters.teams.length > 0) {
        events = events.filter(e => filters.teams.includes(e.teamId));
      }
      if (filters.channels.length > 0) {
        events = events.filter(e => filters.channels.includes(e.channel));
      }
      if (filters.versions.length > 0) {
        events = events.filter(e => filters.versions.includes(e.version));
      }
      if (filters.modules.length > 0) {
        events = events.filter(e => !e.module || filters.modules.includes(e.module));
      }
      if (filters.trafficType !== 'all') {
        events = events.filter(e => e.trafficType === filters.trafficType);
      }
    }

    const total = events.length;
    const paginated = events.slice(offset, offset + limit);

    return { events: paginated, total };
  }

  async getRegisterEvents(params: Omit<EventQueryParams, 'eventTypes'>) {
    return this.query({ ...params, eventTypes: ['register'] });
  }

  async getActivateEvents(params: Omit<EventQueryParams, 'eventTypes'>) {
    return this.query({ ...params, eventTypes: ['activate'] });
  }

  async getInviteEvents(params: Omit<EventQueryParams, 'eventTypes'>) {
    return this.query({ ...params, eventTypes: ['invite'] });
  }

  async getFirstPayEvents(params: Omit<EventQueryParams, 'eventTypes'>) {
    return this.query({ ...params, eventTypes: ['first_pay'] });
  }

  async getFeatureUseEvents(params: Omit<EventQueryParams, 'eventTypes'>) {
    return this.query({ ...params, eventTypes: ['feature_use', 'first_feature_use'] });
  }

  async getChurnEvents(params: Omit<EventQueryParams, 'eventTypes'>) {
    return this.query({ ...params, eventTypes: ['churn'] });
  }

  async getSessionEvents(params: Omit<EventQueryParams, 'eventTypes'>) {
    return this.query({ ...params, eventTypes: ['session'] });
  }

  getStats(_dateRange: DateRange) {
    return {
      eventTypeWeights: { ...EVENT_TYPE_WEIGHTS },
      channels: [...CHANNELS],
      versions: [...VERSIONS],
      modules: [...MODULES],
      features: { ...FEATURES },
      churnReasons: [...CHURN_REASONS],
    };
  }

  clearCache() {
    this.cache.clear();
  }
}

export const eventRepository = new EventRepository();
