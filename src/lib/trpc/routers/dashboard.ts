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
          .optional(),
      })
    )
    .query(async () => {
      return generateDashboardMetrics();
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
        teamIds: z.array(z.string()).optional(),
      })
    )
    .query(async () => {
      return generateTeamWorkload();
    }),

  getTimeoutTrend: protectedProcedure
    .input(
      z.object({
        days: z.number().default(7),
        teamIds: z.array(z.string()).optional(),
      })
    )
    .query(async ({ input }) => {
      return generateTimeoutTrend(input.days);
    }),

  getTagDistribution: protectedProcedure
    .input(
      z.object({
        dateRange: z
          .object({
            start: z.string(),
            end: z.string(),
          })
          .optional(),
      })
    )
    .query(async () => {
      return generateTagDistribution();
    }),

  getStaffRanking: protectedProcedure
    .input(
      z.object({
        teamIds: z.array(z.string()).optional(),
        includeProbation: z.boolean().default(false),
      })
    )
    .query(async ({ input }) => {
      const ranking = generateStaffRanking();
      if (input.includeProbation) {
        return ranking;
      }
      return ranking.filter((s) => !s.isProbation);
    }),

  getSchedules: protectedProcedure
    .input(
      z.object({
        date: z.string().default(format(new Date(), "yyyy-MM-dd")),
        teamIds: z.array(z.string()).optional(),
      })
    )
    .query(async ({ input }) => {
      const schedules = generateSchedules(input.date);
      if (input.teamIds?.length) {
        return schedules.filter((s) => input.teamIds!.includes(s.staff?.teamId || ""));
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
