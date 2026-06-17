import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  operationsManagerProcedure,
} from "../trpc";
import { prisma } from "@/lib/prisma";

function toLogValue(val: unknown): string {
  if (val instanceof Date) return val.toISOString();
  if (val === null || val === undefined) return "";
  return String(val);
}

export const followUpRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "LOST"]).optional(),
        assigneeId: z.string().optional(),
        patientId: z.string().optional(),
        take: z.number().optional().default(20),
        skip: z.number().optional().default(0),
      })
    )
    .query(async ({ input }) => {
      const { take, skip, ...filters } = input;
      const where: Record<string, unknown> = {};
      if (filters.status) where.status = filters.status;
      if (filters.assigneeId) where.assigneeId = filters.assigneeId;
      if (filters.patientId) where.patientId = filters.patientId;

      const [items, total] = await Promise.all([
        prisma.followUpTask.findMany({
          where,
          take,
          skip,
          orderBy: { createdAt: "desc" },
          include: { patient: true, medicalRecord: true },
        }),
        prisma.followUpTask.count({ where }),
      ]);
      return { items, total };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return prisma.followUpTask.findUnique({
        where: { id: input.id },
        include: {
          patient: true,
          medicalRecord: true,
          followUpRecords: { orderBy: { createdAt: "desc" } },
        },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        patientId: z.string(),
        medicalRecordId: z.string(),
        assigneeId: z.string().optional(),
        dueDate: z.date(),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.followUpTask.create({ data: input });
    }),

  assign: operationsManagerProcedure
    .input(z.object({ id: z.string(), assigneeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const old = await prisma.followUpTask.findUnique({
        where: { id: input.id },
      });
      if (!old) throw new Error("FollowUpTask not found");

      const updated = await prisma.followUpTask.update({
        where: { id: input.id },
        data: { assigneeId: input.assigneeId },
      });

      if (toLogValue(old.assigneeId) !== toLogValue(input.assigneeId)) {
        await prisma.auditLog.create({
          data: {
            entityType: "FollowUpTask",
            entityId: input.id,
            fieldName: "assigneeId",
            oldValue: toLogValue(old.assigneeId),
            newValue: toLogValue(input.assigneeId),
            operatorId: ctx.auth.userId!,
          },
        });
      }

      return updated;
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "LOST"]),
        qualityScore: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const old = await prisma.followUpTask.findUnique({
        where: { id: input.id },
      });
      if (!old) throw new Error("FollowUpTask not found");

      const data: Record<string, unknown> = { status: input.status };
      if (input.qualityScore !== undefined) data.qualityScore = input.qualityScore;
      if (input.status === "COMPLETED") data.completedAt = new Date();

      const updated = await prisma.followUpTask.update({
        where: { id: input.id },
        data,
      });

      const changes: [string, unknown][] = [];
      if (toLogValue(old.status) !== toLogValue(input.status)) {
        changes.push(["status", input.status]);
      }
      if (
        input.qualityScore !== undefined &&
        toLogValue(old.qualityScore) !== toLogValue(input.qualityScore)
      ) {
        changes.push(["qualityScore", input.qualityScore]);
      }
      if (input.status === "COMPLETED" && old.completedAt === null) {
        changes.push(["completedAt", data.completedAt]);
      }

      if (changes.length > 0) {
        await Promise.all(
          changes.map(([fieldName, newValue]) =>
            prisma.auditLog.create({
              data: {
                entityType: "FollowUpTask",
                entityId: input.id,
                fieldName,
                oldValue: toLogValue(
                  old[fieldName as keyof typeof old]
                ),
                newValue: toLogValue(newValue),
                operatorId: ctx.auth.userId!,
              },
            })
          )
        );
      }

      return updated;
    }),

  addRecord: protectedProcedure
    .input(
      z.object({
        followUpTaskId: z.string(),
        content: z.string(),
        patientFeedback: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return prisma.followUpRecord.create({
        data: {
          followUpTaskId: input.followUpTaskId,
          operatorId: ctx.auth.userId!,
          content: input.content,
          patientFeedback: input.patientFeedback ?? "",
        },
      });
    }),

  getConflicts: publicProcedure.query(async () => {
    return prisma.appointment.findMany({
      where: { status: "CONFLICT" },
      include: { patient: true },
      orderBy: { appointmentDate: "asc" },
    });
  }),

  resolveConflict: operationsManagerProcedure
    .input(
      z.object({
        appointmentId: z.string(),
        newDate: z.date(),
        newTimeSlot: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const old = await prisma.appointment.findUnique({
        where: { id: input.appointmentId },
      });
      if (!old) throw new Error("Appointment not found");

      const updated = await prisma.appointment.update({
        where: { id: input.appointmentId },
        data: {
          appointmentDate: input.newDate,
          timeSlot: input.newTimeSlot,
          status: "RESCHEDULED",
        },
      });

      const changes: [string, unknown][] = [];

      if (
        toLogValue(old.appointmentDate) !== toLogValue(input.newDate)
      ) {
        changes.push(["appointmentDate", input.newDate]);
      }
      if (toLogValue(old.timeSlot) !== toLogValue(input.newTimeSlot)) {
        changes.push(["timeSlot", input.newTimeSlot]);
      }
      if (toLogValue(old.status) !== toLogValue("RESCHEDULED")) {
        changes.push(["status", "RESCHEDULED"]);
      }

      if (changes.length > 0) {
        await Promise.all(
          changes.map(([fieldName, newValue]) =>
            prisma.auditLog.create({
              data: {
                entityType: "Appointment",
                entityId: input.appointmentId,
                fieldName,
                oldValue: toLogValue(
                  old[fieldName as keyof typeof old]
                ),
                newValue: toLogValue(newValue),
                operatorId: ctx.auth.userId!,
              },
            })
          )
        );
      }

      return updated;
    }),

  getDashboardStats: publicProcedure.query(async () => {
    const [pendingCount, inProgressCount, completedCount, total, conflictCount] =
      await Promise.all([
        prisma.followUpTask.count({ where: { status: "PENDING" } }),
        prisma.followUpTask.count({ where: { status: "IN_PROGRESS" } }),
        prisma.followUpTask.count({ where: { status: "COMPLETED" } }),
        prisma.followUpTask.count(),
        prisma.appointment.count({ where: { status: "CONFLICT" } }),
      ]);

    const completionRate = total > 0 ? completedCount / total : 0;

    return {
      pendingCount,
      inProgressCount,
      completedCount,
      conflictCount,
      completionRate,
    };
  }),
});
