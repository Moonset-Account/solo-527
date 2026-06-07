import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import dayjs from "dayjs";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(minutes?: number): string {
  if (!minutes) return "-";
  if (minutes < 60) return `${Math.round(minutes)} 分钟`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours} 小时 ${mins} 分` : `${hours} 小时`;
}

export function formatDate(date: Date | string): string {
  return dayjs(date).format("YYYY-MM-DD HH:mm");
}

export function formatDateShort(date: Date | string): string {
  return dayjs(date).format("MM-DD HH:mm");
}

export function generateOrderNo(): string {
  const now = dayjs();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `WO${now.format("YYYYMMDD")}${random}`;
}

export function isWorkHoliday(date: Date): boolean {
  const d = dayjs(date);
  const day = d.day();
  if (day === 0 || day === 6) return true;

  const holidays = [
    "2026-01-01",
    "2026-02-17",
    "2026-02-18",
    "2026-02-19",
    "2026-04-06",
    "2026-05-01",
    "2026-05-02",
    "2026-05-03",
    "2026-06-19",
    "2026-06-20",
    "2026-06-21",
    "2026-09-25",
    "2026-09-26",
    "2026-09-27",
    "2026-10-01",
    "2026-10-02",
    "2026-10-03",
    "2026-10-04",
    "2026-10-05",
    "2026-10-06",
    "2026-10-07",
  ];

  return holidays.includes(d.format("YYYY-MM-DD"));
}

export function calculateResponseTime(
  createdAt: Date,
  respondedAt?: Date
): number | undefined {
  if (!respondedAt) return undefined;
  return dayjs(respondedAt).diff(dayjs(createdAt), "minute");
}

export function getRatingColor(rating: number): string {
  if (rating >= 4) return "text-green-600";
  if (rating >= 3) return "text-yellow-600";
  return "text-red-600";
}

export function maskTenantName(name: string): string {
  if (name.length <= 1) return name;
  if (name.length === 2) return name[0] + "*";
  return name[0] + "*".repeat(name.length - 2) + name[name.length - 1];
}

export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          if (typeof value === "string" && value.includes(",")) {
            return `"${value}"`;
          }
          return value;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob(["\ufeff" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
}
