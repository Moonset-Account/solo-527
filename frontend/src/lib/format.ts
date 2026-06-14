export function formatDate(date: string | Date | null | undefined, withTime = true): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  if (!withTime) return `${y}-${m}-${day}`;
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${hh}:${mm}`;
}

export function formatDaysDiff(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date).getTime();
  const now = Date.now();
  const diffMs = d - now;
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return '今天';
  if (days > 0) return `${days} 天后`;
  return `逾期 ${Math.abs(days)} 天`;
}

export function formatFileSize(bytes?: number): string {
  if (!bytes) return '-';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIdx = 0;
  while (size >= 1024 && unitIdx < units.length - 1) {
    size /= 1024;
    unitIdx++;
  }
  return `${size.toFixed(size >= 10 || unitIdx === 0 ? 0 : 1)} ${units[unitIdx]}`;
}

export function classNames(...classes: Array<string | false | undefined | null>): string {
  return classes.filter(Boolean).join(' ');
}
