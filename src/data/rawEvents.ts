import { RawEvent, FilterDimensions, DateRange } from '../types';
import { format, addDays, parseISO } from 'date-fns';

const CHANNELS = ['自然搜索', '付费广告', '社交媒体', '邮件营销', '直接访问', '推荐邀请'];
const VERSIONS = ['v2.1.0', 'v2.0.5', 'v2.0.0', 'v1.9.2'];
const MODULES = ['项目管理', '数据分析', '团队协作', '文件存储', '集成中心', '设置'];
const FEATURES: Record<string, string[]> = {
  '项目管理': ['看板视图', '甘特图', '任务列表', '里程碑'],
  '数据分析': ['数据仪表盘', '自定义报表', '漏斗分析', 'Cohort分析'],
  '团队协作': ['实时聊天', '视频会议', '评论', '@提醒'],
  '文件存储': ['在线文档', '云盘', '版本历史', '文件分享'],
  '集成中心': ['Slack集成', '开放API', 'Webhook', 'Zapier'],
  '设置': ['个人设置', '团队设置', '账单管理', '权限管理'],
};
const TEAMS = ['产品团队', '研发团队', '市场团队', '销售团队', '客户成功', '运营团队'];
const CHURN_REASONS = [
  '产品功能不满足需求',
  '价格过高',
  '转向竞品',
  '团队规模缩减',
  '使用体验不佳',
  '客户支持响应慢',
  '其他原因',
];

export const generateRawEvents = (
  filters: FilterDimensions,
  dateRange: DateRange,
  count: number = 50000
): RawEvent[] => {
  const events: RawEvent[] = [];
  const start = parseISO(dateRange.start);
  const end = parseISO(dateRange.end);
  const daysSpan = Math.max(1, Math.min(90, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

  const channelFilter = filters.channels.length > 0 ? filters.channels : CHANNELS;
  const versionFilter = filters.versions.length > 0 ? filters.versions : VERSIONS;
  const teamFilter = filters.teams.length > 0 ? filters.teams : TEAMS;
  const moduleFilter = filters.modules.length > 0 ? filters.modules : MODULES;

  const trafficMultiplier = filters.trafficType === 'experiment' ? 0.65 : filters.trafficType === 'organic' ? 0.85 : 1;
  const activeFilterCount = [filters.users.length, filters.teams.length, filters.channels.length, filters.versions.length, filters.modules.length].filter(n => n > 0).length;
  const filterMultiplier = Math.pow(0.7, activeFilterCount);
  const actualCount = Math.round(count * trafficMultiplier * filterMultiplier * Math.min(2, daysSpan / 30));

  for (let i = 0; i < actualCount; i++) {
    const userId = `user_${Math.floor(Math.random() * 100000)}`;
    const teamId = `team_${teamFilter[Math.floor(Math.random() * teamFilter.length)]}`;
    const channel = channelFilter[Math.floor(Math.random() * channelFilter.length)];
    const version = versionFilter[Math.floor(Math.random() * versionFilter.length)];
    const trafficType: 'experiment' | 'organic' = Math.random() > 0.3 ? 'organic' : 'experiment';
    
    if (filters.trafficType !== 'all' && filters.trafficType !== trafficType) continue;

    const eventDate = addDays(start, Math.floor(Math.random() * daysSpan));
    const baseTime = eventDate.getTime();
    
    const userSequence = Math.random();
    
    events.push({
      userId,
      teamId,
      eventType: 'register',
      timestamp: format(new Date(baseTime), "yyyy-MM-dd'T'HH:mm:ss"),
      channel,
      version,
      trafficType,
    });

    if (userSequence < 0.75) {
      events.push({
        userId,
        teamId,
        eventType: 'activate',
        timestamp: format(new Date(baseTime + 3600000 * Math.random() * 24), "yyyy-MM-dd'T'HH:mm:ss"),
        channel,
        version,
        trafficType,
      });

      if (userSequence < 0.56) {
        events.push({
          userId,
          teamId,
          eventType: 'invite',
          timestamp: format(new Date(baseTime + 86400000 * (1 + Math.random() * 3)), "yyyy-MM-dd'T'HH:mm:ss"),
          channel,
          version,
          trafficType,
        });
      }

      if (userSequence < 0.41) {
        const module = moduleFilter[Math.floor(Math.random() * moduleFilter.length)];
        const features = FEATURES[module] || [];
        const feature = features[Math.floor(Math.random() * features.length)];
        
        events.push({
          userId,
          teamId,
          eventType: 'first_feature_use',
          timestamp: format(new Date(baseTime + 86400000 * (2 + Math.random() * 5)), "yyyy-MM-dd'T'HH:mm:ss"),
          channel,
          version,
          module,
          feature,
          trafficType,
        });

        if (userSequence < 0.165) {
          events.push({
            userId,
            teamId,
            eventType: 'first_pay',
            timestamp: format(new Date(baseTime + 86400000 * (7 + Math.random() * 14)), "yyyy-MM-dd'T'HH:mm:ss"),
            channel,
            version,
            trafficType,
          });
        }

        const sessionCount = Math.floor(Math.random() * 20) + 1;
        for (let s = 0; s < sessionCount; s++) {
          const sessionModule = moduleFilter[Math.floor(Math.random() * moduleFilter.length)];
          const sessionFeatures = FEATURES[sessionModule] || [];
          const sessionFeature = sessionFeatures[Math.floor(Math.random() * sessionFeatures.length)];
          const sessionDuration = 60 + Math.floor(Math.random() * 600);
          
          events.push({
            userId,
            teamId,
            eventType: 'session',
            timestamp: format(new Date(baseTime + 86400000 * (3 + Math.random() * 25) + s * 3600000), "yyyy-MM-dd'T'HH:mm:ss"),
            channel,
            version,
            module: sessionModule,
            feature: sessionFeature,
            trafficType,
            sessionDuration,
          });

          if (Math.random() < 0.6) {
            events.push({
              userId,
              teamId,
              eventType: 'feature_use',
              timestamp: format(new Date(baseTime + 86400000 * (3 + Math.random() * 25) + s * 3600000 + 30000), "yyyy-MM-dd'T'HH:mm:ss"),
              channel,
              version,
              module: sessionModule,
              feature: sessionFeature,
              trafficType,
            });
          }
        }
      }

      if (userSequence > 0.6 && userSequence < 0.72) {
        events.push({
          userId,
          teamId,
          eventType: 'churn',
          timestamp: format(new Date(baseTime + 86400000 * (5 + Math.random() * 20)), "yyyy-MM-dd'T'HH:mm:ss"),
          channel,
          version,
          trafficType,
          churnReason: CHURN_REASONS[Math.floor(Math.random() * CHURN_REASONS.length)],
        });
      }
    }
  }

  return events.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
};
