import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { db } from "../db";
import { repose } from "../repositories";
import type { ParentFeedback } from "@/types";

export const feedbackRouter = router({
  list: protectedProcedure
    .input(z.object({
      page: z.number().default(1), pageSize: z.number().default(20),
      status: z.enum(["UNREAD", "READ"]).optional(),
      keyword: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const campusId = ctx.campusId!;
      const all = await repose.parentFeedbacks.list();
      let items = all.filter((f: any) => db.students.findById(f.studentId)?.campusId === campusId);
      if (input.status) items = items.filter((f: any) => f.status === input.status);
      if (input.keyword) {
        items = items.filter((f: any) => {
          const s = db.students.findById(f.studentId);
          return s?.name.includes(input.keyword!) || f.title.includes(input.keyword!) || f.content.includes(input.keyword!);
        });
      }
      items = repose.parentFeedbacks.sortBy(items, "createdAt", "desc");
      const p = repose.parentFeedbacks.paginate(items, input.page, input.pageSize);
      return {
        ...p,
        items: p.items.map((f: any) => {
          const s = db.students.findById(f.studentId)!;
          const cls = db.classes.findOne((c: any) => c.studentIds.includes(f.studentId));
          return {
            ...f, studentName: s.name, className: cls?.name ?? "未分班",
            avatarInitial: s.name.slice(0, 1),
          };
        }),
        unreadCount: items.filter((f: any) => f.status === "UNREAD").length,
      };
    }),

  markRead: protectedProcedure
    .input(z.array(z.string()))
    .mutation(async ({ ctx, input }) => {
      for (const id of input) {
        const f = await repose.parentFeedbacks.findById(id);
        if (f && f.status === "UNREAD") {
          await repose.parentFeedbacks.update(id, { status: "READ" } as Partial<ParentFeedback>);
        }
      }
      db.log({ staffId: ctx.staff!.id, module: "FEEDBACK", action: "MARK_READ", afterData: { count: input.length } });
      return { updated: input.length };
    }),

  reply: protectedProcedure
    .input(z.object({ id: z.string(), reply: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const updated = await repose.parentFeedbacks.update(input.id, {
        reply: input.reply, repliedBy: ctx.staff!.name, repliedAt: new Date(), status: "READ",
      } as Partial<ParentFeedback>);
      if (updated) db.log({ staffId: ctx.staff!.id, module: "FEEDBACK", action: "REPLY", targetId: input.id });
      return updated;
    }),

  history: protectedProcedure
    .input(z.object({ studentId: z.string().optional(), page: z.number().default(1), pageSize: z.number().default(50) }))
    .query(async ({ ctx, input }) => {
      const campusId = ctx.campusId!;
      const all = await repose.parentFeedbacks.list();
      let items = all.filter((f: any) => db.students.findById(f.studentId)?.campusId === campusId);
      if (input.studentId) items = items.filter((f: any) => f.studentId === input.studentId);
      items = repose.parentFeedbacks.sortBy(items, "createdAt", "desc");
      const p = repose.parentFeedbacks.paginate(items, input.page, input.pageSize);
      return {
        ...p,
        items: p.items.map((f: any) => {
          const s = db.students.findById(f.studentId)!;
          return { ...f, studentName: s.name };
        }),
      };
    }),
});
