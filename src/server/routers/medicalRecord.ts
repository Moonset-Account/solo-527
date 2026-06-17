import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";

function toLogValue(val: unknown): string {
  if (val instanceof Date) return val.toISOString();
  if (val === null || val === undefined) return "";
  return String(val);
}

export const medicalRecordRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        patientId: z.string().optional(),
        take: z.number().optional().default(20),
        skip: z.number().optional().default(0),
      })
    )
    .query(async ({ input }) => {
      const where = input.patientId ? { patientId: input.patientId } : {};
      const [items, total] = await Promise.all([
        prisma.medicalRecord.findMany({
          where,
          take: input.take,
          skip: input.skip,
          orderBy: { createdAt: "desc" },
        }),
        prisma.medicalRecord.count({ where }),
      ]);
      return { items, total };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return prisma.medicalRecord.findUnique({ where: { id: input.id } });
    }),

  create: publicProcedure
    .input(
      z.object({
        patientId: z.string(),
        doctorId: z.string(),
        chiefComplaint: z.string(),
        diagnosis: z.string(),
        prescription: z.string(),
        summary: z.string().optional(),
        visitDate: z.date(),
        nextVisitDate: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.medicalRecord.create({ data: input });
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        patientId: z.string().optional(),
        doctorId: z.string().optional(),
        chiefComplaint: z.string().optional(),
        diagnosis: z.string().optional(),
        prescription: z.string().optional(),
        summary: z.string().optional(),
        visitDate: z.date().optional(),
        nextVisitDate: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const old = await prisma.medicalRecord.findUnique({ where: { id } });
      if (!old) throw new Error("MedicalRecord not found");

      const updated = await prisma.medicalRecord.update({
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
                entityType: "MedicalRecord",
                entityId: id,
                fieldName,
                oldValue: toLogValue(old[fieldName as keyof typeof old]),
                newValue: toLogValue(newValue),
                operatorId: "system",
              },
            })
          )
        );
      }

      return updated;
    }),

  getSummary: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const record = await prisma.medicalRecord.findUnique({
        where: { id: input.id },
        select: { summary: true },
      });
      return record?.summary ?? null;
    }),

  updateSummary: publicProcedure
    .input(z.object({ id: z.string(), summary: z.string() }))
    .mutation(async ({ input }) => {
      const old = await prisma.medicalRecord.findUnique({
        where: { id: input.id },
      });
      if (!old) throw new Error("MedicalRecord not found");

      const updated = await prisma.medicalRecord.update({
        where: { id: input.id },
        data: { summary: input.summary },
      });

      if (toLogValue(old.summary) !== toLogValue(input.summary)) {
        await prisma.auditLog.create({
          data: {
            entityType: "MedicalRecord",
            entityId: input.id,
            fieldName: "summary",
            oldValue: toLogValue(old.summary),
            newValue: toLogValue(input.summary),
            operatorId: "system",
          },
        });
      }

      return updated;
    }),
});
