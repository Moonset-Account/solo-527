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

export const appointmentRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        doctorId: z.string().optional(),
        date: z.date().optional(),
        status: z
          .enum(["SCHEDULED", "CONFLICT", "RESCHEDULED", "CANCELLED"])
          .optional(),
        take: z.number().optional().default(20),
        skip: z.number().optional().default(0),
      })
    )
    .query(async ({ input }) => {
      const { take, skip, ...filters } = input;
      const where: Record<string, unknown> = {};
      if (filters.doctorId) where.doctorId = filters.doctorId;
      if (filters.status) where.status = filters.status;
      if (filters.date) {
        const startOfDay = new Date(filters.date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(filters.date);
        endOfDay.setHours(23, 59, 59, 999);
        where.appointmentDate = { gte: startOfDay, lt: endOfDay };
      }

      const [items, total] = await Promise.all([
        prisma.appointment.findMany({
          where,
          take,
          skip,
          orderBy: { appointmentDate: "asc" },
          include: { patient: true },
        }),
        prisma.appointment.count({ where }),
      ]);
      return { items, total };
    }),

  create: protectedProcedure
    .input(
      z.object({
        patientId: z.string(),
        doctorId: z.string(),
        appointmentDate: z.date(),
        timeSlot: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.appointment.create({ data: input });
    }),

  update: operationsManagerProcedure
    .input(
      z.object({
        id: z.string(),
        patientId: z.string().optional(),
        doctorId: z.string().optional(),
        appointmentDate: z.date().optional(),
        timeSlot: z.string().optional(),
        status: z
          .enum(["SCHEDULED", "CONFLICT", "RESCHEDULED", "CANCELLED"])
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const old = await prisma.appointment.findUnique({ where: { id } });
      if (!old) throw new Error("Appointment not found");

      const updated = await prisma.appointment.update({
        where: { id },
        data,
      });

      const changes = Object.entries(data).filter(
        ([key, value]) =>
          value !== undefined &&
          toLogValue(old[key as keyof typeof old]) !== toLogValue(value)
      );

      if (changes.length > 0) {
        await Promise.all(
          changes.map(([fieldName, newValue]) =>
            prisma.auditLog.create({
              data: {
                entityType: "Appointment",
                entityId: id,
                fieldName,
                oldValue: toLogValue(old[fieldName as keyof typeof old]),
                newValue: toLogValue(newValue),
                operatorId: ctx.auth.userId!,
              },
            })
          )
        );
      }

      return updated;
    }),

  detectConflicts: publicProcedure
    .input(
      z.object({
        doctorId: z.string(),
        appointmentDate: z.date(),
        timeSlot: z.string(),
      })
    )
    .query(async ({ input }) => {
      const startOfDay = new Date(input.appointmentDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(input.appointmentDate);
      endOfDay.setHours(23, 59, 59, 999);

      return prisma.appointment.findMany({
        where: {
          doctorId: input.doctorId,
          appointmentDate: { gte: startOfDay, lt: endOfDay },
          timeSlot: input.timeSlot,
          status: { in: ["SCHEDULED", "CONFLICT"] },
        },
        include: { patient: true },
      });
    }),
});
