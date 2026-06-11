import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, pattern: "YYYY-MM-DD" | "YYYY年MM月DD日" | "MM-DD" | "MM月DD日" = "YYYY-MM-DD") {
  const d = typeof date === "string" ? new Date(date) : date;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  if (pattern === "YYYY-MM-DD") return `${y}-${m}-${day}`;
  if (pattern === "YYYY年MM月DD日") return `${y}年${m}月${day}日`;
  if (pattern === "MM月DD日") return `${m}月${day}日`;
  return `${m}-${day}`;
}

export function formatTime(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function formatDateTime(date: Date | string) {
  return `${formatDate(date)} ${formatTime(date)}`;
}

export function getWeekDates(base: Date = new Date()) {
  const dates: Date[] = [];
  const day = base.getDay();
  const monday = new Date(base);
  monday.setDate(base.getDate() - (day === 0 ? 6 : day - 1));
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
}

export function getMonthRange(year: number, month: number) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59);
  return { start, end };
}

export function hoursShortageColor(remaining: number, threshold: number) {
  if (remaining <= 0) return "text-red-600 bg-red-50";
  if (remaining < threshold) return "text-amber-500 bg-amber-50";
  return "text-mint-500 bg-mint-50";
}

export function yuan(n: number) {
  return `¥${n.toFixed(2)}`;
}
