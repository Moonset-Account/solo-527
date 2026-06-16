import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { prisma } from "@/server/db/prisma";

export const statsRouter = createTRPCRouter({
  dashboard: protectedProcedure.query(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      todayWorkOrders,
      pendingQualityChecks,
      passedQualityChecks,
      failedQualityChecks,
      lowStockPartsResult,
      delayedOrders,
      totalVehicles,
      totalParts,
      thisMonthOrders,
      completedOrders,
    ] = await Promise.all([
      prisma.workOrder.count({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
      prisma.qualityCheck.count({
        where: { result: "PENDING" },
      }),
      prisma.qualityCheck.count({
        where: { result: "PASSED", checkedAt: { gte: today } },
      }),
      prisma.qualityCheck.count({
        where: { result: "FAILED" },
      }),
      prisma.$queryRaw<{ count: number }[]>`SELECT COUNT(*)::int as count FROM "Part" WHERE stock <= "minStock"`,
      prisma.workOrder.count({
        where: { status: "DELAYED" },
      }),
      prisma.vehicle.count(),
      prisma.part.count(),
      prisma.workOrder.count({
        where: {
          createdAt: {
            gte: new Date(today.getFullYear(), today.getMonth(), 1),
          },
        },
      }),
      prisma.workOrder.count({
        where: {
          status: "COMPLETED",
          createdAt: {
            gte: new Date(today.getFullYear(), today.getMonth(), 1),
          },
        },
      }),
    ]);

    const lowStockParts = lowStockPartsResult[0]?.count || 0;

    return {
      todayWorkOrders,
      qualityPending: pendingQualityChecks,
      qualityPassed: passedQualityChecks,
      qualityFailed: failedQualityChecks,
      lowStockParts,
      delayedOrders,
      totalVehicles,
      totalParts,
      thisMonthOrders,
      completedOrders,
    };
  }),

  turnover: protectedProcedure
    .input(
      z.object({
        period: z.enum(["week", "month", "quarter"]).default("month"),
      })
    )
    .query(async ({ input }) => {
      const now = new Date();
      let startDate: Date;

      switch (input.period) {
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "quarter":
          startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
          break;
      }

      const outboundRecords = await prisma.inventoryRecord.groupBy({
        by: ["partId"],
        where: {
          type: "OUTBOUND",
          createdAt: { gte: startDate },
        },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 10,
      });

      const partIds = outboundRecords.map((r) => r.partId);
      const parts = await prisma.part.findMany({
        where: { id: { in: partIds } },
        select: { id: true, name: true, code: true },
      });

      const result = outboundRecords.map((record) => {
        const part = parts.find((p) => p.id === record.partId);
        return {
          partId: record.partId,
          partName: part?.name || "未知",
          partCode: part?.code || "",
          quantity: record._sum.quantity || 0,
        };
      });

      return result;
    }),

  todaySchedule: protectedProcedure.query(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const schedules = await prisma.schedule.findMany({
      where: {
        scheduledDate: today,
      },
      orderBy: [{ teamId: "asc" }, { startTime: "asc" }],
      include: {
        workOrder: {
          include: { vehicle: { select: { plateNumber: true, brand: true, model: true } } },
        },
        team: true,
      },
    });

    return schedules;
  }),
});
