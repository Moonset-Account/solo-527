import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

type WaitlistStatus = "waiting" | "converted" | "cancelled";

interface MockWaitlistEntry {
  id: string;
  studentId: string;
  studentName: string;
  isMinor: boolean;
  courseId: string;
  courseName: string;
  campusId: string;
  campusName: string;
  originalEnrollTime: string;
  convertedTime: string | null;
  waitDays: number | null;
  position: number;
  status: WaitlistStatus;
  channel: string;
  ageGroup: string;
}

const COURSES_MAP: Record<string, { name: string; campusId: string; campusName: string; ageGroup: string }> = {
  "course-1": { name: "少儿英语启蒙", campusId: "campus-1", campusName: "朝阳区校区", ageGroup: "3-6岁" },
  "course-2": { name: "青少年编程基础", campusId: "campus-1", campusName: "朝阳区校区", ageGroup: "10-12岁" },
  "course-3": { name: "数学思维训练", campusId: "campus-2", campusName: "海淀区校区", ageGroup: "7-9岁" },
  "course-4": { name: "创意美术", campusId: "campus-2", campusName: "海淀区校区", ageGroup: "3-6岁" },
  "course-5": { name: "钢琴入门", campusId: "campus-3", campusName: "西城区校区", ageGroup: "7-9岁" },
  "course-6": { name: "机器人编程", campusId: "campus-3", campusName: "西城区校区", ageGroup: "13-15岁" },
};

const CHANNELS = ["线下推广", "微信公众号", "朋友推荐", "线上广告", "官网注册"];

const MOCK_ENTRIES: MockWaitlistEntry[] = [
  { id: "wl-1", studentId: "stu-1", studentName: "张小明", isMinor: true, courseId: "course-1", courseName: "少儿英语启蒙", campusId: "campus-1", campusName: "朝阳区校区", originalEnrollTime: "2025-05-10T08:00:00Z", convertedTime: null, waitDays: null, position: 1, status: "waiting", channel: "微信公众号", ageGroup: "3-6岁" },
  { id: "wl-2", studentId: "stu-2", studentName: "李思远", isMinor: true, courseId: "course-1", courseName: "少儿英语启蒙", campusId: "campus-1", campusName: "朝阳区校区", originalEnrollTime: "2025-05-11T09:00:00Z", convertedTime: null, waitDays: null, position: 2, status: "waiting", channel: "朋友推荐", ageGroup: "3-6岁" },
  { id: "wl-3", studentId: "stu-3", studentName: "王建国", isMinor: false, courseId: "course-1", courseName: "少儿英语启蒙", campusId: "campus-1", campusName: "朝阳区校区", originalEnrollTime: "2025-05-09T10:00:00Z", convertedTime: "2025-05-20T10:00:00Z", waitDays: 11, position: 3, status: "converted", channel: "线下推广", ageGroup: "3-6岁" },
  { id: "wl-4", studentId: "stu-4", studentName: "陈雨萱", isMinor: true, courseId: "course-2", courseName: "青少年编程基础", campusId: "campus-1", campusName: "朝阳区校区", originalEnrollTime: "2025-05-08T08:00:00Z", convertedTime: null, waitDays: null, position: 1, status: "waiting", channel: "线上广告", ageGroup: "10-12岁" },
  { id: "wl-5", studentId: "stu-5", studentName: "刘博文", isMinor: true, courseId: "course-2", courseName: "青少年编程基础", campusId: "campus-1", campusName: "朝阳区校区", originalEnrollTime: "2025-05-12T09:00:00Z", convertedTime: null, waitDays: null, position: 2, status: "waiting", channel: "官网注册", ageGroup: "10-12岁" },
  { id: "wl-6", studentId: "stu-6", studentName: "赵雪梅", isMinor: false, courseId: "course-3", courseName: "数学思维训练", campusId: "campus-2", campusName: "海淀区校区", originalEnrollTime: "2025-05-07T11:00:00Z", convertedTime: "2025-05-18T11:00:00Z", waitDays: 11, position: 1, status: "converted", channel: "朋友推荐", ageGroup: "7-9岁" },
  { id: "wl-7", studentId: "stu-7", studentName: "孙浩然", isMinor: true, courseId: "course-3", courseName: "数学思维训练", campusId: "campus-2", campusName: "海淀区校区", originalEnrollTime: "2025-05-14T08:00:00Z", convertedTime: null, waitDays: null, position: 2, status: "waiting", channel: "微信公众号", ageGroup: "7-9岁" },
  { id: "wl-8", studentId: "stu-8", studentName: "周子涵", isMinor: true, courseId: "course-4", courseName: "创意美术", campusId: "campus-2", campusName: "海淀区校区", originalEnrollTime: "2025-05-06T09:00:00Z", convertedTime: null, waitDays: null, position: 1, status: "waiting", channel: "线下推广", ageGroup: "3-6岁" },
  { id: "wl-9", studentId: "stu-9", studentName: "吴梓萱", isMinor: true, courseId: "course-4", courseName: "创意美术", campusId: "campus-2", campusName: "海淀区校区", originalEnrollTime: "2025-05-09T10:00:00Z", convertedTime: "2025-05-22T10:00:00Z", waitDays: 13, position: 2, status: "converted", channel: "官网注册", ageGroup: "3-6岁" },
  { id: "wl-10", studentId: "stu-10", studentName: "郑嘉怡", isMinor: true, courseId: "course-5", courseName: "钢琴入门", campusId: "campus-3", campusName: "西城区校区", originalEnrollTime: "2025-05-05T08:00:00Z", convertedTime: null, waitDays: null, position: 1, status: "waiting", channel: "朋友推荐", ageGroup: "7-9岁" },
  { id: "wl-11", studentId: "stu-11", studentName: "黄俊杰", isMinor: false, courseId: "course-5", courseName: "钢琴入门", campusId: "campus-3", campusName: "西城区校区", originalEnrollTime: "2025-05-13T09:00:00Z", convertedTime: null, waitDays: null, position: 2, status: "waiting", channel: "微信公众号", ageGroup: "7-9岁" },
  { id: "wl-12", studentId: "stu-12", studentName: "林诗涵", isMinor: true, courseId: "course-6", courseName: "机器人编程", campusId: "campus-3", campusName: "西城区校区", originalEnrollTime: "2025-05-10T10:00:00Z", convertedTime: null, waitDays: null, position: 1, status: "waiting", channel: "线上广告", ageGroup: "13-15岁" },
  { id: "wl-13", studentId: "stu-13", studentName: "何天宇", isMinor: false, courseId: "course-6", courseName: "机器人编程", campusId: "campus-3", campusName: "西城区校区", originalEnrollTime: "2025-05-11T11:00:00Z", convertedTime: "2025-05-25T11:00:00Z", waitDays: 14, position: 2, status: "converted", channel: "线下推广", ageGroup: "13-15岁" },
  { id: "wl-14", studentId: "stu-14", studentName: "马晨曦", isMinor: true, courseId: "course-1", courseName: "少儿英语启蒙", campusId: "campus-1", campusName: "朝阳区校区", originalEnrollTime: "2025-05-15T08:00:00Z", convertedTime: null, waitDays: null, position: 4, status: "waiting", channel: "官网注册", ageGroup: "3-6岁" },
  { id: "wl-15", studentId: "stu-15", studentName: "许文博", isMinor: true, courseId: "course-2", courseName: "青少年编程基础", campusId: "campus-1", campusName: "朝阳区校区", originalEnrollTime: "2025-05-03T09:00:00Z", convertedTime: "2025-05-15T09:00:00Z", waitDays: 12, position: 3, status: "converted", channel: "朋友推荐", ageGroup: "10-12岁" },
];

const MOCK_ADJUST_LOGS: Record<string, Array<{
  id: string;
  entryId: string;
  oldPosition: number;
  newPosition: number;
  reason: string;
  operator: string;
  createdAt: string;
}>> = {
  "course-1": [
    { id: "log-1", entryId: "wl-3", oldPosition: 5, newPosition: 3, reason: "家长强烈诉求，已多次咨询", operator: "张老师", createdAt: "2025-05-15T10:00:00Z" },
    { id: "log-2", entryId: "wl-1", oldPosition: 3, newPosition: 1, reason: "VIP客户优先安排", operator: "李主任", createdAt: "2025-05-16T14:00:00Z" },
  ],
  "course-2": [
    { id: "log-3", entryId: "wl-15", oldPosition: 5, newPosition: 3, reason: "转校生优先", operator: "王老师", createdAt: "2025-05-14T09:00:00Z" },
  ],
  "course-5": [
    { id: "log-4", entryId: "wl-11", oldPosition: 3, newPosition: 2, reason: "学生时间调整，可参加早班", operator: "赵老师", createdAt: "2025-05-17T11:00:00Z" },
  ],
};

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
    .query(({ input }) => {
      const entries = MOCK_ENTRIES.filter((e) => e.courseId === input.courseId);

      return entries.map((entry) => ({
        ...entry,
        studentName: maskMinorName(entry.studentName, entry.isMinor),
      }));
    }),

  adjust: publicProcedure
    .input(
      z.object({
        entryId: z.string(),
        newPosition: z.number().int().positive(),
        reason: z.string().min(1),
      }),
    )
    .mutation(({ input }) => {
      const entry = MOCK_ENTRIES.find((e) => e.id === input.entryId);
      if (!entry) {
        throw new Error("候补记录不存在");
      }

      const oldPosition = entry.position;
      entry.position = input.newPosition;

      const logs = MOCK_ADJUST_LOGS[entry.courseId] ?? [];
      logs.push({
        id: `log-${Date.now()}`,
        entryId: entry.id,
        oldPosition,
        newPosition: input.newPosition,
        reason: input.reason,
        operator: "当前用户",
        createdAt: new Date().toISOString(),
      });
      MOCK_ADJUST_LOGS[entry.courseId] = logs;

      return {
        ...entry,
        studentName: maskMinorName(entry.studentName, entry.isMinor),
      };
    }),

  convert: publicProcedure
    .input(
      z.object({
        entryId: z.string(),
      }),
    )
    .mutation(({ input }) => {
      const entry = MOCK_ENTRIES.find((e) => e.id === input.entryId);
      if (!entry) {
        throw new Error("候补记录不存在");
      }
      if (entry.status !== "waiting") {
        throw new Error("该候补记录不在等待状态");
      }

      const now = new Date();
      const originalTime = new Date(entry.originalEnrollTime);
      const waitDays = Math.floor((now.getTime() - originalTime.getTime()) / (1000 * 60 * 60 * 24));

      entry.status = "converted";
      entry.convertedTime = now.toISOString();
      entry.waitDays = waitDays;

      return {
        ...entry,
        studentName: maskMinorName(entry.studentName, entry.isMinor),
      };
    }),

  history: publicProcedure
    .input(
      z.object({
        courseId: z.string(),
      }),
    )
    .query(({ input }) => {
      return MOCK_ADJUST_LOGS[input.courseId] ?? [];
    }),
});
