export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('zh-CN').format(num);
}

export function getExceptionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    material_discrepancy: '物资差异',
    budget_overrun: '预算超支',
    other: '其他异常',
  };
  return labels[type] || type;
}

export function getExceptionStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: '待处理',
    investigating: '调查中',
    handling: '处理中',
    closed: '已关闭',
  };
  return labels[status] || status;
}

export function getExceptionStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-red-100 text-red-700',
    investigating: 'bg-orange-100 text-orange-700',
    handling: 'bg-yellow-100 text-yellow-700',
    closed: 'bg-gray-100 text-gray-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

export function getReviewStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已驳回',
  };
  return labels[status] || status;
}

export function getReviewStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

export function getVisitStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: '草稿',
    submitted: '已提交',
    published: '已发布',
  };
  return labels[status] || status;
}

export function getVisitStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    submitted: 'bg-blue-100 text-blue-700',
    published: 'bg-green-100 text-green-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}
