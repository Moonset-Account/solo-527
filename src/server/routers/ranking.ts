import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { calculateWaitDays, getSuggestion } from "@/lib/utils";
import { LOW_SAMPLE_THRESHOLD } from "@/lib/constants";

type SortBy = "waitlist" | "conversionRate" | "waitDays";
type Suggestion = "urgent" | "recommended" | "normal";

interface CourseRanking {
  courseId: string;
  courseName: string;
  campusName: string;
  waitlistCount: number;
  convertedCount: number;
  conversionRate: number;
  avgWaitDays: number;
  classCapacity: number;
  suggestion: Suggestion;
  lowSample: boolean;
}

function sortByField(items: CourseRanking[], sortBy: SortBy): CourseRanking[] {
  const sorted = [...items];
  switch (sortBy) {
    case "waitlist":
      return sorted.sort((a, b) => b.waitlistCount - a.waitlistCount);
    case "conversionRate":
      return sorted.sort((a, b) => b.conversionRate - a.conversionRate);
    case "waitDays":
      return sorted.sort((a, b) => b.avgWaitDays - a.avgWaitDays);
    default:
      return sorted;
  }
}

export const rankingRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        sortBy: z.enum(["waitlist", "conversionRate", "waitDays"]).default("waitlist"),
        campusIds: z.array(z.string()).optional(),
        courseIds: z.array(z.string()).optional(),
        ageGroups: z.array(z.string()).optional(),
        channels: z.array(z.string()).optional(),
        dateRange: z
          .object({
            start: z.date(),
            end: z.date(),
          })
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { sortBy, campusIds, courseIds, ageGroups, channels, dateRange } = input;

      const courseWhere = {
        ...(campusIds?.length && { campusId: { in: campusIds } }),
        ...(courseIds?.length && { id: { in: courseIds } }),
        ...(ageGroups?.length && { ageGroup: { in: ageGroups } }),
      };

      const courses = await ctx.prisma.course.findMany({
        where: courseWhere,
        include: { campus: true },
      });

      const rankings = await Promise.all(
        courses.map(async (course) => {
          const entryWhere = {
            courseId: course.id,
            ...(channels?.length && { channel: { in: channels } }),
            ...(dateRange && {
              originalEnrollTime: {
                gte: dateRange.start,
                lte: dateRange.end,
              },
            }),
          };

          const [waitlistCount, convertedCount, waitingEntries] =
            await Promise.all([
              ctx.prisma.waitlistEntry.count({ where: entryWhere }),
              ctx.prisma.waitlistEntry.count({
                where: { ...entryWhere, status: "converted" },
              }),
              ctx.prisma.waitlistEntry.findMany({
                where: { ...entryWhere, status: "waiting" },
                select: { originalEnrollTime: true },
              }),
            ]);

          const avgWaitDays =
            waitingEntries.length > 0
              ? waitingEntries.reduce(
                  (sum, e) => sum + calculateWaitDays(e.originalEnrollTime),
                  0,
                ) / waitingEntries.length
              : 0;

          return {
            courseId: course.id,
            courseName: course.name,
            campusName: course.campus.name,
            waitlistCount,
            convertedCount,
            conversionRate:
              waitlistCount > 0
                ? Math.round((convertedCount / waitlistCount) * 1000) / 1000
                : 0,
            avgWaitDays: Math.round(avgWaitDays * 10) / 10,
            classCapacity: course.capacity,
            suggestion: getSuggestion(waitlistCount, course.capacity),
            lowSample: waitlistCount < LOW_SAMPLE_THRESHOLD,
          } satisfies CourseRanking;
        }),
      );

      const filtered = rankings.filter(
        (r) => r.waitlistCount >= LOW_SAMPLE_THRESHOLD,
      );

      return sortByField(filtered, sortBy);
    }),
});
