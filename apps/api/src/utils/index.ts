export function generateId(prefix = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${prefix}${timestamp}${random}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

export function calcUsagePercent(used: number, quota: number): number {
  if (quota <= 0) return 0;
  return Math.round((used / quota) * 100);
}

export function getDaysUntilExpiry(expireDate?: string): number | null {
  if (!expireDate) return null;
  const diff = new Date(expireDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
