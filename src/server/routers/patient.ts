import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure, operationsManagerProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";

function toLogValue(val: unknown): string {
  if (val instanceof Date) return val.toISOString();
  if (val === null || val === undefined) return "";
  return String(val);
}

export const patientRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        take: z.number().optional().default(20),
        skip: z.number().optional().default(0),
      })
    )
    .query(async ({ input }) => {
      const where = input.search
        ? { name: { contains: input.search, mode: "insensitive" as const } }
        : {};
      const [items, total] = await Promise.all([
        prisma.patient.findMany({
          where,
          take: input.take,
          skip: input.skip,
          orderBy: { createdAt: "desc" },
        }),
        prisma.patient.count({ where }),
      ]);
      return { items, total };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return prisma.patient.findUnique({ where: { id: input.id } });
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        gender: z.enum(["MALE", "FEMALE"]),
        birthDate: z.date(),
        phone: z.string(),
        allergies: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.patient.create({ data: input });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        gender: z.enum(["MALE", "FEMALE"]).optional(),
        birthDate: z.date().optional(),
        phone: z.string().optional(),
        allergies: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const old = await prisma.patient.findUnique({ where: { id } });
      if (!old) throw new Error("Patient not found");

      const updated = await prisma.patient.update({ where: { id }, data });

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
                entityType: "Patient",
                entityId: id,
                fieldName,
                oldValue: toLogValue(old[fieldName as keyof typeof old]),
                newValue: toLogValue(newValue),
                operatorId: ctx.auth.userId ?? "system",
              },
            })
          )
        );
      }

      return updated;
    }),
});
