import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure, superAdminProcedure } from "../trpc";
import { UserRole } from "@prisma/client";
import { logUpdate } from "@/lib/audit-log";

export const userRouter = createTRPCRouter({
  me: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.prisma.user.findUnique({
        where: { id: ctx.userId },
        include: {
          _count: {
            select: {
              repairRequests: true,
              complaints: true,
              refunds: true,
              trades: true,
              listedTrades: true,
              activities: true,
            },
          },
        },
      });
    }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
        studentId: z.string().optional(),
        dormNumber: z.string().optional(),
        roomNumber: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.user.findUnique({
        where: { id: ctx.userId },
      });

      const updated = await ctx.prisma.user.update({
        where: { id: ctx.userId },
        data: input,
      });

      await logUpdate(
        "User",
        ctx.userId,
        ctx.userId,
        existing,
        input,
        `${ctx.user.name} 更新了个人资料`
      );

      return updated;
    }),

  updateRole: superAdminProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.nativeEnum(UserRole),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
      });

      if (!existing) {
        throw new Error("用户不存在");
      }

      const updated = await ctx.prisma.user.update({
        where: { id: input.userId },
        data: { role: input.role },
      });

      await logUpdate(
        "User",
        input.userId,
        ctx.userId,
        existing,
        { role: input.role },
        `${ctx.user.name} 将用户 ${existing.name} 的角色更新为 ${input.role}`
      );

      return updated;
    }),

  list: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
        role: z.nativeEnum(UserRole).optional(),
        dormNumber: z.string().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input.role) where.role = input.role;
      if (input.dormNumber) where.dormNumber = input.dormNumber;
      if (input.search) {
        where.OR = [
          { name: { contains: input.search } },
          { email: { contains: input.search } },
          { studentId: { contains: input.search } },
        ];
      }

      const skip = (input.page - 1) * input.pageSize;
      const take = input.pageSize;

      const [items, total] = await Promise.all([
        ctx.prisma.user.findMany({
          where,
          include: {
            _count: {
              select: {
                repairRequests: true,
                assignedRepairs: true,
                complaints: true,
                refunds: true,
              },
            },
          },
          skip,
          take,
          orderBy: { createdAt: "desc" },
        }),
        ctx.prisma.user.count({ where }),
      ]);

      return {
        items,
        total,
        page: input.page,
        pageSize: input.pageSize,
        totalPages: Math.ceil(total / input.pageSize),
      };
    }),

  getById: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.user.findUnique({
        where: { id: input.id },
        include: {
          repairRequests: {
            take: 10,
            orderBy: { createdAt: "desc" },
          },
          complaints: {
            take: 10,
            orderBy: { createdAt: "desc" },
          },
          refunds: {
            take: 10,
            orderBy: { createdAt: "desc" },
          },
          activities: {
            take: 20,
            orderBy: { createdAt: "desc" },
          },
          auditLogs: {
            take: 20,
            orderBy: { createdAt: "desc" },
          },
          _count: {
            select: {
              repairRequests: true,
              complaints: true,
              refunds: true,
              trades: true,
              activities: true,
            },
          },
        },
      });
    }),

  getActivities: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
        activityType: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = { userId: ctx.userId };
      if (input.activityType) where.activityType = input.activityType;

      const skip = (input.page - 1) * input.pageSize;
      const take = input.pageSize;

      const [items, total, totalPoints] = await Promise.all([
        ctx.prisma.activityParticipation.findMany({
          where,
          include: {
            repairRequest: { select: { id: true, title: true } },
            trade: { select: { id: true, title: true } },
          },
          skip,
          take,
          orderBy: { createdAt: "desc" },
        }),
        ctx.prisma.activityParticipation.count({ where }),
        ctx.prisma.activityParticipation.aggregate({
          where,
          _sum: { points: true },
        }),
      ]);

      return {
        items,
        total,
        totalPoints: totalPoints._sum.points || 0,
        page: input.page,
        pageSize: input.pageSize,
        totalPages: Math.ceil(total / input.pageSize),
      };
    }),
});
