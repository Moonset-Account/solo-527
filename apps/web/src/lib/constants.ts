export const campStatusMap: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'default' },
  upcoming: { label: '待开营', color: 'processing' },
  ongoing: { label: '进行中', color: 'success' },
  completed: { label: '已完成', color: 'default' },
  cancelled: { label: '已取消', color: 'error' },
};

export const memberStatusMap: Record<string, { label: string; color: string }> = {
  active: { label: '正常', color: 'success' },
  expired: { label: '已过期', color: 'default' },
  refunded: { label: '已退款', color: 'warning' },
  paused: { label: '已暂停', color: 'processing' },
};

export const chapterStatusMap: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'default' },
  published: { label: '已发布', color: 'success' },
};

export const checkinStatusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待审核', color: 'warning' },
  approved: { label: '已通过', color: 'success' },
  rejected: { label: '已拒绝', color: 'error' },
};

export const refundStatusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'warning' },
  approved: { label: '已同意', color: 'processing' },
  rejected: { label: '已拒绝', color: 'error' },
  processed: { label: '已完成', color: 'success' },
};

export const todoStatusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'warning' },
  in_progress: { label: '处理中', color: 'processing' },
  completed: { label: '已完成', color: 'success' },
  cancelled: { label: '已取消', color: 'default' },
};

export const todoPriorityMap: Record<string, { label: string; color: string }> = {
  low: { label: '低', color: 'default' },
  medium: { label: '中', color: 'blue' },
  high: { label: '高', color: 'orange' },
  urgent: { label: '紧急', color: 'red' },
};

export const todoTypeMap: Record<string, { label: string; icon: string }> = {
  fall_behind_warning: { label: '掉队预警', icon: '⚠️' },
  checkin_review: { label: '打卡审核', icon: '✅' },
  refund_review: { label: '退款审核', icon: '💰' },
  custom: { label: '自定义', icon: '📝' },
};

export const conversionSourceMap: Record<string, { label: string; color: string }> = {
  wechat_group: { label: '微信群', color: 'green' },
  wechat_moments: { label: '朋友圈', color: 'cyan' },
  douyin: { label: '抖音', color: 'geekblue' },
  xiaohongshu: { label: '小红书', color: 'magenta' },
  zhihu: { label: '知乎', color: 'blue' },
  referral: { label: '转介绍', color: 'purple' },
  offline: { label: '线下', color: 'volcano' },
  other: { label: '其他', color: 'default' },
};

export const benefitTypeMap: Record<string, { label: string; color: string }> = {
  discount: { label: '折扣券', color: 'orange' },
  gift: { label: '赠品', color: 'magenta' },
  service: { label: '服务', color: 'purple' },
  other: { label: '其他', color: 'default' },
};

export const materialTypeMap: Record<string, string> = {
  pdf: 'PDF文档',
  video: '视频',
  audio: '音频',
  image: '图片',
  zip: '压缩包',
  other: '其他',
};

export const roleMap: Record<string, { label: string; color: string }> = {
  admin: { label: '管理员', color: 'red' },
  operator: { label: '运营', color: 'blue' },
  member: { label: '学员', color: 'default' },
};

export function formatDate(date?: string | Date | null, format: string = 'YYYY-MM-DD HH:mm') {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  let result = format;
  result = result.replace(/YYYY/g, String(year));
  result = result.replace(/MM/g, month);
  result = result.replace(/DD/g, day);
  result = result.replace(/HH/g, hours);
  result = result.replace(/mm/g, minutes);
  return result;
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '-';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function formatNumber(num?: string | number, decimals: number = 2): string {
  if (num === undefined || num === null) return '0';
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return '0';
  return n.toLocaleString('zh-CN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
