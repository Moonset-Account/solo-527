import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

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

const MOCK_RANKINGS: CourseRanking[] = [
  {
    courseId: "course-1",
    courseName: "少儿英语启蒙",
    campusName: "朝阳区校区",
    waitlistCount: 12,
    convertedCount: 8,
    conversionRate: 0.667,
    avgWaitDays: 11,
    classCapacity: 20,
    suggestion: "recommended",
    lowSample: false,
  },
  {
    courseId: "course-2",
    courseName: "青少年编程基础",
    campusName: "朝阳区校区",
    waitlistCount: 8,
    convertedCount: 5,
    conversionRate: 0.625,
    avgWaitDays: 12,
    classCapacity: 15,
    suggestion: "recommended",
    lowSample: false,
  },
  {
    courseId: "course-3",
    courseName: "数学思维训练",
    campusName: "海淀区校区",
    waitlistCount: 7,
    convertedCount: 5,
    conversionRate: 0.714,
    avgWaitDays: 11,
    classCapacity: 25,
    suggestion: "normal",
    lowSample: false,
  },
  {
    courseId: "course-4",
    courseName: "创意美术",
    campusName: "海淀区校区",
    waitlistCount: 6,
    convertedCount: 4,
    conversionRate: 0.667,
    avgWaitDays: 13,
    classCapacity: 20,
    suggestion: "normal",
    lowSample: false,
  },
  {
    courseId: "course-5",
    courseName: "钢琴入门",
    campusName: "西城区校区",
    waitlistCount: 7,
    convertedCount: 5,
    conversionRate: 0.714,
    avgWaitDays: 10,
    classCapacity: 10,
    suggestion: "urgent",
    lowSample: false,
  },
  {
    courseId: "course-6",
    courseName: "机器人编程",
    campusName: "西城区校区",
    waitlistCount: 5,
    convertedCount: 3,
    conversionRate: 0.6,
    avgWaitDays: 14,
    classCapacity: 18,
    suggestion: "normal",
    lowSample: true,
  },
];

function computeSuggestion(waitlistCount: number, capacity: number): Suggestion {
  if (waitlistCount >= capacity) return "urgent";
  if (waitlistCount >= capacity * 0.5) return "recommended";
  return "normal";
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
    .query(({ input }) => {
      let filtered = [...MOCK_RANKINGS];

      if (input.campusIds?.length) {
        filtered = filtered.filter((r) => {
          const campusMap: Record<string, string> = {
            "campus-1": "朝阳区校区",
            "campus-2": "海淀区校区",
            "campus-3": "西城区校区",
          };
          return input.campusIds!.some((cid) => campusMap[cid] === r.campusName);
        });
      }

      if (input.courseIds?.length) {
        filtered = filtered.filter((r) => input.courseIds!.includes(r.courseId));
      }

      if (input.ageGroups?.length) {
        const ageGroupMap: Record<string, string[]> = {
          "3-6岁": ["course-1", "course-4"],
          "7-9岁": ["course-3", "course-5"],
          "10-12岁": ["course-2"],
          "13-15岁": ["course-6"],
        };
        const allowedCourseIds = input.ageGroups.flatMap((ag) => ageGroupMap[ag] ?? []);
        filtered = filtered.filter((r) => allowedCourseIds.includes(r.courseId));
      }

      const result = filtered.map((r) => ({
        ...r,
        suggestion: computeSuggestion(r.waitlistCount, r.classCapacity),
        lowSample: r.waitlistCount < 5,
      }));

      return sortByField(result, input.sortBy);
    }),
});
