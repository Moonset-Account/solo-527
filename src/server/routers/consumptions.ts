import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { db, paginate, sortBy } from "../db";
import type { Consumption } from "@/types";

const CStatus = z.enum(["NORMAL", "EXCEPTION", "RECONCILED"]);

export const consumptionsRouter = router({
  list: protectedProcedure
    .input(z.object({
      page: z.number().default(1), pageSize: z.number().default(20),
      classId: z.string().optional(), studentId: z.string().optional(),
      teacherId: z.string().optional(), status: CStatus.optional(),
      startDate: z.string().optional(), endDate: z.string().optional(),
      keyword: z.string().optional(),
    }))
    .query(({ ctx, input }) => {
      let items = db.consumptions.filter((c) => db.classes.findById(c.classId)?.campusId === ctx.campusId);
      if (input.classId) items = items.filter((c) => c.classId === input.classId);
      if (input.studentId) items = items.filter((c) => c.studentId === input.studentId);
      if (input.teacherId) items = items.filter((c) => c.operatorId === input.teacherId);
      if (input.status) items = items.filter((c) => c.status === input.status);
      if (input.startDate) {
        const s = new Date(input.startDate);
        items = items.filter((c) => c.createdAt >= s);
      }
      if (input.endDate) {
        const e = new Date(input.endDate); e.setHours(23, 59, 59, 999);
        items = items.filter((c) => c.createdAt <= e);
      }
      if (input.keyword) {
        items = items.filter((c) => {
          const s = db.students.findById(c.studentId);
          return s?.name.includes(input.keyword!);
        });
      }
      items = sortBy(items, "createdAt", "desc");
      const p = paginate(items, input.page, input.pageSize);
      return {
        ...p,
        items: p.items.map((c) => {
          const s = db.students.findById(c.studentId)!;
          const cls = db.classes.findById(c.classId)!;
          const ls = db.lessons.findById(c.lessonId)!;
          const op = db.staff.findById(c.operatorId)!;
          return {
            ...c, studentName: s.name, className: cls.name, lessonTitle: ls?.title,
            lessonAt: ls?.startAt, operatorName: op?.name ?? "-",
          };
        }),
        sum: items.reduce((s, c) => s + c.hours, 0),
      };
    }),

  trace: protectedProcedure
    .input(z.string())
    .query(({ input }) => {
      const c = db.consumptions.findById(input);
      if (!c) return null;
      const lesson = db.lessons.findById(c.lessonId);
      const cls = lesson ? db.classes.findById(lesson.classId) : null;
      const attendance = db.attendances.filter((a) => a.lessonId === c.lessonId);
      const qb = cls?.questionBankVersionId ? db.questionBanks.findById(cls.questionBankVersionId) : null;
      const operator = db.staff.findById(c.operatorId);
      const student = db.students.findById(c.studentId);
      const revisions = sortBy(db.revisions.filter((r) => r.consumptionId === c.id), "createdAt", "asc").map((r) => {
        const op = r.operatorId ? db.staff.findById(r.operatorId) : null;
        return { ...r, operatorName: op?.name ?? "系统" };
      });
      return { consumption: c, lesson, classInfo: cls, attendance, questionBank: qb, operator, student, revisions };
    }),

  markException: protectedProcedure
    .input(z.object({ id: z.string(), remark: z.string().min(1) }))
    .mutation(({ ctx, input }) => {
      const before = db.consumptions.findById(input.id);
      const updated = db.consumptions.update(input.id, { status: "EXCEPTION", remark: input.remark });
      if (updated) {
        db.revisions.create({
          consumptionId: input.id, beforeData: before, afterData: updated, operatorId: ctx.staff!.id,
        });
        db.log({ staffId: ctx.staff!.id, module: "CONSUMPTION", action: "MARK_EXCEPTION", targetId: input.id });
      }
      return updated;
    }),

  reconcile: protectedProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .mutation(({ ctx, input }) => {
      const updated: Consumption[] = [];
      input.ids.forEach((id) => {
        const r = db.consumptions.update(id, { status: "RECONCILED" });
        if (r) updated.push(r);
      });
      db.log({ staffId: ctx.staff!.id, module: "CONSUMPTION", action: "RECONCILE", afterData: { count: updated.length } });
      return { updated: updated.length };
    }),
});
