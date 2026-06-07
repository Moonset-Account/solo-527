import { z } from "zod";
import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { maskName } from "@/lib/utils";
import { LOW_SAMPLE_THRESHOLD } from "@/lib/constants";

const EXPORT_DIR = "/tmp/waitlist-exports";

function ensureExportDir() {
  if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR, { recursive: true });
  }
}

const funnelFilterSchema = z.object({
  campusIds: z.array(z.string()).optional(),
  courseIds: z.array(z.string()).optional(),
  ageGroups: z.array(z.string()).optional(),
  channels: z.array(z.string()).optional(),
  dateRange: z
    .object({
      start: z.date(),
      end: z.date(),
    })
    .optional(),
});

async function buildFunnelSheet(ctx: { prisma: import("@prisma/client").PrismaClient }, filters?: z.infer<typeof funnelFilterSchema>) {
  const enrollmentWhere: Record<string, unknown> = { isDuplicate: false };
  const waitlistWhere: Record<string, unknown> = {};

  if (filters?.campusIds?.length) {
    enrollmentWhere.campusId = { in: filters.campusIds };
    waitlistWhere.campusId = { in: filters.campusIds };
  }
  if (filters?.courseIds?.length) {
    enrollmentWhere.courseId = { in: filters.courseIds };
    waitlistWhere.courseId = { in: filters.courseIds };
  }
  if (filters?.channels?.length) {
    enrollmentWhere.channel = { in: filters.channels };
    waitlistWhere.channel = { in: filters.channels };
  }
  if (filters?.dateRange) {
    enrollmentWhere.enrollTime = { gte: filters.dateRange.start, lte: filters.dateRange.end };
    waitlistWhere.createdAt = { gte: filters.dateRange.start, lte: filters.dateRange.end };
  }
  if (filters?.ageGroups?.length) {
    enrollmentWhere.student = { ageGroup: { in: filters.ageGroups } };
    waitlistWhere.student = { ageGroup: { in: filters.ageGroups } };
  }

  const [browseCount, inquiryCount, enrollCount, waitlistCount, convertedCount, refundCount] = await Promise.all([
    ctx.prisma.enrollment.count({ where: enrollmentWhere }),
    ctx.prisma.enrollment.count({ where: { ...enrollmentWhere, channel: { not: "" } } }),
    ctx.prisma.enrollment.count({ where: { ...enrollmentWhere, status: "enrolled" } }),
    ctx.prisma.waitlistEntry.count({ where: waitlistWhere }),
    ctx.prisma.waitlistEntry.count({ where: { ...waitlistWhere, status: "converted" } }),
    ctx.prisma.refundRecord.count({
      where: {
        ...(filters?.campusIds?.length ? { course: { campusId: { in: filters.campusIds } } } : {}),
        ...(filters?.courseIds?.length ? { courseId: { in: filters.courseIds } } : {}),
        ...(filters?.dateRange ? { refundTime: { gte: filters.dateRange.start, lte: filters.dateRange.end } } : {}),
      },
    }),
  ]);

  const stages = [
    { 阶段: "浏览", 人数: browseCount, 转化率: browseCount > 0 ? "100%" : "0%" },
    { 阶段: "咨询", 人数: inquiryCount, 转化率: browseCount > 0 ? `${((inquiryCount / browseCount) * 100).toFixed(1)}%` : "0%" },
    { 阶段: "报名", 人数: enrollCount, 转化率: inquiryCount > 0 ? `${((enrollCount / inquiryCount) * 100).toFixed(1)}%` : "0%" },
    { 阶段: "候补", 人数: waitlistCount, 转化率: enrollCount > 0 ? `${((waitlistCount / enrollCount) * 100).toFixed(1)}%` : "0%" },
    { 阶段: "转正", 人数: convertedCount, 转化率: waitlistCount > 0 ? `${((convertedCount / waitlistCount) * 100).toFixed(1)}%` : "0%" },
    { 阶段: "退费", 人数: refundCount, 转化率: enrollCount > 0 ? `${((refundCount / enrollCount) * 100).toFixed(1)}%` : "0%" },
  ];

  return stages;
}

async function buildWaitlistSheet(ctx: { prisma: import("@prisma/client").PrismaClient }, filters: z.infer<typeof funnelFilterSchema> | undefined, includeAdjustDiff: boolean) {
  const where: Record<string, unknown> = {};
  if (filters?.campusIds?.length) where.campusId = { in: filters.campusIds };
  if (filters?.courseIds?.length) where.courseId = { in: filters.courseIds };
  if (filters?.channels?.length) where.channel = { in: filters.channels };
  if (filters?.dateRange) where.originalEnrollTime = { gte: filters.dateRange.start, lte: filters.dateRange.end };
  if (filters?.ageGroups?.length) where.student = { ageGroup: { in: filters.ageGroups } };

  const entries = await ctx.prisma.waitlistEntry.findMany({
    where,
    include: { student: true, course: true, campus: true },
    orderBy: { position: "asc" },
  });

  const rows = await Promise.all(
    entries.map(async (entry) => {
      const displayName = entry.student.isMinor ? maskName(entry.student.name) : entry.student.name;
      const waitDays = entry.waitDays ?? Math.floor((Date.now() - new Date(entry.originalEnrollTime).getTime()) / (1000 * 60 * 60 * 24));

      const row: Record<string, unknown> = {
        排位: entry.position,
        学生姓名: displayName,
        课程: entry.course.name,
        校区: entry.campus.name,
        年龄段: entry.student.ageGroup,
        渠道: entry.channel,
        原报名时间: format(new Date(entry.originalEnrollTime), "yyyy-MM-dd HH:mm"),
        等待天数: waitDays,
        状态: entry.status,
      };

      if (includeAdjustDiff) {
        const latestLog = await ctx.prisma.waitlistAdjustLog.findFirst({
          where: { entryId: entry.id },
          orderBy: { createdAt: "desc" },
        });
        row.调整前排名 = latestLog?.oldPosition ?? "";
        row.调整后排名 = latestLog?.newPosition ?? "";
        row.调整原因 = latestLog?.reason ?? "";
      }

      return row;
    }),
  );

  return rows;
}

async function buildRankingSheet(ctx: { prisma: import("@prisma/client").PrismaClient }, filters: z.infer<typeof funnelFilterSchema> | undefined) {
  const courseWhere: Record<string, unknown> = {};
  if (filters?.campusIds?.length) courseWhere.campusId = { in: filters.campusIds };
  if (filters?.courseIds?.length) courseWhere.id = { in: filters.courseIds };
  if (filters?.ageGroups?.length) courseWhere.ageGroup = { in: filters.ageGroups };

  const courses = await ctx.prisma.course.findMany({
    where: courseWhere,
    include: { campus: true, waitlistEntries: true },
  });

  const courseStats = await Promise.all(
    courses.map(async (course) => {
      const waitlistEntries = course.waitlistEntries;
      const waitlistCount = waitlistEntries.filter((e) => e.status === "waiting").length;
      const convertedCount = waitlistEntries.filter((e) => e.status === "converted").length;
      const conversionRate = waitlistEntries.length > 0 ? convertedCount / waitlistEntries.length : 0;

      const totalWaitDays = waitlistEntries.reduce((sum, e) => {
        const days = e.waitDays ?? Math.floor((Date.now() - new Date(e.originalEnrollTime).getTime()) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0);
      const avgWaitDays = waitlistEntries.length > 0 ? Math.round(totalWaitDays / waitlistEntries.length) : 0;

      const isLowSample = waitlistCount < LOW_SAMPLE_THRESHOLD;
      const ratio = course.capacity > 0 ? waitlistCount / course.capacity : 0;
      let suggestion = "正常";
      if (ratio >= 0.8) suggestion = "急需加开";
      else if (ratio >= 0.5) suggestion = "建议加开";

      return {
        courseName: course.name,
        campusName: course.campus.name,
        waitlistCount,
        classCapacity: course.capacity,
        conversionRate,
        avgWaitDays,
        suggestion,
        isLowSample,
      };
    }),
  );

  const normalRows = courseStats
    .filter((s) => !s.isLowSample)
    .sort((a, b) => b.waitlistCount - a.waitlistCount)
    .map((s, idx) => ({
      排名: idx + 1,
      课程名称: s.courseName,
      所属校区: s.campusName,
      候补人数: s.waitlistCount,
      班级容量: s.classCapacity,
      转正率: `${(s.conversionRate * 100).toFixed(1)}%`,
      平均等待天数: s.avgWaitDays,
      加开建议: s.suggestion,
    }));

  const lowSampleRows = courseStats
    .filter((s) => s.isLowSample)
    .map((s) => ({
      排名: "-",
      课程名称: `${s.courseName}（样本不足）`,
      所属校区: s.campusName,
      候补人数: s.waitlistCount,
      班级容量: s.classCapacity,
      转正率: `${(s.conversionRate * 100).toFixed(1)}%`,
      平均等待天数: s.avgWaitDays,
      加开建议: s.suggestion,
    }));

  return [...normalRows, ...lowSampleRows];
}

async function buildAdjustHistorySheet(ctx: { prisma: import("@prisma/client").PrismaClient }, filters: z.infer<typeof funnelFilterSchema> | undefined, includeAdjustDiff: boolean) {
  const where: Record<string, unknown> = {};
  if (filters?.campusIds?.length) where.entry = { campusId: { in: filters.campusIds } };
  if (filters?.courseIds?.length) where.entry = { ...(where.entry as Record<string, unknown>), courseId: { in: filters.courseIds } };
  if (filters?.dateRange) where.createdAt = { gte: filters.dateRange.start, lte: filters.dateRange.end };

  const logs = await ctx.prisma.waitlistAdjustLog.findMany({
    where,
    include: { entry: { include: { student: true, course: true } }, operator: true },
    orderBy: { createdAt: "desc" },
  });

  return logs.map((log) => {
    const displayName = log.entry.student.isMinor ? maskName(log.entry.student.name) : log.entry.student.name;

    const row: Record<string, unknown> = {
      调整时间: format(new Date(log.createdAt), "yyyy-MM-dd HH:mm"),
      操作人: log.operator.name,
      学生姓名: displayName,
      课程: log.entry.course.name,
      调整前排名: log.oldPosition,
      调整后排名: log.newPosition,
      调整原因: log.reason,
    };

    if (includeAdjustDiff) {
      row.排位变化 = `第${log.oldPosition}位 → 第${log.newPosition}位`;
    }

    return row;
  });
}

function saveFile(data: Record<string, unknown>[], fmt: "xlsx" | "csv", filename: string): string {
  ensureExportDir();
  const filePath = path.join(EXPORT_DIR, filename);

  if (fmt === "csv") {
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    fs.writeFileSync(filePath, csv, "utf-8");
  } else {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    fs.writeFileSync(filePath, buf);
  }

  return filePath;
}

export const exportRouter = createTRPCRouter({
  generate: publicProcedure
    .input(
      z.object({
        type: z.enum(["funnel", "waitlist", "ranking", "adjustHistory"]),
        filters: funnelFilterSchema.optional(),
        includeAdjustDiff: z.boolean().default(false),
        format: z.enum(["xlsx", "csv"]).default("xlsx"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const timestamp = Date.now();
      const typeLabel: Record<string, string> = {
        funnel: "funnel",
        waitlist: "waitlist",
        ranking: "ranking",
        adjustHistory: "adjust_history",
      };

      let data: Record<string, unknown>[];

      switch (input.type) {
        case "funnel":
          data = await buildFunnelSheet(ctx, input.filters);
          break;
        case "waitlist":
          data = await buildWaitlistSheet(ctx, input.filters, input.includeAdjustDiff);
          break;
        case "ranking":
          data = await buildRankingSheet(ctx, input.filters);
          break;
        case "adjustHistory":
          data = await buildAdjustHistorySheet(ctx, input.filters, input.includeAdjustDiff);
          break;
      }

      const filename = `${typeLabel[input.type]}_${timestamp}.${input.format}`;
      saveFile(data, input.format, filename);

      return { downloadUrl: `/api/export/${filename}` };
    }),
});
