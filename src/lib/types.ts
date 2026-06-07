export type Platform = 'wechat' | 'weibo' | 'douyin' | 'xiaohongshu' | 'bilibili';
export type ContentType = 'article' | 'video' | 'image' | 'short_video' | 'live';
export type TimeUnit = 'day' | 'week' | 'month';

export interface ContentItem {
  id: string;
  title: string;
  account: string;
  platform: Platform;
  contentType: ContentType;
  tags: string[];
  author: string;
  publishTime: string;
  publishHour: number;
  publishWeekday: number;
  views: number;
  reads: number;
  likes: number;
  shares: number;
  comments: number;
  favorites: number;
  isAnomaly: boolean;
  anomalyReason?: string;
}

export interface FilterState {
  accounts: string[];
  platforms: Platform[];
  contentTypes: ContentType[];
  tags: string[];
  authors: string[];
  dateRange: [string, string];
  timeUnit: TimeUnit;
  excludeAnomaly: boolean;
}

export interface ProcessedData {
  items: ContentItem[];
  sampleSize: number;
  totalViews: number;
  totalReads: number;
  totalLikes: number;
  totalShares: number;
  totalComments: number;
  updateTime: string;
}

export interface TopicMatrixItem {
  tag: string;
  count: number;
  avgViews: number;
  avgPrimaryMetric: number;
  avgLikes: number;
  avgInteractionRate: number;
}

export interface PlatformTopicMatrix {
  platform: Platform;
  platformLabel: string;
  primaryMetricName: string;
  items: TopicMatrixItem[];
}

export interface HeatmapDataItem {
  weekday: number;
  hour: number;
  value: number;
}

export interface FunnelItem {
  name: string;
  value: number;
  rate: number;
}

export interface PlatformFunnelData {
  platform: Platform;
  platformLabel: string;
  primaryMetric: string;
  funnel: FunnelItem[];
  conversionRates: number[];
}

export interface PlatformAggregatedMetrics {
  platform: Platform;
  platformLabel: string;
  sampleSize: number;
  primaryMetricName: string;
  primaryMetricTotal: number;
  likes: number;
  shares: number;
  comments: number;
  avgInteractionRate: number;
}

export const PLATFORM_PRIMARY_METRIC_LABEL: Record<Platform, string> = {
  wechat: '阅读量',
  weibo: '曝光量',
  douyin: '播放量',
  xiaohongshu: '曝光量',
  bilibili: '播放量',
};

export interface TopContent {
  id: string;
  title: string;
  platform: Platform;
  platformLabel: string;
  views: number;
  primaryMetric: number;
  primaryMetricName: string;
  likes: number;
  shares: number;
  comments: number;
  interactionRate: number;
  tags: string[];
}

export interface PlatformTopContents {
  platform: Platform;
  platformLabel: string;
  primaryMetricName: string;
  items: TopContent[];
}

export const PLATFORM_METRICS: Record<Platform, { primary: string; secondary?: string }> = {
  wechat: { primary: 'reads', secondary: 'views' },
  weibo: { primary: 'views', secondary: 'reads' },
  douyin: { primary: 'views', secondary: 'plays' },
  xiaohongshu: { primary: 'views', secondary: 'reads' },
  bilibili: { primary: 'views', secondary: 'plays' },
};

export const PLATFORM_LABELS: Record<Platform, string> = {
  wechat: '微信公众号',
  weibo: '微博',
  douyin: '抖音',
  xiaohongshu: '小红书',
  bilibili: 'B站',
};

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  article: '图文',
  video: '长视频',
  image: '图片',
  short_video: '短视频',
  live: '直播',
};

export const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
