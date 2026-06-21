import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { db, sortBy } from "../db";
import type { WorkFeedback } from "@/types";

export const worksRouter = router({
  listByClass: protectedProcedure
    .input(z.object({ classId: z.string(), page: z.number().default(1), pageSize: z.number().default(20) }))
    .query(({ input }) => {
      const c = db.classes.findById(input.classId); if (!c) return { items: [], total: 0 };
      const works = sortBy(
        db.works.filter((w) => c.studentIds.includes(w.studentId)),
        "submittedAt", "desc",
      );
      const start = (input.page - 1) * input.pageSize;
      return {
        total: works.length, page: input.page, pageSize: input.pageSize,
        items: works.slice(start, start + input.pageSize).map((w) => {
          const s = db.students.findById(w.studentId)!;
          const latest = sortBy(db.workFeedbacks.filter((f) => f.workId === w.id), "createdAt", "desc")[0];
          return { ...w, studentName: s.name, latestFeedback: latest };
        }),
      };
    }),

  submit: protectedProcedure
    .input(z.object({ studentId: z.string(), title: z.string(), imageUrl: z.string(), remark: z.string().optional() }))
    .mutation(({ ctx, input }) => {
      const w = db.works.create({ ...input, submittedAt: new Date() });
      db.log({ staffId: ctx.staff!.id, module: "WORK", action: "SUBMIT", targetId: w.id });
      return w;
    }),

  feedback: protectedProcedure
    .input(z.object({
      workId: z.string(),
      compositionScore: z.number().min(0).max(100), colorScore: z.number().min(0).max(100),
      creativityScore: z.number().min(0).max(100), techniqueScore: z.number().min(0).max(100),
      overallScore: z.number().min(0).max(100), comment: z.string().min(1),
    }))
    .mutation(({ ctx, input }) => {
      const fb = db.workFeedbacks.create({
        ...input, teacherId: ctx.staff!.id,
      } as WorkFeedback);
      db.log({ staffId: ctx.staff!.id, module: "WORK", action: "FEEDBACK", targetId: input.workId });
      return fb;
    }),

  history: protectedProcedure
    .input(z.string())
    .query(({ input }) => {
      return sortBy(db.workFeedbacks.filter((f) => f.workId === input), "createdAt", "desc").map((f) => {
        const t = db.staff.findById(f.teacherId);
        return { ...f, teacherName: t?.name ?? "-" };
      });
    }),
});
