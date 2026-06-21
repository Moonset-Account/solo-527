import { z } from "zod";
import { protectedProcedure, router, requireRoles } from "../trpc";
import { db, sortBy, paginate } from "../db";

export const auditRouter = router({
  questionBankVersions: protectedProcedure
    .input(z.object({ page: z.number().default(1), pageSize: z.number().default(20) }))
    .query(({ ctx, input }) => {
      const items = sortBy(db.questionBanks.filter(() => true), "enabledAt", "desc");
      const p = paginate(items, input.page, input.pageSize);
      return {
        ...p,
        items: p.items.map((v) => ({
          ...v,
          classesUsing: db.classes.filter((c) => c.questionBankVersionId === v.id).map((c) => c.name),
        })),
      };
    }),

  compareVersions: protectedProcedure
    .input(z.object({ fromId: z.string(), toId: z.string() }))
    .query(({ input }) => {
      const from = db.questionBanks.findById(input.fromId);
      const to = db.questionBanks.findById(input.toId);
      if (!from || !to) return null;
      return {
        from: { id: from.id, versionNo: from.versionNo, enabledAt: from.enabledAt, changelog: from.changelog },
        to: { id: to.id, versionNo: to.versionNo, enabledAt: to.enabledAt, changelog: to.changelog },
        diff: [
          { field: "素描静物案例", from: 38, to: 45, status: "ADDED" as const },
          { field: "真题案例", from: 12, to: 12, status: "UNCHANGED" as const },
          { field: "创作主题模块", from: 0, to: 3, status: "ADDED" as const },
          { field: "联考步骤范画", from: 20, to: 15, status: "REMOVED" as const },
        ],
      };
    }),

  operationLogs: protectedProcedure.use(requireRoles("PRINCIPAL", "FINANCE"))
    .input(z.object({
      page: z.number().default(1), pageSize: z.number().default(20),
      module: z.string().optional(), action: z.string().optional(),
      staffId: z.string().optional(), startDate: z.string().optional(), endDate: z.string().optional(),
    }))
    .query(({ ctx, input }) => {
      let items = db.operationLogs.filter((l) => {
        const s = db.staff.findById(l.staffId);
        return s?.campusId === ctx.campusId;
      });
      if (input.module) items = items.filter((l) => l.module === input.module);
      if (input.action) items = items.filter((l) => l.action === input.action);
      if (input.staffId) items = items.filter((l) => l.staffId === input.staffId);
      if (input.startDate) {
        const s = new Date(input.startDate);
        items = items.filter((l) => l.createdAt >= s);
      }
      if (input.endDate) {
        const e = new Date(input.endDate); e.setHours(23, 59, 59);
        items = items.filter((l) => l.createdAt <= e);
      }
      items = sortBy(items, "createdAt", "desc");
      const p = paginate(items, input.page, input.pageSize);
      return {
        ...p,
        items: p.items.map((l) => {
          const s = db.staff.findById(l.staffId);
          return { ...l, staffName: s?.name ?? "-", staffRole: s?.role ?? "-" };
        }),
      };
    }),

  downloadLogs: protectedProcedure.use(requireRoles("PRINCIPAL", "FINANCE"))
    .input(z.object({ page: z.number().default(1), pageSize: z.number().default(20) }))
    .query(({ ctx, input }) => {
      const items = sortBy(
        db.exportTasks.filter((t) => {
          const s = db.staff.findById(t.operatorId);
          return s?.campusId === ctx.campusId;
        }),
        "createdAt", "desc",
      );
      const p = paginate(items, input.page, input.pageSize);
      return {
        ...p,
        items: p.items.map((t) => {
          const s = db.staff.findById(t.operatorId);
          return { ...t, operatorName: s?.name ?? "-", operatorRole: s?.role ?? "-" };
        }),
      };
    }),
});
