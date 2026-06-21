import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { db, paginate, sortBy } from "../db";
import type { Class } from "@/types";

const ClassStatus = z.enum(["PENDING", "ONGOING", "FINISHED", "SUSPENDED"]);
const Major = z.enum(["FINE_ARTS", "DESIGN", "MEDIA", "MUSIC", "DANCE", "OTHER"]);

export const classesRouter = router({
  list: protectedProcedure
    .input(z.object({
      page: z.number().default(1), pageSize: z.number().default(20),
      status: ClassStatus.optional(), major: Major.optional(), keyword: z.string().optional(),
    }))
    .query(({ ctx, input }) => {
      let items = db.classes.filter((c) => c.campusId === (ctx.campusId ?? ""));
      if (input.status) items = items.filter((c) => c.status === input.status);
      if (input.major) items = items.filter((c) => c.major === input.major);
      if (input.keyword) items = items.filter((c) => c.name.includes(input.keyword!));
      items = sortBy(items, "startDate", "desc");
      const p = paginate(items, input.page, input.pageSize);
      return {
        ...p,
        items: p.items.map((c) => ({
          ...c,
          teacherNames: c.teacherIds.map((id) => db.staff.findById(id)?.name ?? "-"),
          studentCount: c.studentIds.length,
          consumedHours: db.consumptions.filter((x) => x.classId === c.id).reduce((s, x) => s + x.hours, 0),
          questionBank: c.questionBankVersionId ? db.questionBanks.findById(c.questionBankVersionId) : null,
        })),
      };
    }),

  getById: protectedProcedure
    .input(z.string())
    .query(({ input }) => {
      const c = db.classes.findById(input);
      if (!c) return null;
      const teachers = c.teacherIds.map((id) => db.staff.findById(id)!).filter(Boolean);
      const qb = c.questionBankVersionId ? db.questionBanks.findById(c.questionBankVersionId) : null;
      return { ...c, teachers, questionBank: qb };
    }),

  getSchedule: protectedProcedure
    .input(z.object({ classId: z.string(), startDate: z.string(), endDate: z.string() }))
    .query(({ input }) => {
      const s = new Date(input.startDate); const e = new Date(input.endDate);
      const lessons = sortBy(
        db.lessons.filter((l) => l.classId === input.classId && l.startAt >= s && l.startAt <= e),
        "startAt", "asc",
      );
      return lessons.map((l) => {
        const atd = db.attendances.filter((a) => a.lessonId === l.id);
        const present = atd.filter((a) => a.status !== "ABSENT").length;
        return { ...l, attendanceCount: atd.length, presentCount: present, totalStudents: db.classes.findById(l.classId)!.studentIds.length };
      });
    }),

  getStudents: protectedProcedure
    .input(z.object({ classId: z.string(), page: z.number().default(1), pageSize: z.number().default(50) }))
    .query(({ input }) => {
      const c = db.classes.findById(input.classId); if (!c) return { items: [], total: 0 };
      const students = c.studentIds.map((sid) => {
        const s = db.students.findById(sid)!;
        const consumed = db.consumptions.filter((x) => x.classId === input.classId && x.studentId === sid).reduce((a, b) => a + b.hours, 0);
        return { ...s, consumedHours: consumed };
      });
      const p = paginate(students, input.page, input.pageSize);
      return p;
    }),

  getConsumptions: protectedProcedure
    .input(z.string())
    .query(({ input }) => {
      return sortBy(
        db.consumptions.filter((c) => c.classId === input),
        "createdAt", "desc",
      ).map((c) => {
        const student = db.students.findById(c.studentId)!;
        const lesson = db.lessons.findById(c.lessonId)!;
        const op = db.staff.findById(c.operatorId);
        return { ...c, studentName: student.name, lessonTitle: lesson?.title, operatorName: op?.name ?? "-" };
      });
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1), major: Major, totalHours: z.number().min(1), maxStudents: z.number().min(1),
      startDate: z.string().optional(), endDate: z.string().optional(),
      teacherIds: z.array(z.string()).default([]), studentIds: z.array(z.string()).default([]),
      questionBankVersionId: z.string().optional(), remark: z.string().optional(),
    }))
    .mutation(({ ctx, input }) => {
      const cls = db.classes.create({
        campusId: ctx.campusId!, status: "PENDING",
        ...input,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
      } as Class);
      db.log({ staffId: ctx.staff!.id, module: "CLASS", action: "CREATE", targetId: cls.id });
      return cls;
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), patch: z.object({
      name: z.string().optional(), major: Major.optional(), totalHours: z.number().optional(),
      status: ClassStatus.optional(), remark: z.string().optional(),
      questionBankVersionId: z.string().optional(),
    }) }))
    .mutation(({ ctx, input }) => {
      const updated = db.classes.update(input.id, input.patch as Partial<Class>);
      if (updated) db.log({ staffId: ctx.staff!.id, module: "CLASS", action: "UPDATE", targetId: input.id });
      return updated;
    }),
});
