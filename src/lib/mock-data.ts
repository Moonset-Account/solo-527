import dayjs from 'dayjs';
import type { ContentItem, Platform, ContentType } from './types';

const ACCOUNTS = ['科技前沿', '生活方式', '职场成长', '美食探店', '旅行日记', '数码评测', '情感语录', '知识科普'];
const AUTHORS = ['张三', '李四', '王五', '赵六', '陈七', '刘八', '周九', '吴十'];
const TAGS = ['AI', '职场', '美食', '旅行', '数码', '情感', '健康', '理财', '教育', '娱乐', '科技', '生活', '创业', '投资', '心理'];
const PLATFORMS: Platform[] = ['wechat', 'weibo', 'douyin', 'xiaohongshu', 'bilibili'];
const CONTENT_TYPES: ContentType[] = ['article', 'video', 'image', 'short_video', 'live'];

const TITLES = [
  '2024年最值得关注的{tag}趋势',
  '深度解析：{tag}背后的逻辑',
  '小白也能懂的{tag}入门指南',
  '关于{tag}，你需要知道的10件事',
  '亲身经历：我是如何通过{tag}实现逆袭的',
  '{tag}的真相，90%的人都不知道',
  '从0到1：{tag}完全手册',
  '为什么{tag}突然火了？',
  '专家解读：{tag}未来发展方向',
  '{tag}避坑指南，少走弯路',
  '月薪3k到3w：{tag}改变了我的人生',
  '{tag}实操案例分享，干货满满',
  '别再被骗了！{tag}的真实情况',
  '{tag}新手常见问题解答',
  '一文读懂{tag}的核心逻辑',
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomChoices<T>(arr: T[], min: number, max: number): T[] {
  const count = randomInt(min, max);
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function generateTitle(tag: string): string {
  const template = randomChoice(TITLES);
  return template.replace('{tag}', tag);
}

function generateMetrics(platform: Platform, contentType: ContentType) {
  const baseMultiplier: Record<Platform, number> = {
    wechat: 1,
    weibo: 2,
    douyin: 5,
    xiaohongshu: 1.5,
    bilibili: 3,
  };

  const typeMultiplier: Record<ContentType, number> = {
    article: 1,
    video: 2,
    image: 0.5,
    short_video: 3,
    live: 4,
  };

  const base = baseMultiplier[platform] * typeMultiplier[contentType];
  const views = randomInt(1000, 100000) * base;
  const reads = platform === 'wechat' ? views * randomInt(30, 80) / 100 : views * randomInt(60, 95) / 100;
  const likes = reads * randomInt(1, 10) / 100;
  const shares = likes * randomInt(5, 30) / 100;
  const comments = likes * randomInt(3, 15) / 100;
  const favorites = likes * randomInt(10, 40) / 100;

  return {
    views: Math.round(views),
    reads: Math.round(reads),
    likes: Math.round(likes),
    shares: Math.round(shares),
    comments: Math.round(comments),
    favorites: Math.round(favorites),
  };
}

function isAnomalyItem(): { isAnomaly: boolean; reason?: string } {
  const rand = Math.random();
  if (rand < 0.05) {
    return { isAnomaly: true, reason: '数据异常-刷量嫌疑' };
  }
  if (rand < 0.08) {
    return { isAnomaly: true, reason: '数据异常-系统错误' };
  }
  return { isAnomaly: false };
}

export function generateMockData(count: number = 200): ContentItem[] {
  const items: ContentItem[] = [];
  const endDate = dayjs();
  const startDate = endDate.subtract(90, 'day');

  for (let i = 0; i < count; i++) {
    const platform = randomChoice(PLATFORMS);
    const contentType = randomChoice(CONTENT_TYPES);
    const tags = randomChoices(TAGS, 1, 3);
    const publishDate = dayjs(startDate.valueOf() + Math.random() * (endDate.valueOf() - startDate.valueOf()));
    const publishHour = randomInt(6, 23);
    const { isAnomaly, reason } = isAnomalyItem();
    const metrics = generateMetrics(platform, contentType);

    items.push({
      id: `content-${i.toString().padStart(4, '0')}`,
      title: generateTitle(tags[0]),
      account: randomChoice(ACCOUNTS),
      platform,
      contentType,
      tags,
      author: randomChoice(AUTHORS),
      publishTime: publishDate.format('YYYY-MM-DD HH:mm:ss'),
      publishHour,
      publishWeekday: publishDate.day() === 0 ? 6 : publishDate.day() - 1,
      ...metrics,
      isAnomaly,
      anomalyReason: reason,
    });
  }

  return items.sort((a, b) => dayjs(b.publishTime).valueOf() - dayjs(a.publishTime).valueOf());
}

export function getMockData(): ContentItem[] {
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('mock_content_data');
    if (cached) {
      return JSON.parse(cached);
    }
  }
  const data = generateMockData(300);
  if (typeof window !== 'undefined') {
    localStorage.setItem('mock_content_data', JSON.stringify(data));
  }
  return data;
}
