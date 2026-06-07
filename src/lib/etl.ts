import dayjs from 'dayjs';
import type {
  ContentItem,
  FilterState,
  ProcessedData,
  TopicMatrixItem,
  PlatformTopicMatrix,
  HeatmapDataItem,
  FunnelItem,
  TopContent,
  PlatformTopContents,
  PlatformFunnelData,
  PlatformAggregatedMetrics,
  Platform,
} from './types';
import {
  PLATFORM_LABELS,
  PLATFORM_PRIMARY_METRIC_LABEL,
  PLATFORM_METRICS,
} from './types';
import { getMockData } from './mock-data';

const CACHE_KEY = 'content_data_cache';
const CACHE_TTL = 5 * 60 * 1000;

interface CacheEntry {
  data: ContentItem[];
  timestamp: number;
}

export class DataCache {
  private static instance: DataCache;
  private memoryCache: Map<string, CacheEntry> = new Map();

  private constructor() {}

  static getInstance(): DataCache {
    if (!DataCache.instance) {
      DataCache.instance = new DataCache();
    }
    return DataCache.instance;
  }

  get(key: string): ContentItem[] | null {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > CACHE_TTL) {
      this.memoryCache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: ContentItem[]): void {
    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.memoryCache.clear();
  }
}

export function extractData(): ContentItem[] {
  const cache = DataCache.getInstance();
  const cached = cache.get(CACHE_KEY);
  if (cached) {
    return cached;
  }

  const data = getMockData();
  cache.set(CACHE_KEY, data);
  return data;
}

export function transformData(items: ContentItem[]): ContentItem[] {
  return items.map(item => ({
    ...item,
    likes: Math.max(0, item.likes),
    shares: Math.max(0, item.shares),
    comments: Math.max(0, item.comments),
    views: Math.max(0, item.views),
    reads: Math.max(0, item.reads),
  }));
}

export function filterData(items: ContentItem[], filters: FilterState): ContentItem[] {
  return items.filter(item => {
    if (filters.accounts.length > 0 && !filters.accounts.includes(item.account)) {
      return false;
    }
    if (filters.platforms.length > 0 && !filters.platforms.includes(item.platform)) {
      return false;
    }
    if (filters.contentTypes.length > 0 && !filters.contentTypes.includes(item.contentType)) {
      return false;
    }
    if (filters.tags.length > 0 && !item.tags.some(t => filters.tags.includes(t))) {
      return false;
    }
    if (filters.authors.length > 0 && !filters.authors.includes(item.author)) {
      return false;
    }
    const publishDate = dayjs(item.publishTime);
    const startDate = dayjs(filters.dateRange[0]);
    const endDate = dayjs(filters.dateRange[1]).endOf('day');
    if (publishDate.isBefore(startDate) || publishDate.isAfter(endDate)) {
      return false;
    }
    if (filters.excludeAnomaly && item.isAnomaly) {
      return false;
    }
    return true;
  });
}

export function loadData(filters: FilterState): ProcessedData {
  const rawData = extractData();
  const transformed = transformData(rawData);
  const filtered = filterData(transformed, filters);

  return {
    items: filtered,
    sampleSize: filtered.length,
    totalViews: filtered.reduce((sum, item) => sum + item.views, 0),
    totalReads: filtered.reduce((sum, item) => sum + item.reads, 0),
    totalLikes: filtered.reduce((sum, item) => sum + item.likes, 0),
    totalShares: filtered.reduce((sum, item) => sum + item.shares, 0),
    totalComments: filtered.reduce((sum, item) => sum + item.comments, 0),
    updateTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  };
}

export function getTopicMatrix(items: ContentItem[], topN: number = 15): TopicMatrixItem[] {
  const tagMap = new Map<string, { count: number; totalViews: number; totalPrimaryMetric: number; totalLikes: number; totalInteractions: number }>();

  items.forEach(item => {
    const primaryValue = getPrimaryMetricValue(item);
    item.tags.forEach(tag => {
      const existing = tagMap.get(tag) || { count: 0, totalViews: 0, totalPrimaryMetric: 0, totalLikes: 0, totalInteractions: 0 };
      tagMap.set(tag, {
        count: existing.count + 1,
        totalViews: existing.totalViews + item.views,
        totalPrimaryMetric: existing.totalPrimaryMetric + primaryValue,
        totalLikes: existing.totalLikes + item.likes,
        totalInteractions: existing.totalInteractions + item.likes + item.shares + item.comments,
      });
    });
  });

  return Array.from(tagMap.entries())
    .map(([tag, data]) => ({
      tag,
      count: data.count,
      avgViews: Math.round(data.totalViews / data.count),
      avgPrimaryMetric: Math.round(data.totalPrimaryMetric / data.count),
      avgLikes: Math.round(data.totalLikes / data.count),
      avgInteractionRate: Number(((data.totalInteractions / data.count) / (data.totalPrimaryMetric / data.count) * 100).toFixed(2)),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
}

export function getPlatformTopicMatrix(items: ContentItem[], topN: number = 15): PlatformTopicMatrix[] {
  const platformItems = new Map<Platform, ContentItem[]>();
  
  items.forEach(item => {
    const existing = platformItems.get(item.platform) || [];
    existing.push(item);
    platformItems.set(item.platform, existing);
  });

  const result: PlatformTopicMatrix[] = [];
  platformItems.forEach((platformData, platform) => {
    result.push({
      platform,
      platformLabel: PLATFORM_LABELS[platform],
      primaryMetricName: PLATFORM_PRIMARY_METRIC_LABEL[platform],
      items: getTopicMatrix(platformData, topN),
    });
  });

  return result.sort((a, b) => a.platform.localeCompare(b.platform));
}

export function getPublishHeatmap(items: ContentItem[]): HeatmapDataItem[] {
  const heatmap: Map<string, number> = new Map();

  items.forEach(item => {
    const key = `${item.publishWeekday}-${item.publishHour}`;
    heatmap.set(key, (heatmap.get(key) || 0) + 1);
  });

  const result: HeatmapDataItem[] = [];
  for (let weekday = 0; weekday < 7; weekday++) {
    for (let hour = 0; hour < 24; hour++) {
      const key = `${weekday}-${hour}`;
      result.push({
        weekday,
        hour,
        value: heatmap.get(key) || 0,
      });
    }
  }

  return result;
}

export function getInteractionFunnel(items: ContentItem[]): FunnelItem[] {
  const totalViews = items.reduce((sum, item) => sum + item.views, 0);
  const totalReads = items.reduce((sum, item) => sum + item.reads, 0);
  const totalLikes = items.reduce((sum, item) => sum + item.likes, 0);
  const totalShares = items.reduce((sum, item) => sum + item.shares, 0);
  const totalComments = items.reduce((sum, item) => sum + item.comments, 0);

  return [
    { name: '曝光量', value: totalViews, rate: 100 },
    { name: '阅读量', value: totalReads, rate: totalViews > 0 ? Number(((totalReads / totalViews) * 100).toFixed(2)) : 0 },
    { name: '点赞量', value: totalLikes, rate: totalViews > 0 ? Number(((totalLikes / totalViews) * 100).toFixed(2)) : 0 },
    { name: '转发量', value: totalShares, rate: totalViews > 0 ? Number(((totalShares / totalViews) * 100).toFixed(2)) : 0 },
    { name: '评论量', value: totalComments, rate: totalViews > 0 ? Number(((totalComments / totalViews) * 100).toFixed(2)) : 0 },
  ];
}

export function getTopContents(items: ContentItem[], topN: number = 10): TopContent[] {
  return [...items]
    .map(item => {
      const primaryValue = getPrimaryMetricValue(item);
      return {
        id: item.id,
        title: item.title,
        platform: item.platform,
        platformLabel: PLATFORM_LABELS[item.platform],
        views: item.views,
        primaryMetric: primaryValue,
        primaryMetricName: PLATFORM_PRIMARY_METRIC_LABEL[item.platform],
        likes: item.likes,
        shares: item.shares,
        comments: item.comments,
        interactionRate: primaryValue > 0 ? Number((((item.likes + item.shares + item.comments) / primaryValue) * 100).toFixed(2)) : 0,
        tags: item.tags,
      };
    })
    .sort((a, b) => b.primaryMetric - a.primaryMetric)
    .slice(0, topN);
}

export function getPlatformTopContents(items: ContentItem[], topN: number = 10): PlatformTopContents[] {
  const platformItems = new Map<Platform, ContentItem[]>();
  
  items.forEach(item => {
    const existing = platformItems.get(item.platform) || [];
    existing.push(item);
    platformItems.set(item.platform, existing);
  });

  const result: PlatformTopContents[] = [];
  platformItems.forEach((platformData, platform) => {
    result.push({
      platform,
      platformLabel: PLATFORM_LABELS[platform],
      primaryMetricName: PLATFORM_PRIMARY_METRIC_LABEL[platform],
      items: getTopContents(platformData, topN),
    });
  });

  return result.sort((a, b) => a.platform.localeCompare(b.platform));
}

export function validateMetrics(items: ContentItem[]): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  const hasNegative = items.some(i => i.views < 0 || i.likes < 0 || i.shares < 0 || i.comments < 0);
  if (hasNegative) {
    issues.push('存在负数指标，数据可能异常');
  }

  const platformGroups = new Map<string, ContentItem[]>();
  items.forEach(item => {
    const group = platformGroups.get(item.platform) || [];
    group.push(item);
    platformGroups.set(item.platform, group);
  });

  platformGroups.forEach((platformItems, platform) => {
    const avgViews = platformItems.reduce((s, i) => s + i.views, 0) / platformItems.length;
    const outliers = platformItems.filter(i => i.views > avgViews * 10 || i.views < avgViews * 0.1);
    if (outliers.length > platformItems.length * 0.1) {
      issues.push(`${platform} 数据离散度过高，存在${outliers.length}个离群值`);
    }
  });

  return {
    valid: issues.length === 0,
    issues,
  };
}

export function exportToCSV(items: ContentItem[], filters: FilterState, updateTime: string): string {
  const headers = ['ID', '标题', '账号', '平台', '内容类型', '标签', '作者', '发布时间', '曝光量', '阅读量', '点赞量', '转发量', '评论量', '是否异常', '异常原因'];
  const rows = items.map(item => [
    item.id,
    item.title,
    item.account,
    item.platform,
    item.contentType,
    item.tags.join('|'),
    item.author,
    item.publishTime,
    item.views,
    item.reads,
    item.likes,
    item.shares,
    item.comments,
    item.isAnomaly ? '是' : '否',
    item.anomalyReason || '',
  ]);

  const filterInfo = [
    `# 数据更新时间: ${updateTime}`,
    `# 样本量: ${items.length}`,
    `# 筛选条件:`,
    filters.accounts.length > 0 ? `#   账号: ${filters.accounts.join(', ')}` : '',
    filters.platforms.length > 0 ? `#   平台: ${filters.platforms.join(', ')}` : '',
    filters.contentTypes.length > 0 ? `#   内容类型: ${filters.contentTypes.join(', ')}` : '',
    filters.tags.length > 0 ? `#   标签: ${filters.tags.join(', ')}` : '',
    filters.authors.length > 0 ? `#   作者: ${filters.authors.join(', ')}` : '',
    `#   时间范围: ${filters.dateRange[0]} ~ ${filters.dateRange[1]}`,
    filters.excludeAnomaly ? '#   已排除异常数据' : '',
    '',
  ].filter(Boolean);

  const csvContent = [
    ...filterInfo,
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  return csvContent;
}

function getPrimaryMetricValue(item: ContentItem): number {
  const metrics = PLATFORM_METRICS[item.platform];
  if (metrics.primary === 'reads') {
    return item.reads;
  }
  return item.views;
}

export function getPlatformAggregatedMetrics(items: ContentItem[]): PlatformAggregatedMetrics[] {
  const platformGroups = new Map<Platform, ContentItem[]>();

  items.forEach(item => {
    const group = platformGroups.get(item.platform) || [];
    group.push(item);
    platformGroups.set(item.platform, group);
  });

  const result: PlatformAggregatedMetrics[] = [];
  platformGroups.forEach((platformItems, platform) => {
    const primaryMetricTotal = platformItems.reduce((sum, item) => sum + getPrimaryMetricValue(item), 0);
    const totalLikes = platformItems.reduce((sum, item) => sum + item.likes, 0);
    const totalShares = platformItems.reduce((sum, item) => sum + item.shares, 0);
    const totalComments = platformItems.reduce((sum, item) => sum + item.comments, 0);
    const totalInteractions = totalLikes + totalShares + totalComments;

    result.push({
      platform,
      platformLabel: PLATFORM_LABELS[platform],
      sampleSize: platformItems.length,
      primaryMetricName: PLATFORM_PRIMARY_METRIC_LABEL[platform],
      primaryMetricTotal,
      likes: totalLikes,
      shares: totalShares,
      comments: totalComments,
      avgInteractionRate: primaryMetricTotal > 0
        ? Number(((totalInteractions / primaryMetricTotal) * 100).toFixed(2))
        : 0,
    });
  });

  return result.sort((a, b) => b.primaryMetricTotal - a.primaryMetricTotal);
}

export function getPlatformInteractionFunnel(items: ContentItem[]): PlatformFunnelData[] {
  const platformGroups = new Map<Platform, ContentItem[]>();

  items.forEach(item => {
    const group = platformGroups.get(item.platform) || [];
    group.push(item);
    platformGroups.set(item.platform, group);
  });

  const result: PlatformFunnelData[] = [];
  platformGroups.forEach((platformItems, platform) => {
    const totalPrimary = platformItems.reduce((sum, item) => sum + getPrimaryMetricValue(item), 0);
    const totalLikes = platformItems.reduce((sum, item) => sum + item.likes, 0);
    const totalShares = platformItems.reduce((sum, item) => sum + item.shares, 0);
    const totalComments = platformItems.reduce((sum, item) => sum + item.comments, 0);

    const primaryName = PLATFORM_PRIMARY_METRIC_LABEL[platform];
    const funnel: FunnelItem[] = [
      { name: primaryName, value: totalPrimary, rate: 100 },
      { name: '点赞量', value: totalLikes, rate: totalPrimary > 0 ? Number(((totalLikes / totalPrimary) * 100).toFixed(2)) : 0 },
      { name: '转发量', value: totalShares, rate: totalPrimary > 0 ? Number(((totalShares / totalPrimary) * 100).toFixed(2)) : 0 },
      { name: '评论量', value: totalComments, rate: totalPrimary > 0 ? Number(((totalComments / totalPrimary) * 100).toFixed(2)) : 0 },
    ];

    const conversionRates: number[] = [];
    for (let i = 1; i < funnel.length; i++) {
      const prev = funnel[i - 1].value;
      conversionRates.push(prev > 0 ? Number(((funnel[i].value / prev) * 100).toFixed(2)) : 0);
    }

    result.push({
      platform,
      platformLabel: PLATFORM_LABELS[platform],
      primaryMetric: PLATFORM_PRIMARY_METRIC_LABEL[platform],
      funnel,
      conversionRates,
    });
  });

  return result;
}
