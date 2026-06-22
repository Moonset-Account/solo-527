import { prisma } from "./prisma";
import * as XLSX from "xlsx";
import type { Prisma } from "@prisma/client";

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  projectId?: string;
  designerId?: string;
  status?: string;
}

export interface MonthlyReportData {
  period: string;
  totalProjects: number;
  completedProjects: number;
  totalBudget: number;
  totalSpent: number;
  totalAddons: number;
  addonAmount: number;
  budgetOverruns: number;
  averageBudgetVariance: number;
  repairsReported: number;
  repairsCompleted: number;
  repairsOverdue: number;
  feedbackCount: number;
  averageRating: number;
}

export async function generateMonthlyReport(
  year: number,
  month: number
): Promise<MonthlyReportData> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const [
    projects,
    budgetChanges,
    repairs,
    feedbacks,
    addons,
  ] = await Promise.all([
    prisma.project.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        status: true,
        initialBudget: true,
        currentBudget: true,
        totalSpent: true,
        budgetVariance: true,
      },
    }),
    prisma.budgetChange.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        changeType: "ADDON_CONFIRMED",
      },
      select: { amount: true },
    }),
    prisma.repair.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: { id: true, status: true },
    }),
    prisma.feedback.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: { rating: true },
    }),
    prisma.addon.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: "CONFIRMED",
      },
      select: { id: true, amount: true },
    }),
  ]);

  const totalBudget = projects.reduce((sum, p) => sum + p.currentBudget.toNumber(), 0);
  const totalSpent = projects.reduce((sum, p) => sum + p.totalSpent.toNumber(), 0);
  const budgetOverruns = projects.filter((p) => p.budgetVariance.toNumber() > 0).length;
  const avgVariance =
    projects.length > 0
      ? projects.reduce((sum, p) => sum + p.budgetVariance.toNumber(), 0) / projects.length
      : 0;

  const ratedFeedbacks = feedbacks.filter((f) => f.rating !== null);
  const avgRating =
    ratedFeedbacks.length > 0
      ? ratedFeedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / ratedFeedbacks.length
      : 0;

  return {
    period: `${year}-${String(month).padStart(2, "0")}`,
    totalProjects: projects.length,
    completedProjects: projects.filter((p) => p.status === "COMPLETED").length,
    totalBudget,
    totalSpent,
    totalAddons: addons.length,
    addonAmount: addons.reduce((sum, a) => sum + a.amount.toNumber(), 0),
    budgetOverruns,
    averageBudgetVariance: avgVariance,
    repairsReported: repairs.length,
    repairsCompleted: repairs.filter((r) => r.status === "COMPLETED").length,
    repairsOverdue: repairs.filter((r) => r.status === "OVERDUE").length,
    feedbackCount: feedbacks.length,
    averageRating: avgRating,
  };
}

export async function generateBudgetChangeReport(filters: ReportFilters) {
  const where: Prisma.BudgetChangeWhereInput = {};

  if (filters.startDate) {
    where.createdAt = { ...where.createdAt, gte: new Date(filters.startDate) };
  }
  if (filters.endDate) {
    where.createdAt = { ...where.createdAt, lte: new Date(filters.endDate) };
  }
  if (filters.projectId) {
    where.projectId = filters.projectId;
  }

  const budgetChanges = await prisma.budgetChange.findMany({
    where,
    include: {
      project: { select: { name: true } },
      createdBy: { select: { name: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const summary = {
    totalChanges: budgetChanges.length,
    totalAmount: budgetChanges.reduce((sum, bc) => sum + bc.amount.toNumber(), 0),
    quoteTotal: budgetChanges
      .filter((bc) => bc.changeType === "QUOTE_CONFIRMED")
      .reduce((sum, bc) => sum + bc.amount.toNumber(), 0),
    addonTotal: budgetChanges
      .filter((bc) => bc.changeType === "ADDON_CONFIRMED")
      .reduce((sum, bc) => sum + bc.amount.toNumber(), 0),
    byProject: {} as Record<string, { count: number; amount: number }>,
  };

  for (const bc of budgetChanges) {
    if (!summary.byProject[bc.projectId]) {
      summary.byProject[bc.projectId] = { count: 0, amount: 0 };
    }
    summary.byProject[bc.projectId].count++;
    summary.byProject[bc.projectId].amount += bc.amount.toNumber();
  }

  return {
    data: budgetChanges,
    summary,
  };
}

export function exportToExcel(data: unknown[], filename: string, sheetName = "Sheet1"): Buffer {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

export function formatForExport(
  data: Array<Record<string, unknown>>,
  columns: { key: string; label: string }[]
): Array<Record<string, unknown>> {
  return data.map((row) => {
    const formattedRow: Record<string, unknown> = {};
    for (const col of columns) {
      let value = row[col.key];
      if (value instanceof Date) {
        value = value.toLocaleString("zh-CN");
      } else if (typeof value === "object" && value !== null) {
        value = JSON.stringify(value);
      }
      formattedRow[col.label] = value;
    }
    return formattedRow;
  });
}
