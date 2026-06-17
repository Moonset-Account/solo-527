import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";

export const reportRouter = createTRPCRouter({
  getFollowUpRate: publicProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      const where: Record<string, unknown> = {};
      if (input.startDate || input.endDate) {
        const createdAt: Record<string, Date> = {};
        if (input.startDate) createdAt.gte = input.startDate;
        if (input.endDate) createdAt.lte = input.endDate;
        where.createdAt = createdAt;
      }

      const [total, completed] = await Promise.all([
        prisma.followUpTask.count({ where }),
        prisma.followUpTask.count({
          where: { ...where, status: "COMPLETED" },
        }),
      ]);

      const rate = total > 0 ? completed / total : 0;

      return { total, completed, rate };
    }),

  getFollowUpRateTrend: publicProcedure.query(async () => {
    const tasks = await prisma.followUpTask.findMany({
      select: { createdAt: true, status: true },
      orderBy: { createdAt: "asc" },
    });

    const monthlyData: Record<
      string,
      { total: number; completed: number }
    > = {};

    for (const task of tasks) {
      const month = task.createdAt.toISOString().slice(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { total: 0, completed: 0 };
      }
      monthlyData[month].total++;
      if (task.status === "COMPLETED") {
        monthlyData[month].completed++;
      }
    }

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        rate: data.total > 0 ? data.completed / data.total : 0,
      }));
  }),

  getFollowUpRateByDoctor: publicProcedure.query(async () => {
    const tasks = await prisma.followUpTask.findMany({
      include: {
        medicalRecord: { select: { doctorId: true } },
      },
    });

    const byDoctor: Record<
      string,
      { total: number; completed: number }
    > = {};

    for (const task of tasks) {
      const doctorId = task.medicalRecord.doctorId;
      if (!byDoctor[doctorId]) {
        byDoctor[doctorId] = { total: 0, completed: 0 };
      }
      byDoctor[doctorId].total++;
      if (task.status === "COMPLETED") {
        byDoctor[doctorId].completed++;
      }
    }

    return Object.entries(byDoctor).map(([doctorId, data]) => ({
      doctorId,
      total: data.total,
      completed: data.completed,
      rate: data.total > 0 ? data.completed / data.total : 0,
    }));
  }),
});
