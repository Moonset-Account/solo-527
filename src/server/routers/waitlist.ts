import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "../trpc";

function maskMinorName(name: string, isMinor: boolean): string {
  if (!isMinor) return name;
  return name.charAt(0) + "**";
}

export const waitlistRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        courseId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const entries = await ctx.prisma.waitlistEntry.findMany({
        where: { courseId: input.courseId },
        include: {
          student: true,
          course: true,
          campus: true,
        },
        orderBy: [{ status: "asc" }, { position: "asc" }],
      });

      const adults = entries.filter((e) => !e.student.isMinor).map((entry) => ({
        id: entry.id,
        studentId: entry.studentId,
        studentName: entry.student.name,
        isMinor: false,
        courseId: entry.courseId,
        courseName: entry.course.name,
        campusId: entry.campusId,
        campusName: entry.campus.name,
        originalEnrollTime: entry.originalEnrollTime.toISOString(),
        convertedTime: entry.convertedTime?.toISOString() ?? null,
        waitDays:
          entry.status === "waiting" && entry.waitDays === null
            ? Math.floor(
                (Date.now() - entry.originalEnrollTime.getTime()) /
                  (1000 * 60 * 60 * 24),
              )
            : entry.waitDays,
        position: entry.position,
        status: entry.status,
        channel: entry.channel,
        ageGroup: entry.student.ageGroup,
      }));

      const minorAggMap = new Map<string, { ageGroup: string; status: string; count: number }>();
      for (const entry of entries.filter((e) => e.student.isMinor)) {
        const key = `${entry.student.ageGroup}-${entry.status}`;
        const existing = minorAggMap.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          minorAggMap.set(key, { ageGroup: entry.student.ageGroup, status: entry.status, count: 1 });
        }
      }

      const minorAggregates = [...minorAggMap.values()];

      return { adults, minorAggregates };
    }),

  adjust: publicProcedure
    .input(
      z.object({
        entryId: z.string(),
        newPosition: z.number().int().positive(),
        reason: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.$transaction(async (tx) => {
        const entry = await tx.waitlistEntry.findUnique({
          where: { id: input.entryId },
          include: { student: true },
        });

        if (!entry) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "候补记录不存在",
          });
        }

        const oldPosition = entry.position;
        const newPosition = input.newPosition;

        if (oldPosition === newPosition) {
          return {
            id: entry.id,
            studentId: entry.studentId,
            studentName: maskMinorName(entry.student.name, entry.student.isMinor),
            isMinor: entry.student.isMinor,
            courseId: entry.courseId,
            position: entry.position,
            status: entry.status,
            channel: entry.channel,
            originalEnrollTime: entry.originalEnrollTime.toISOString(),
            convertedTime: entry.convertedTime?.toISOString() ?? null,
            waitDays: entry.waitDays,
            campusId: entry.campusId,
            ageGroup: entry.student.ageGroup,
          };
        }

        const siblings = await tx.waitlistEntry.findMany({
          where: {
            courseId: entry.courseId,
            id: { not: entry.id },
            status: "waiting",
          },
          orderBy: { position: "asc" },
        });

        if (newPosition < oldPosition) {
          for (const s of siblings) {
            if (s.position >= newPosition && s.position < oldPosition) {
              await tx.waitlistEntry.update({
                where: { id: s.id },
                data: { position: s.position + 1 },
              });
            }
          }
        } else {
          for (const s of siblings) {
            if (s.position > oldPosition && s.position <= newPosition) {
              await tx.waitlistEntry.update({
                where: { id: s.id },
                data: { position: s.position - 1 },
              });
            }
          }
        }

        const updated = await tx.waitlistEntry.update({
          where: { id: input.entryId },
          data: { position: newPosition },
          include: { student: true },
        });

        const firstUser = await tx.user.findFirst();
        if (!firstUser) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "系统中没有可用的操作用户",
          });
        }

        await tx.waitlistAdjustLog.create({
          data: {
            entryId: input.entryId,
            operatorId: firstUser.id,
            oldPosition,
            newPosition,
            reason: input.reason,
          },
        });

        return {
          id: updated.id,
          studentId: updated.studentId,
          studentName: maskMinorName(updated.student.name, updated.student.isMinor),
          isMinor: updated.student.isMinor,
          courseId: updated.courseId,
          position: updated.position,
          status: updated.status,
          channel: updated.channel,
          originalEnrollTime: updated.originalEnrollTime.toISOString(),
          convertedTime: updated.convertedTime?.toISOString() ?? null,
          waitDays: updated.waitDays,
          campusId: updated.campusId,
          ageGroup: updated.student.ageGroup,
        };
      });
    }),

  convert: publicProcedure
    .input(
      z.object({
        entryId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.$transaction(async (tx) => {
        const entry = await tx.waitlistEntry.findUnique({
          where: { id: input.entryId },
          include: { student: true },
        });

        if (!entry) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "候补记录不存在",
          });
        }

        if (entry.status !== "waiting") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "该候补记录不在等待状态",
          });
        }

        const now = new Date();
        const waitDays = Math.floor(
          (now.getTime() - entry.originalEnrollTime.getTime()) /
            (1000 * 60 * 60 * 24),
        );

        const oldPosition = entry.position;

        const updated = await tx.waitlistEntry.update({
          where: { id: input.entryId },
          data: {
            status: "converted",
            convertedTime: now,
            waitDays,
          },
          include: { student: true },
        });

        const laterSiblings = await tx.waitlistEntry.findMany({
          where: {
            courseId: entry.courseId,
            status: "waiting",
            position: { gt: oldPosition },
          },
        });

        for (const s of laterSiblings) {
          await tx.waitlistEntry.update({
            where: { id: s.id },
            data: { position: s.position - 1 },
          });
        }

        return {
          id: updated.id,
          studentId: updated.studentId,
          studentName: maskMinorName(updated.student.name, updated.student.isMinor),
          isMinor: updated.student.isMinor,
          courseId: updated.courseId,
          position: updated.position,
          status: updated.status,
          channel: updated.channel,
          originalEnrollTime: updated.originalEnrollTime.toISOString(),
          convertedTime: updated.convertedTime?.toISOString() ?? null,
          waitDays: updated.waitDays,
          campusId: updated.campusId,
          ageGroup: updated.student.ageGroup,
        };
      });
    }),

  history: publicProcedure
    .input(
      z.object({
        courseId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const logs = await ctx.prisma.waitlistAdjustLog.findMany({
        where: {
          entry: {
            courseId: input.courseId,
          },
        },
        include: {
          operator: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return logs.map((log) => ({
        id: log.id,
        entryId: log.entryId,
        oldPosition: log.oldPosition,
        newPosition: log.newPosition,
        reason: log.reason,
        operator: log.operator.name,
        createdAt: log.createdAt.toISOString(),
      }));
    }),
});
