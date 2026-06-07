import { z } from "zod";
import { protectedProcedure, router } from "../server";
import {
  generateDashboardMetrics,
  generateTeamWorkload,
  generateTimeoutTrend,
  generateTagDistribution,
  generateStaffRanking,
  generateSchedules,
  generateScheduleChanges,
  generateLowQualitySessions,
  mockTeams,
  mockStaffs,
} from "@/lib/mock/data";
import { format, startOfDay, endOfDay, subDays } from "date-fns";

export const dashboardRouter = router({
  getMetrics: protectedProcedure
    .input(
      z.object({
        dateRange: z
          .object({
            start: z.string(),
            end: z.string(),
          })
          .optional()
          .nullable(),
        teamIds: z.array(z.string()).optional().nullable(),
      })
    )
    .query(async ({ input }) => {
      return generateDashboardMetrics(
        input.dateRange ?? undefined,
        input.teamIds ?? undefined
      );
    }),

  getTeams: protectedProcedure.query(async () => {
    return mockTeams;
  }),

  getStaffs: protectedProcedure
    .input(
      z.object({
        teamId: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      if (input.teamId) {
        return mockStaffs.filter((s) => s.teamId === input.teamId);
      }
      return mockStaffs;
    }),

  getTeamWorkload: protectedProcedure
    .input(
      z.object({
        date: z.string().default(format(new Date(), "yyyy-MM-dd")),
        teamIds: z.array(z.string()).optional().nullable(),
        dateRange: z
          .object({
            start: z.string(),
            end: z.string(),
          })
          .optional()
          .nullable(),
      })
    )
    .query(async ({ input }) => {
      return generateTeamWorkload(
        input.teamIds ?? undefined,
        input.date,
        input.dateRange ?? undefined
      );
    }),

  getTimeoutTrend: protectedProcedure
    .input(
      z.object({
        days: z.number().default(7),
        teamIds: z.array(z.string()).optional().nullable(),
      })
    )
    .query(async ({ input }) => {
      return generateTimeoutTrend(input.days, input.teamIds ?? undefined);
    }),

  getTagDistribution: protectedProcedure
    .input(
      z.object({
        dateRange: z
          .object({
            start: z.string(),
            end: z.string(),
          })
          .optional()
          .nullable(),
        teamIds: z.array(z.string()).optional().nullable(),
      })
    )
    .query(async ({ input }) => {
      return generateTagDistribution(
        input.dateRange ?? undefined,
        input.teamIds ?? undefined
      );
    }),

  getStaffRanking: protectedProcedure
    .input(
      z.object({
        teamIds: z.array(z.string()).optional().nullable(),
        includeProbation: z.boolean().default(false),
      })
    )
    .query(async ({ input }) => {
      const ranking = generateStaffRanking(input.teamIds ?? undefined);
      if (input.includeProbation) {
        return ranking;
      }
      return ranking.filter((s) => !s.isProbation);
    }),

  getSchedules: protectedProcedure
    .input(
      z.object({
        date: z.string().default(format(new Date(), "yyyy-MM-dd")),
        teamIds: z.array(z.string()).optional().nullable(),
      })
    )
    .query(async ({ input }) => {
      const schedules = generateSchedules(input.date);
      const ids = input.teamIds ?? undefined;
      if (ids?.length) {
        return schedules.filter((s) => ids.includes(s.staff?.teamId || ""));
      }
      return schedules;
    }),

  getScheduleChanges: protectedProcedure.query(async () => {
    return generateScheduleChanges();
  }),

  getLowQualitySessions: protectedProcedure
    .input(
      z.object({
        includeRestricted: z.boolean().default(false),
        threshold: z.number().default(70),
      })
    )
    .query(async ({ input }) => {
      return generateLowQualitySessions(input.includeRestricted);
    }),

  adjustSchedule: protectedProcedure
    .input(
      z.object({
        scheduleId: z.string(),
        startHour: z.number(),
        endHour: z.number(),
        shiftType: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return {
        success: true,
        message: "班次调整成功",
        changeId: `change-${Date.now()}`,
        beforeSnapshot: { startHour: input.startHour - 4, endHour: input.endHour - 4 },
        afterSnapshot: { startHour: input.startHour, endHour: input.endHour, shiftType: input.shiftType },
      };
    }),
});
