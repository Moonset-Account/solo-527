import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

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

const BASE_COUNTS: Record<FunnelStage, number> = {
  browse: 500,
  inquiry: 280,
  enroll: 150,
  waitlist: 45,
  converted: 30,
  refund: 8,
};

const CAMPUSES = [
  { id: "campus-1", name: "朝阳区校区" },
  { id: "campus-2", name: "海淀区校区" },
  { id: "campus-3", name: "西城区校区" },
];

const COURSES = [
  { id: "course-1", name: "少儿英语启蒙", ageGroup: "3-6岁", campusId: "campus-1", capacity: 20 },
  { id: "course-2", name: "青少年编程基础", ageGroup: "10-12岁", campusId: "campus-1", capacity: 15 },
  { id: "course-3", name: "数学思维训练", ageGroup: "7-9岁", campusId: "campus-2", capacity: 25 },
  { id: "course-4", name: "创意美术", ageGroup: "3-6岁", campusId: "campus-2", capacity: 20 },
  { id: "course-5", name: "钢琴入门", ageGroup: "7-9岁", campusId: "campus-3", capacity: 10 },
  { id: "course-6", name: "机器人编程", ageGroup: "13-15岁", campusId: "campus-3", capacity: 18 },
];

const AGE_GROUPS = ["3-6岁", "7-9岁", "10-12岁", "13-15岁"];
const CHANNELS = ["线下推广", "微信公众号", "朋友推荐", "线上广告", "官网注册"];

const CAMPUS_RATIOS: Record<string, Record<FunnelStage, number>> = {
  "campus-1": { browse: 180, inquiry: 105, enroll: 58, waitlist: 18, converted: 12, refund: 3 },
  "campus-2": { browse: 175, inquiry: 95, enroll: 52, waitlist: 15, converted: 10, refund: 3 },
  "campus-3": { browse: 145, inquiry: 80, enroll: 40, waitlist: 12, converted: 8, refund: 2 },
};

const COURSE_RATIOS: Record<string, Record<FunnelStage, number>> = {
  "course-1": { browse: 95, inquiry: 55, enroll: 30, waitlist: 12, converted: 8, refund: 2 },
  "course-2": { browse: 85, inquiry: 50, enroll: 28, waitlist: 8, converted: 5, refund: 1 },
  "course-3": { browse: 90, inquiry: 48, enroll: 25, waitlist: 7, converted: 5, refund: 2 },
  "course-4": { browse: 80, inquiry: 45, enroll: 22, waitlist: 6, converted: 4, refund: 1 },
  "course-5": { browse: 75, inquiry: 42, enroll: 23, waitlist: 7, converted: 5, refund: 1 },
  "course-6": { browse: 75, inquiry: 40, enroll: 22, waitlist: 5, converted: 3, refund: 1 },
};

const AGE_RATIOS: Record<string, Record<FunnelStage, number>> = {
  "3-6岁": { browse: 175, inquiry: 100, enroll: 52, waitlist: 18, converted: 12, refund: 3 },
  "7-9岁": { browse: 165, inquiry: 90, enroll: 48, waitlist: 13, converted: 9, refund: 3 },
  "10-12岁": { browse: 100, inquiry: 55, enroll: 30, waitlist: 8, converted: 5, refund: 1 },
  "13-15岁": { browse: 60, inquiry: 35, enroll: 20, waitlist: 6, converted: 4, refund: 1 },
};

const CHANNEL_RATIOS: Record<string, Record<FunnelStage, number>> = {
  "线下推广": { browse: 120, inquiry: 75, enroll: 42, waitlist: 12, converted: 8, refund: 2 },
  "微信公众号": { browse: 140, inquiry: 72, enroll: 38, waitlist: 11, converted: 7, refund: 2 },
  "朋友推荐": { browse: 80, inquiry: 52, enroll: 32, waitlist: 9, converted: 7, refund: 1 },
  "线上广告": { browse: 110, inquiry: 50, enroll: 24, waitlist: 8, converted: 5, refund: 2 },
  "官网注册": { browse: 50, inquiry: 31, enroll: 14, waitlist: 5, converted: 3, refund: 1 },
};

function buildFunnelData(counts: Record<FunnelStage, number>) {
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

function buildDrilldownItems(
  items: { id: string; name: string }[],
  ratios: Record<string, Record<FunnelStage, number>>,
) {
  return items.map((item) => ({
    key: item.id,
    label: item.name,
    data: buildFunnelData(ratios[item.id] ?? BASE_COUNTS),
  }));
}

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

export const funnelRouter = createTRPCRouter({
  getFunnel: publicProcedure.input(funnelFilterSchema).query(({ input }) => {
    void input;

    const data = buildFunnelData(BASE_COUNTS);

    const drilldown = [
      {
        dimension: "campus" as const,
        items: buildDrilldownItems(CAMPUSES, CAMPUS_RATIOS),
      },
      {
        dimension: "course" as const,
        items: buildDrilldownItems(
          COURSES.map((c) => ({ id: c.id, name: c.name })),
          COURSE_RATIOS,
        ),
      },
      {
        dimension: "ageGroup" as const,
        items: buildDrilldownItems(
          AGE_GROUPS.map((g) => ({ id: g, name: g })),
          AGE_RATIOS,
        ),
      },
      {
        dimension: "channel" as const,
        items: buildDrilldownItems(
          CHANNELS.map((ch) => ({ id: ch, name: ch })),
          CHANNEL_RATIOS,
        ),
      },
    ];

    return { data, drilldown };
  }),

  getTrend: publicProcedure
    .input(
      funnelFilterSchema.extend({
        granularity: z.enum(["day", "week", "month"]),
      }),
    )
    .query(({ input }) => {
      void input;

      const months = [
        "2025-01",
        "2025-02",
        "2025-03",
        "2025-04",
        "2025-05",
        "2025-06",
      ];

      const trend = months.map((month, i) => ({
        period: month,
        waitlistCount: [38, 42, 45, 48, 50, 45][i],
        conversionRate: [0.62, 0.65, 0.67, 0.64, 0.66, 0.67][i],
      }));

      return trend;
    }),

  getMetrics: publicProcedure.input(funnelFilterSchema).query(({ input }) => {
    void input;

    return {
      totalWaitlist: 45,
      avgWaitDays: 12.5,
      conversionRate: 0.667,
      refundRate: 0.053,
    };
  }),
});
