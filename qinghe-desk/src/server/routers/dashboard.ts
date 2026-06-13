import { createTRPCRouter, publicProcedure } from "@/trpc/server";
import { prisma } from "@/lib/prisma";

export const dashboardRouter = createTRPCRouter({
  stats: publicProcedure.query(async () => {
    const [receivable, received, pendingRepairs, openAnomalies] = await Promise.all([
      prisma.bill.aggregate({ where: { status: "PENDING" }, _sum: { totalAmount: true } }),
      prisma.bill.aggregate({ where: { status: "PAID" }, _sum: { totalAmount: true } }),
      prisma.repair.count({ where: { status: { in: ["PENDING", "IN_PROGRESS"] } } }),
      prisma.anomaly.count({ where: { status: "OPEN" } }),
    ]);
    return {
      receivable: receivable._sum.totalAmount ?? 0,
      received: received._sum.totalAmount ?? 0,
      pendingRepairs,
      openAnomalies,
    };
  }),

  todos: publicProcedure.query(async () => {
    const [pendingServices, overdueBills, pendingRepairs] = await Promise.all([
      prisma.serviceRequest.findMany({
        where: { status: "PENDING" },
        include: { tenant: true },
        orderBy: { createdAt: "asc" },
        take: 10,
      }),
      prisma.bill.findMany({
        where: { status: "PENDING", dueDate: { lt: new Date() } },
        include: { tenant: true },
        orderBy: { dueDate: "asc" },
        take: 10,
      }),
      prisma.repair.findMany({
        where: { status: { in: ["PENDING", "IN_PROGRESS"] } },
        include: { tenant: true, room: { include: { building: true } } },
        orderBy: { createdAt: "asc" },
        take: 10,
      }),
    ]);
    return { pendingServices, overdueBills, pendingRepairs };
  }),

  activities: publicProcedure.query(async () => {
    const logs = await prisma.auditLog.findMany({
      include: { operator: true },
      orderBy: { operatedAt: "desc" },
      take: 20,
    });
    return logs;
  }),
});
