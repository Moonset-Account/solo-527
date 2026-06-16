import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { prisma } from "@/server/db/prisma";
import { createAuditLog } from "@/server/services/auditLogService";

export const scheduleRouter = createTRPCRouter({
  listByDate: protectedProcedure
    .input(z.object({ date: z.string() }))
    .query(async ({ input }) => {
      const schedules = await prisma.schedule.findMany({
        where: {
          scheduledDate: new Date(input.date),
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

  listByTeam: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ input }) => {
      const schedules = await prisma.schedule.findMany({
        where: {
          teamId: input.teamId,
          scheduledDate: {
            gte: new Date(input.startDate),
            lte: new Date(input.endDate),
          },
        },
        orderBy: [{ scheduledDate: "asc" }, { startTime: "asc" }],
        include: {
          workOrder: {
            include: { vehicle: { select: { plateNumber: true, brand: true, model: true } } },
          },
        },
      });

      return schedules;
    }),

  assign: protectedProcedure
    .input(
      z.object({
        workOrderId: z.string(),
        teamId: z.string(),
        userId: z.string().optional(),
        scheduledDate: z.string(),
        startTime: z.string(),
        endTime: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const schedule = await prisma.schedule.create({
        data: {
          workOrderId: input.workOrderId,
          teamId: input.teamId,
          userId: input.userId,
          scheduledDate: new Date(input.scheduledDate),
          startTime: input.startTime,
          endTime: input.endTime,
        },
      });

      const workOrder = await prisma.workOrder.update({
        where: { id: input.workOrderId },
        data: {
          status: "ASSIGNED",
          assigneeTeam: input.teamId,
          assigneeUserId: input.userId,
        },
      });

      await createAuditLog({
        action: "ASSIGN",
        entityType: "SCHEDULE",
        entityId: schedule.id,
        newValue: { ...input, scheduleId: schedule.id },
        userId: ctx.userId,
        userName: "当前用户",
      });

      return { schedule, workOrder };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        scheduledDate: z.string().optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
        userId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const oldSchedule = await prisma.schedule.findUnique({
        where: { id: input.id },
      });

      if (!oldSchedule) {
        throw new Error("排期不存在");
      }

      const data: Record<string, unknown> = {};
      if (input.scheduledDate) data.scheduledDate = new Date(input.scheduledDate);
      if (input.startTime) data.startTime = input.startTime;
      if (input.endTime) data.endTime = input.endTime;
      if (input.status) data.status = input.status;
      if (input.userId !== undefined) data.userId = input.userId;

      const schedule = await prisma.schedule.update({
        where: { id: input.id },
        data,
      });

      await createAuditLog({
        action: "UPDATE",
        entityType: "SCHEDULE",
        entityId: input.id,
        oldValue: oldSchedule,
        newValue: schedule,
        userId: ctx.userId,
        userName: "当前用户",
      });

      return schedule;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const schedule = await prisma.schedule.findUnique({
        where: { id: input.id },
      });

      if (!schedule) {
        throw new Error("排期不存在");
      }

      await prisma.schedule.delete({
        where: { id: input.id },
      });

      await createAuditLog({
        action: "DELETE",
        entityType: "SCHEDULE",
        entityId: input.id,
        oldValue: schedule,
        userId: ctx.userId,
        userName: "当前用户",
      });

      return true;
    }),

  teams: protectedProcedure.query(async () => {
    const teams = await prisma.team.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
    return teams;
  }),
});
