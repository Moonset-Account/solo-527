export function formatNumber(num: number, decimals = 0): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + "万";
  }
  return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatPercent(num: number, decimals = 1): string {
  return (num * 100).toFixed(decimals) + "%";
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${formatDate(d)} ${hours}:${minutes}`;
}

export function getRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "刚刚";
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  return formatDate(d);
}

export const severityConfig = {
  LOW: { label: "低", color: "text-sky-700", bg: "bg-sky-50", border: "border-sky-200", dot: "bg-sky-500" },
  MEDIUM: { label: "中", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500" },
  HIGH: { label: "高", color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200", dot: "bg-orange-500" },
  CRITICAL: { label: "严重", color: "text-red-700", bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500" },
};

export const statusConfig = {
  OPEN: { label: "待处理", color: "text-red-700", bg: "bg-red-50" },
  INVESTIGATING: { label: "处理中", color: "text-amber-700", bg: "bg-amber-50" },
  RESOLVED: { label: "已解决", color: "text-emerald-700", bg: "bg-emerald-50" },
  IGNORED: { label: "已忽略", color: "text-neutral-500", bg: "bg-neutral-100" },
};

export const periodConfig = {
  DAY: { label: "日" },
  WEEK: { label: "周" },
  MONTH: { label: "月" },
};

export const thresholdTypeConfig = {
  ABSOLUTE: { label: "绝对值" },
  PERCENTAGE: { label: "百分比" },
};

export const directionConfig = {
  ABOVE: { label: "高于阈值" },
  BELOW: { label: "低于阈值" },
  BOTH: { label: "双向偏离" },
};

export const rootCauseCategories = [
  "市场因素",
  "产品问题",
  "价格策略",
  "渠道问题",
  "促销活动影响",
  "数据口径问题",
  "季节性波动",
  "其他",
];
