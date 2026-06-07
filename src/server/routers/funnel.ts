import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { AGE_GROUPS, CHANNELS, LOW_SAMPLE_THRESHOLD } from "@/lib/constants";

type FunnelStage = "browse" | "inquiry" | "enroll" | "waitlist" | "converted" | "refund";

const STAGE_LABELS: Record<FunnelStage, string> = {
  browse: "浏览",
  inquiry: "咨询",
  enroll: "报名",
  waitlist: "候补",
  converted: "转正",
  refund: "退费",
};

const STAGE_ORDER: FunnelStage[] = ["browse", "inquiry", "enroll", "waitlist", "converted", "refund"];

const funnelFilterSchema = z.object({
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
});

type FilterInput = z.infer<typeof funnelFilterSchema>;

function enrollmentWhere(filter: FilterInput) {
  return {
    isDuplicate: false,
    ...(filter.campusIds?.length ? { campusId: { in: filter.campusIds } } : {}),
    ...(filter.courseIds?.length ? { courseId: { in: filter.courseIds } } : {}),
    ...(filter.ageGroups?.length ? { student: { ageGroup: { in: filter.ageGroups } } } : {}),
    ...(filter.channels?.length ? { channel: { in: filter.channels } } : {}),
    ...(filter.dateRange
      ? { enrollTime: { gte: filter.dateRange.start, lte: filter.dateRange.end } }
      : {}),
  };
}

function waitlistWhere(filter: FilterInput) {
  return {
    ...(filter.campusIds?.length ? { campusId: { in: filter.campusIds } } : {}),
    ...(filter.courseIds?.length ? { courseId: { in: filter.courseIds } } : {}),
    ...(filter.ageGroups?.length ? { student: { ageGroup: { in: filter.ageGroups } } } : {}),
    ...(filter.channels?.length ? { channel: { in: filter.channels } } : {}),
    ...(filter.dateRange
      ? { originalEnrollTime: { gte: filter.dateRange.start, lte: filter.dateRange.end } }
      : {}),
  };
}

function refundWhere(filter: FilterInput) {
  return {
    ...(filter.courseIds?.length ? { courseId: { in: filter.courseIds } } : {}),
    ...(filter.ageGroups?.length ? { student: { ageGroup: { in: filter.ageGroups } } } : {}),
    ...(filter.campusIds?.length ? { course: { campusId: { in: filter.campusIds } } } : {}),
    ...(filter.channels?.length ? { enrollment: { channel: { in: filter.channels } } } : {}),
    ...(filter.dateRange
      ? { refundTime: { gte: filter.dateRange.start, lte: filter.dateRange.end } }
      : {}),
  };
}

interface StageCounts {
  browse: number;
  inquiry: number;
  enroll: number;
  waitlist: number;
  converted: number;
  refund: number;
}

function buildFunnelData(counts: StageCounts) {
  return STAGE_ORDER.map((stage, i) => {
    const prevCount = i === 0 ? counts[stage] : counts[STAGE_ORDER[i - 1]];
    return {
      stage,
      label: STAGE_LABELS[stage],
      count: counts[stage],
      rate: i === 0 ? 1 : prevCount > 0 ? counts[stage] / prevCount : 0,
    };
  });
}

export const funnelRouter = createTRPCRouter({
  getFunnel: publicProcedure.input(funnelFilterSchema).query(async ({ input, ctx }) => {
    const eWhere = enrollmentWhere(input);
    const wWhere = waitlistWhere(input);
    const rWhere = refundWhere(input);

    const [browseCount, inquiryCount, enrollCount, waitlistCount, convertedCount, refundCount] =
      await Promise.all([
        ctx.prisma.enrollment.count({ where: { ...eWhere, status: "browse" } }),
        ctx.prisma.enrollment.count({ where: { ...eWhere, status: "inquiry" } }),
        ctx.prisma.enrollment.count({ where: { ...eWhere, status: "enrolled" } }),
        ctx.prisma.waitlistEntry.count({ where: wWhere }),
        ctx.prisma.waitlistEntry.count({ where: { ...wWhere, status: "converted" } }),
        ctx.prisma.refundRecord.count({ where: rWhere }),
      ]);

    const counts: StageCounts = {
      browse: browseCount,
      inquiry: inquiryCount,
      enroll: enrollCount,
      waitlist: waitlistCount,
      converted: convertedCount,
      refund: refundCount,
    };

    const data = buildFunnelData(counts);

    const [enrollments, waitlistEntries, refundRecords, campuses, courses] = await Promise.all([
      ctx.prisma.enrollment.findMany({
        where: eWhere,
        select: {
          status: true,
          campusId: true,
          courseId: true,
          channel: true,
          student: { select: { ageGroup: true } },
        },
      }),
      ctx.prisma.waitlistEntry.findMany({
        where: wWhere,
        select: {
          status: true,
          campusId: true,
          courseId: true,
          channel: true,
          student: { select: { ageGroup: true } },
        },
      }),
      ctx.prisma.refundRecord.findMany({
        where: rWhere,
        select: {
          courseId: true,
          student: { select: { ageGroup: true } },
          course: { select: { campusId: true } },
          enrollment: { select: { channel: true } },
        },
      }),
      ctx.prisma.campus.findMany({ select: { id: true, name: true } }),
      ctx.prisma.course.findMany({ select: { id: true, name: true } }),
    ]);

    function countStages(
      eList: typeof enrollments,
      wList: typeof waitlistEntries,
      rList: typeof refundRecords,
    ): StageCounts & { lowSample: boolean } {
      const browse = eList.filter((e) => e.status === "browse").length;
      const inquiry = eList.filter((e) => e.status === "inquiry").length;
      const enroll = eList.filter((e) => e.status === "enrolled").length;
      const wl = wList.length;
      const converted = wList.filter((w) => w.status === "converted").length;
      const refund = rList.length;
      return {
        browse,
        inquiry,
        enroll,
        waitlist: wl,
        converted,
        refund,
        lowSample: wl < LOW_SAMPLE_THRESHOLD,
      };
    }

    const campusItems = campuses.map((campus) => {
      const ef = enrollments.filter((e) => e.campusId === campus.id);
      const wf = waitlistEntries.filter((w) => w.campusId === campus.id);
      const rf = refundRecords.filter((r) => r.course.campusId === campus.id);
      const sc = countStages(ef, wf, rf);
      return { key: campus.id, label: campus.name, data: buildFunnelData(sc), lowSample: sc.lowSample };
    });

    const courseItems = courses.map((course) => {
      const ef = enrollments.filter((e) => e.courseId === course.id);
      const wf = waitlistEntries.filter((w) => w.courseId === course.id);
      const rf = refundRecords.filter((r) => r.courseId === course.id);
      const sc = countStages(ef, wf, rf);
      return { key: course.id, label: course.name, data: buildFunnelData(sc), lowSample: sc.lowSample };
    });

    const ageGroupItems = AGE_GROUPS.map((ag) => {
      const ef = enrollments.filter((e) => e.student.ageGroup === ag);
      const wf = waitlistEntries.filter((w) => w.student.ageGroup === ag);
      const rf = refundRecords.filter((r) => r.student.ageGroup === ag);
      const sc = countStages(ef, wf, rf);
      return { key: ag, label: ag, data: buildFunnelData(sc), lowSample: sc.lowSample };
    });

    const channelItems = CHANNELS.map((ch) => {
      const ef = enrollments.filter((e) => e.channel === ch);
      const wf = waitlistEntries.filter((w) => w.channel === ch);
      const rf = refundRecords.filter((r) => r.enrollment.channel === ch);
      const sc = countStages(ef, wf, rf);
      return { key: ch, label: ch, data: buildFunnelData(sc), lowSample: sc.lowSample };
    });

    const drilldown = [
      { dimension: "campus" as const, items: campusItems },
      { dimension: "course" as const, items: courseItems },
      { dimension: "ageGroup" as const, items: ageGroupItems },
      { dimension: "channel" as const, items: channelItems },
    ];

    return { data, drilldown };
  }),

  getTrend: publicProcedure
    .input(
      funnelFilterSchema.extend({
        granularity: z.enum(["day", "week", "month"]),
      }),
    )
    .query(async ({ input, ctx }) => {
      const wWhere = waitlistWhere(input);

      const entries = await ctx.prisma.waitlistEntry.findMany({
        where: wWhere,
        select: {
          status: true,
          originalEnrollTime: true,
        },
      });

      const periodMap = new Map<string, { total: number; converted: number }>();

      for (const entry of entries) {
        const d = entry.originalEnrollTime;
        let periodKey: string;

        if (input.granularity === "day") {
          periodKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        } else if (input.granularity === "week") {
          const start = new Date(d);
          start.setDate(d.getDate() - ((d.getDay() + 6) % 7));
          periodKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
        } else {
          periodKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        }

        const existing = periodMap.get(periodKey) ?? { total: 0, converted: 0 };
        existing.total += 1;
        if (entry.status === "converted") existing.converted += 1;
        periodMap.set(periodKey, existing);
      }

      const sortedPeriods = [...periodMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));

      return sortedPeriods.map(([period, { total, converted }]) => ({
        period,
        waitlistCount: total,
        conversionRate: total > 0 ? converted / total : 0,
      }));
    }),

  getMetrics: publicProcedure.input(funnelFilterSchema).query(async ({ input, ctx }) => {
    const eWhere = enrollmentWhere(input);
    const wWhere = waitlistWhere(input);
    const rWhere = refundWhere(input);

    const [waitingCount, convertedCount, totalWaitlist, refundCount, enrolledCount, waitingEntries] =
      await Promise.all([
        ctx.prisma.waitlistEntry.count({ where: { ...wWhere, status: "waiting" } }),
        ctx.prisma.waitlistEntry.count({ where: { ...wWhere, status: "converted" } }),
        ctx.prisma.waitlistEntry.count({ where: wWhere }),
        ctx.prisma.refundRecord.count({ where: rWhere }),
        ctx.prisma.enrollment.count({ where: { ...eWhere, status: "enrolled" } }),
        ctx.prisma.waitlistEntry.findMany({
          where: { ...wWhere, status: "waiting" },
          select: { originalEnrollTime: true },
        }),
      ]);

    const now = new Date();
    const avgWaitDays =
      waitingCount > 0
        ? waitingEntries.reduce((sum, e) => {
            const days =
              (now.getTime() - e.originalEnrollTime.getTime()) / (1000 * 60 * 60 * 24);
            return sum + days;
          }, 0) / waitingCount
        : 0;

    return {
      totalWaitlist: waitingCount,
      avgWaitDays: Math.round(avgWaitDays * 10) / 10,
      conversionRate: totalWaitlist > 0 ? convertedCount / totalWaitlist : 0,
      refundRate: enrolledCount > 0 ? refundCount / enrolledCount : 0,
    };
  }),
});
