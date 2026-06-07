import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const abnormalTypeLabels: Record<string, { label: string; color: string; bgColor: string }> = {
  fast_answer: { label: '答题过快', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  duplicate_submission: { label: '重复提交', color: 'text-red-700', bgColor: 'bg-red-100' },
  device_concentration: { label: '设备集中', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  skip_abnormal: { label: '跳题异常', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  open_copy: { label: '开放题复制', color: 'text-pink-700', bgColor: 'bg-pink-100' },
};

export const statusLabels: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: '待复核', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  approved: { label: '已通过', color: 'text-green-700', bgColor: 'bg-green-100' },
  rejected: { label: '已拒绝', color: 'text-gray-700', bgColor: 'bg-gray-100' },
};

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}分${secs}秒` : `${mins}分钟`;
}

export function getQualityScoreColor(score: number): string {
  if (score >= 85) return 'text-green-600';
  if (score >= 70) return 'text-blue-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-600';
}

export function getQualityScoreBgColor(score: number): string {
  if (score >= 85) return 'bg-green-500';
  if (score >= 70) return 'bg-blue-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-red-500';
}
