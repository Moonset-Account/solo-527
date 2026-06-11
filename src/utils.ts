import type { FlagValue, FlagType, DriftType, DriftSeverity } from './types';

export function detectType(value: FlagValue): FlagType {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  const t = typeof value;
  if (t === 'string') return 'string';
  if (t === 'number') return 'number';
  if (t === 'boolean') return 'boolean';
  if (t === 'object') return 'object';
  return 'unknown';
}

export function valuesEqual(a: FlagValue, b: FlagValue): boolean {
  if (a === b) return true;
  if (a === null || b === null) return a === b;
  if (typeof a !== typeof b) return false;
  if (typeof a === 'object' && typeof b === 'object') {
    return JSON.stringify(normalizeValue(a)) === JSON.stringify(normalizeValue(b));
  }
  return false;
}

export function normalizeValue(v: FlagValue): FlagValue {
  if (v === null || v === undefined) return null;
  if (typeof v === 'object') {
    if (Array.isArray(v)) return (v as unknown[]).map(item => normalizeValue(item as FlagValue));
    const obj = v as Record<string, FlagValue>;
    const sorted: Record<string, FlagValue> = {};
    Object.keys(obj).sort().forEach(k => {
      sorted[k] = normalizeValue(obj[k]);
    });
    return sorted;
  }
  return v;
}

export function getDriftSeverity(type: DriftType, environment?: string): DriftSeverity {
  const isProd = environment?.toLowerCase().includes('prod') ||
    environment?.toLowerCase() === 'production';

  switch (type) {
    case 'missing_in_config':
      return isProd ? 'critical' : 'warning';
    case 'missing_in_deploy':
      return isProd ? 'critical' : 'warning';
    case 'missing_in_code':
      return 'info';
    case 'default_mismatch':
      return isProd ? 'critical' : 'warning';
    case 'deploy_mismatch':
      return isProd ? 'critical' : 'warning';
    case 'deprecated_in_use':
      return 'warning';
    case 'type_mismatch':
      return isProd ? 'critical' : 'warning';
    default:
      return 'info';
  }
}

export function valueToString(v: FlagValue): string {
  if (v === null) return 'null';
  if (typeof v === 'string') return `"${v}"`;
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

export function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 3) + '...';
}

export function generateDriftId(type: DriftType, key: string, env?: string): string {
  const base = `${type}:${key}`;
  return env ? `${base}:${env}` : base;
}

export function getISODate(): string {
  return new Date().toISOString();
}

export function parseDateOrUndefined(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const d = new Date(value);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export function globToRegex(glob: string): RegExp {
  const escaped = glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${escaped}$`);
}

export function matchesPattern(key: string, pattern: string): boolean {
  if (pattern.includes('*') || pattern.includes('?')) {
    return globToRegex(pattern).test(key);
  }
  return key === pattern || key.startsWith(pattern + '.');
}

export function getLatestDate(dates: Array<string | undefined>): string | undefined {
  const validDates = dates.filter((d): d is string => !!d);
  if (validDates.length === 0) return undefined;
  let latest = new Date(validDates[0]);
  for (const d of validDates) {
    const dt = new Date(d);
    if (dt > latest) latest = dt;
  }
  return latest.toISOString();
}
