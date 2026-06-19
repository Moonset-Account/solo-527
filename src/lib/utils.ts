import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDateTime(date: Date | string | null | undefined) {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function truncate(str: string | null | undefined, n = 30) {
  if (!str) return "-";
  return str.length > n ? str.slice(0, n - 1) + "…" : str;
}

export function safeParseJson<T>(data: unknown, fallback?: T): T | undefined {
  if (typeof data === "string") {
    try {
      return JSON.parse(data) as T;
    } catch {
      return fallback;
    }
  }
  return (data as T) ?? fallback;
}

export function downloadCSV(filename: string, rows: Record<string, unknown>[], headers: { key: string; label: string }[]) {
  const bom = "\uFEFF";
  const headerRow = headers.map(h => `"${h.label.replace(/"/g, '""')}"`).join(",");
  const dataRows = rows.map(row =>
    headers.map(h => {
      const val = row[h.key];
      const str = val == null ? "" : String(val);
      return `"${str.replace(/"/g, '""').replace(/\n/g, " ")}"`;
    }).join(",")
  );
  const csv = bom + [headerRow, ...dataRows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function buildDownloadFileName(base: string) {
  const now = new Date();
  const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
  return `${base}_${ts}.csv`;
}
