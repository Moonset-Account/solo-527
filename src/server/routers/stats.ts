import { z } from "zod";
import { createTRPCRouter, supervisorProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";

export const statsRouter = createTRPCRouter({
  getDashboard: supervisorProcedure.query(async () => {
    const SLA_FIRST_RESPONSE = 240;
    const SLA_RESOLUTION = 1440;

    const [
      totalFeedbacks,
      closedFeedbacks,
      pendingTodos,
      avgResponseTime,
      avgResolutionTime,
      recentFeedbacks,
      feedbacksByCategory,
      firstResponseRecords,
      resolutionRecords,
      totalKnowledgeHits,
      helpfulKnowledgeHits,
    ] = await Promise.all([
      prisma.feedback.count(),
      prisma.feedback.count({ where: { status: "CLOSED" } }),
      prisma.todo.count({ where: { status: "PENDING" } }),
      prisma.responseTimeRecord.aggregate({
        _avg: { responseMinutes: true },
        where: { type: "FIRST_RESPONSE" },
      }),
      prisma.responseTimeRecord.aggregate({
        _avg: { responseMinutes: true },
        where: { type: "FULL_RESOLUTION" },
      }),
      prisma.feedback.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { name: true } },
          assignee: { select: { name: true } },
        },
      }),
      prisma.feedback.groupBy({
        by: ["category"],
        _count: { id: true },
      }),
      prisma.responseTimeRecord.findMany({
        where: { type: "FIRST_RESPONSE" },
        select: { responseMinutes: true },
      }),
      prisma.responseTimeRecord.findMany({
        where: { type: "FULL_RESOLUTION" },
        select: { responseMinutes: true },
      }),
      prisma.knowledgeHit.count(),
      prisma.knowledgeHit.count({ where: { helpful: true } }),
    ]);

    const firstResponseSlaMet = firstResponseRecords.filter(
      (r) => r.responseMinutes <= SLA_FIRST_RESPONSE
    ).length;
    const resolutionSlaMet = resolutionRecords.filter(
      (r) => r.responseMinutes <= SLA_RESOLUTION
    ).length;

    return {
      totalFeedbacks,
      closedFeedbacks,
      closureRate: totalFeedbacks > 0 ? (closedFeedbacks / totalFeedbacks) * 100 : 0,
      unclosedCount: totalFeedbacks - closedFeedbacks,
      unclosedRate: totalFeedbacks > 0 ? ((totalFeedbacks - closedFeedbacks) / totalFeedbacks) * 100 : 0,
      pendingTodos,
      avgResponseMinutes: avgResponseTime._avg.responseMinutes ?? 0,
      avgResolutionMinutes: avgResolutionTime._avg.responseMinutes ?? 0,
      firstResponseSlaRate: firstResponseRecords.length > 0
        ? (firstResponseSlaMet / firstResponseRecords.length) * 100
        : 0,
      resolutionSlaRate: resolutionRecords.length > 0
        ? (resolutionSlaMet / resolutionRecords.length) * 100
        : 0,
      knowledgeHitRate: totalKnowledgeHits > 0
        ? (helpfulKnowledgeHits / totalKnowledgeHits) * 100
        : 0,
      recentFeedbacks,
      feedbacksByCategory: feedbacksByCategory.map((c) => ({
        category: c.category,
        count: c._count.id,
      })),
    };
  }),

  getResponseTimeHistory: supervisorProcedure
    .query(async () => {
      const records = await prisma.responseTimeRecord.findMany({
        include: {
          feedback: { select: { id: true, title: true } },
        },
        orderBy: { recordedAt: "desc" },
        take: 100,
      });
      return records;
    }),

  getClosureRate: supervisorProcedure.query(async () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const feedbacks = await prisma.feedback.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { status: true, createdAt: true, closedAt: true },
    });

    const byDay: Record<string, { total: number; closed: number }> = {};
    feedbacks.forEach((f) => {
      const day = f.createdAt.toISOString().split("T")[0];
      if (!byDay[day]) byDay[day] = { total: 0, closed: 0 };
      byDay[day].total++;
      if (f.status === "CLOSED") byDay[day].closed++;
    });

    return Object.entries(byDay)
      .map(([date, data]) => ({
        date,
        ...data,
        rate: data.total > 0 ? (data.closed / data.total) * 100 : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }),

  getKnowledgeHitRate: supervisorProcedure.query(async () => {
    const [totalHits, helpfulHits, recentHits] = await Promise.all([
      prisma.knowledgeHit.count(),
      prisma.knowledgeHit.count({ where: { helpful: true } }),
      prisma.knowledgeHit.findMany({
        take: 50,
        orderBy: { createdAt: "desc" },
        include: {
          knowledgeEntry: { select: { id: true, title: true, category: true } },
        },
      }),
    ]);

    return {
      totalHits,
      helpfulHits,
      hitRate: totalHits > 0 ? (helpfulHits / totalHits) * 100 : 0,
      recentHits,
    };
  }),

  getUnclosedStats: supervisorProcedure.query(async () => {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const [
      totalUnclosed,
      pendingCount,
      inProgressCount,
      pendingReviewCount,
      overdue24h,
      overdue48h,
      byUrgency,
      byCategory,
      noNotesCount,
      noResultCount,
      noKnowledgeCount,
      unclosedFeedbacks,
    ] = await Promise.all([
      prisma.feedback.count({ where: { status: { not: "CLOSED" } } }),
      prisma.feedback.count({ where: { status: "PENDING" } }),
      prisma.feedback.count({ where: { status: "IN_PROGRESS" } }),
      prisma.feedback.count({ where: { status: "PENDING_REVIEW" } }),
      prisma.feedback.count({
        where: {
          status: { not: "CLOSED" },
          createdAt: { lt: twentyFourHoursAgo },
          firstResponseAt: null,
        },
      }),
      prisma.feedback.count({
        where: {
          status: { not: "CLOSED" },
          createdAt: { lt: fortyEightHoursAgo },
        },
      }),
      prisma.feedback.groupBy({
        by: ["urgency"],
        where: { status: { not: "CLOSED" } },
        _count: { id: true },
      }),
      prisma.feedback.groupBy({
        by: ["category"],
        where: { status: { not: "CLOSED" } },
        _count: { id: true },
      }),
      prisma.feedback.count({
        where: {
          status: { not: "CLOSED" },
          notes: { none: {} },
        },
      }),
      prisma.feedback.count({
        where: {
          status: { not: "CLOSED" },
          result: null,
        },
      }),
      prisma.feedback.count({
        where: {
          status: { not: "CLOSED" },
          knowledgeEntryId: null,
        },
      }),
      prisma.feedback.findMany({
        where: { status: { not: "CLOSED" } },
        include: {
          customer: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true } },
          _count: { select: { notes: true } },
        },
        orderBy: { createdAt: "asc" },
        take: 20,
      }),
    ]);

    return {
      totalUnclosed,
      pendingCount,
      inProgressCount,
      pendingReviewCount,
      overdue24h,
      overdue48h,
      byUrgency: byUrgency.map((u) => ({ urgency: u.urgency, count: u._count.id })),
      byCategory: byCategory.map((c) => ({ category: c.category, count: c._count.id })),
      missingNotes: noNotesCount,
      missingResult: noResultCount,
      missingKnowledge: noKnowledgeCount,
      oldestFeedbacks: unclosedFeedbacks,
    };
  }),

  getClosureStats: supervisorProcedure
    .input(
      z.object({
        days: z.number().min(1).max(90).default(30),
      })
    )
    .query(async ({ input }) => {
      const startDate = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);

      const feedbacks = await prisma.feedback.findMany({
        where: { createdAt: { gte: startDate } },
        select: {
          id: true,
          status: true,
          createdAt: true,
          closedAt: true,
          firstResponseAt: true,
        },
      });

      const byDay: Record<string, { total: number; closed: number; firstResponse: number[]; resolution: number[] }> = {};

      feedbacks.forEach((f) => {
        const day = f.createdAt.toISOString().split("T")[0];
        if (!byDay[day]) {
          byDay[day] = { total: 0, closed: 0, firstResponse: [], resolution: [] };
        }
        byDay[day].total++;
        if (f.status === "CLOSED") byDay[day].closed++;
        if (f.firstResponseAt) {
          const minutes = Math.round((f.firstResponseAt.getTime() - f.createdAt.getTime()) / 60000);
          byDay[day].firstResponse.push(minutes);
        }
        if (f.closedAt) {
          const minutes = Math.round((f.closedAt.getTime() - f.createdAt.getTime()) / 60000);
          byDay[day].resolution.push(minutes);
        }
      });

      const dailyStats = Object.entries(byDay)
        .map(([date, data]) => ({
          date,
          total: data.total,
          closed: data.closed,
          closureRate: data.total > 0 ? (data.closed / data.total) * 100 : 0,
          avgFirstResponse: data.firstResponse.length
            ? Math.round(data.firstResponse.reduce((a, b) => a + b, 0) / data.firstResponse.length)
            : 0,
          avgResolution: data.resolution.length
            ? Math.round(data.resolution.reduce((a, b) => a + b, 0) / data.resolution.length)
            : 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const totalFeedbacks = feedbacks.length;
      const closedFeedbacks = feedbacks.filter((f) => f.status === "CLOSED").length;
      const avgClosureRate = totalFeedbacks > 0 ? (closedFeedbacks / totalFeedbacks) * 100 : 0;

      const allFirstResponse = feedbacks.filter((f) => f.firstResponseAt).map((f) =>
        Math.round((f.firstResponseAt!.getTime() - f.createdAt.getTime()) / 60000)
      );
      const allResolution = feedbacks.filter((f) => f.closedAt).map((f) =>
        Math.round((f.closedAt!.getTime() - f.createdAt.getTime()) / 60000)
      );

      return {
        dailyStats,
        totalFeedbacks,
        closedFeedbacks,
        avgClosureRate,
        avgFirstResponse: allFirstResponse.length
          ? Math.round(allFirstResponse.reduce((a, b) => a + b, 0) / allFirstResponse.length)
          : 0,
        avgResolution: allResolution.length
          ? Math.round(allResolution.reduce((a, b) => a + b, 0) / allResolution.length)
          : 0,
      };
    }),
});
