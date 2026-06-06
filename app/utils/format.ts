export function formatNumber(num: number, decimals = 2): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  return num.toFixed(decimals);
}

export function formatCurrency(num: number): string {
  return '¥' + formatNumber(num);
}

export function formatPercent(num: number): string {
  return (num * 100).toFixed(1) + '%';
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'high': return 'border-l-loss-red bg-loss-red/10';
    case 'medium': return 'border-l-warning-orange bg-warning-orange/10';
    case 'low': return 'border-l-fresh-green bg-fresh-green/10';
    default: return 'border-l-slate-500 bg-slate-500/10';
  }
}

export function getSeverityTextColor(severity: string): string {
  switch (severity) {
    case 'high': return 'text-loss-red';
    case 'medium': return 'text-warning-orange';
    case 'low': return 'text-fresh-green';
    default: return 'text-slate-400';
  }
}
