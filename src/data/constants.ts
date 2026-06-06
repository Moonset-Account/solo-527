import { ActivityType } from './types';

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  video: '视频观看',
  homework: '作业提交',
  quiz: '测验完成',
  discussion: '讨论互动',
  certificate: '证书领取',
};

export const ACTIVITY_TYPE_ORDER: ActivityType[] = [
  'video',
  'homework',
  'quiz',
  'discussion',
  'certificate',
];

export const DIFFICULTY_LABELS: Record<string, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
};

export const TIME_PRESET_LABELS: Record<string, string> = {
  day: '今日',
  week: '本周',
  month: '本月',
  custom: '自定义',
};

export const DROPOUT_THRESHOLD = 0.6;

export const LOW_SAMPLE_THRESHOLD = 30;

export const ANOMALY_SIGMA = 3;

export const COLORS = {
  primary: '#165DFF',
  success: '#00B42A',
  danger: '#F53F3F',
  warning: '#FF7D00',
  info: '#86909C',
  background: '#F2F3F5',
  text: '#1D2129',
  textSecondary: '#4E5969',
  textTertiary: '#86909C',
  border: '#E5E6EB',
};

export const COHORT_COLORS = [
  '#165DFF',
  '#00B42A',
  '#FF7D00',
  '#722ED1',
  '#F53F3F',
  '#14C9C9',
];
