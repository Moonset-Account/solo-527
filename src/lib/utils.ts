import { Prisma } from "@prisma/client";

export function generateNo(prefix: string, length = 6): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 2 + length).toUpperCase();
  return `${prefix}${year}${month}${day}${random}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0];
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function addDays(date: Date | string, days: number): Date {
  const d = typeof date === "string" ? new Date(date) : new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function formatCurrency(amount: number): string {
  return `¥${amount.toFixed(2)}`;
}

export function parsePagination(query: URLSearchParams): {
  skip: number;
  take: number;
  page: number;
  pageSize: number;
} {
  const page = parseInt(query.get("page") || "1", 10);
  const pageSize = parseInt(query.get("pageSize") || "20", 10);
  const skip = (page - 1) * pageSize;
  const take = pageSize;
  return { skip, take, page, pageSize };
}

export function buildWhereClause<T extends object>(
  filters: Partial<T>,
  mapping: Record<string, string> = {}
): Prisma.Sql {
  const conditions: string[] = [];
  const values: unknown[] = [];

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;

    const field = mapping[key] || key;

    if (typeof value === "string" && key.includes("search")) {
      conditions.push(`"${field}" LIKE ?`);
      values.push(`%${value}%`);
    } else if (key.includes("startDate") || key.includes("start")) {
      conditions.push(`"${field}" >= ?`);
      values.push(new Date(value as string));
    } else if (key.includes("endDate") || key.includes("end")) {
      conditions.push(`"${field}" <= ?`);
      values.push(new Date(value as string));
    } else if (typeof value === "number" || typeof value === "boolean") {
      conditions.push(`"${field}" = ?`);
      values.push(value);
    } else if (typeof value === "string") {
      conditions.push(`"${field}" = ?`);
      values.push(value);
    }
  });

  if (conditions.length === 0) {
    return Prisma.sql``;
  }

  return Prisma.sql`WHERE ${Prisma.raw(conditions.join(" AND "))} ${Prisma.raw(
    values.map((v) => `'${v}'`).join(", ")
  )}`;
}

export function getPrismaWhereFromFilter(
  filters: Record<string, unknown>
): Record<string, unknown> {
  const where: Record<string, unknown> = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;

    if (key === "search") {
      where.OR = [
        { contactName: { contains: String(value) } },
        { contactPhone: { contains: String(value) } },
        { reservationNo: { contains: String(value) } },
        { village: { contains: String(value) } },
      ];
    } else if (key === "startDate") {
      where.scheduledDate = { ...(where.scheduledDate as object), gte: new Date(value as string) };
    } else if (key === "endDate") {
      where.scheduledDate = { ...(where.scheduledDate as object), lte: new Date(value as string) };
    } else {
      where[key] = value;
    }
  });

  return where;
}
