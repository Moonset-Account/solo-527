import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, differenceInMinutes } from "date-fns";
import { zhCN } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMinutes(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined || isNaN(minutes)) {
    return "-";
  }
  if (minutes < 60) {
    return `${minutes}分钟`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  try {
    return format(parseISO(dateStr), "yyyy-MM-dd HH:mm", { locale: zhCN });
  } catch {
    return "-";
  }
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  try {
    return format(parseISO(dateStr), "yyyy-MM-dd", { locale: zhCN });
  } catch {
    return "-";
  }
}

export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return "-";
  return num.toLocaleString("zh-CN");
}

export function maskName(name: string | null | undefined): string {
  if (!name) return "-";
  if (name.length <= 1) return name + "***";
  return name.charAt(0) + "***";
}

export function calculateWaitMinutes(
  startTime: string | null | undefined,
  endTime: string | null | undefined
): number | null {
  if (!startTime || !endTime) return null;
  try {
    const diff = differenceInMinutes(parseISO(endTime), parseISO(startTime));
    return diff >= 0 ? diff : null;
  } catch {
    return null;
  }
}

export function getTimeSlot(hour: number): string {
  if (hour >= 0 && hour < 6) return "night";
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 14) return "noon";
  if (hour >= 14 && hour < 18) return "afternoon";
  return "evening";
}

export function getWaitColor(waitMinutes: number | null): string {
  if (waitMinutes === null) return "#86909C";
  if (waitMinutes < 15) return "#00B42A";
  if (waitMinutes < 30) return "#FF7D00";
  if (waitMinutes < 60) return "#F53F3F";
  return "#CB2634";
}

export function generateId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function downloadCSV(content: string, filename: string) {
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

export function groupBy<T, K extends keyof any>(
  array: T[],
  keyGetter: (item: T) => K
): Record<K, T[]> {
  return array.reduce((result, item) => {
    const key = keyGetter(item);
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(item);
    return result;
  }, {} as Record<K, T[]>);
}
