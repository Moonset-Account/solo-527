import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { db, sortBy, paginate } from "../db";
import type { ParentFeedback } from "@/types";

export const feedbackRouter = router({
  list: protectedProcedure
    .input(z.object({
      page: z.number().default(1), pageSize: z.number().default(20),
      status: z.enum(["UNREAD", "READ"]).optional(),
      keyword: z.string().optional(),
    }))
    .query(({ ctx, input }) => {
      let items = db.parentFeedbacks.filter((f) => db.students.findById(f.studentId)?.campusId === ctx.campusId);
      if (input.status) items = items.filter((f) => f.status === input.status);
      if (input.keyword) {
        items = items.filter((f) => {
          const s = db.students.findById(f.studentId);
          return s?.name.includes(input.keyword!) || f.title.includes(input.keyword!) || f.content.includes(input.keyword!);
        });
      }
      items = sortBy(items, "createdAt", "desc");
      const p = paginate(items, input.page, input.pageSize);
      return {
        ...p,
        items: p.items.map((f) => {
          const s = db.students.findById(f.studentId)!;
          const cls = db.classes.findOne((c) => c.studentIds.includes(f.studentId));
          return {
            ...f, studentName: s.name, className: cls?.name ?? "未分班",
            avatarInitial: s.name.slice(0, 1),
          };
        }),
        unreadCount: items.filter((f) => f.status === "UNREAD").length,
      };
    }),

  markRead: protectedProcedure
    .input(z.array(z.string()))
    .mutation(({ ctx, input }) => {
      input.forEach((id) => {
        const f = db.parentFeedbacks.findById(id);
        if (f && f.status === "UNREAD") db.parentFeedbacks.update(id, { status: "READ" });
      });
      db.log({ staffId: ctx.staff!.id, module: "FEEDBACK", action: "MARK_READ", afterData: { count: input.length } });
      return { updated: input.length };
    }),

  reply: protectedProcedure
    .input(z.object({ id: z.string(), reply: z.string().min(1) }))
    .mutation(({ ctx, input }) => {
      const updated = db.parentFeedbacks.update(input.id, {
        reply: input.reply, repliedBy: ctx.staff!.name, repliedAt: new Date(), status: "READ",
      } as Partial<ParentFeedback>);
      if (updated) db.log({ staffId: ctx.staff!.id, module: "FEEDBACK", action: "REPLY", targetId: input.id });
      return updated;
    }),

  history: protectedProcedure
    .input(z.object({ studentId: z.string().optional(), page: z.number().default(1), pageSize: z.number().default(50) }))
    .query(({ ctx, input }) => {
      let items = db.parentFeedbacks.filter((f) => db.students.findById(f.studentId)?.campusId === ctx.campusId);
      if (input.studentId) items = items.filter((f) => f.studentId === input.studentId);
      items = sortBy(items, "createdAt", "desc");
      const p = paginate(items, input.page, input.pageSize);
      return {
        ...p,
        items: p.items.map((f) => {
          const s = db.students.findById(f.studentId)!;
          return { ...f, studentName: s.name };
        }),
      };
    }),
});
