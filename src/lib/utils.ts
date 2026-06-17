import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat("zh-CN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercent(value: number, decimals: number = 2): string {
  return `${formatNumber(value * 100, decimals)}%`;
}

export function formatCurrency(value: number, currency: string = "CNY"): string {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency,
  }).format(value);
}

export function formatDate(date: Date | string, pattern: string = "yyyy-MM-dd"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, pattern, { locale: zhCN });
}

export function formatDateTime(date: Date | string): string {
  return formatDate(date, "yyyy-MM-dd HH:mm:ss");
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { locale: zhCN, addSuffix: true });
}

export function getTrendColor(trend: "UP" | "DOWN" | "STABLE"): string {
  switch (trend) {
    case "UP":
      return "text-success";
    case "DOWN":
      return "text-danger";
    default:
      return "text-muted";
  }
}

export function getStatusColor(status: "NORMAL" | "WARNING" | "CRITICAL"): string {
  switch (status) {
    case "NORMAL":
      return "bg-success";
    case "WARNING":
      return "bg-warning";
    case "CRITICAL":
      return "bg-danger";
    default:
      return "bg-muted";
  }
}

export function getSeverityColor(severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"): string {
  switch (severity) {
    case "LOW":
      return "bg-blue-500";
    case "MEDIUM":
      return "bg-warning";
    case "HIGH":
      return "bg-orange-500";
    case "CRITICAL":
      return "bg-danger";
    default:
      return "bg-muted";
  }
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function calculateMovingAverage(values: number[], window: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1);
    const windowValues = values.slice(start, i + 1);
    const avg = windowValues.reduce((sum, v) => sum + v, 0) / windowValues.length;
    result.push(avg);
  }
  return result;
}

export function calculateStdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((sum, v) => sum + v, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function detectAnomalyThreeSigma(
  value: number,
  historicalValues: number[]
): { isAnomaly: boolean; deviation: number; threshold: number } {
  const mean = historicalValues.reduce((sum, v) => sum + v, 0) / historicalValues.length;
  const stdDev = calculateStdDev(historicalValues);
  const threshold = 3 * stdDev;
  const deviation = Math.abs(value - mean);
  return {
    isAnomaly: deviation > threshold,
    deviation,
    threshold,
  };
}
