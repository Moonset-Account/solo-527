import { z } from "zod";
import { protectedProcedure, router, requireRoles } from "../trpc";
import { db, paginate, sortBy } from "../db";
import type { SettingRule, Staff } from "@/types";

export const settingsRouter = router({
  getCampus: protectedProcedure.query(({ ctx }) => {
    return db.campus.findById(ctx.campusId!);
  }),

  updateCampus: protectedProcedure.use(requireRoles("PRINCIPAL"))
    .input(z.object({ name: z.string().optional(), address: z.string().optional(), phone: z.string().optional(), logoUrl: z.string().optional() }))
    .mutation(({ ctx, input }) => {
      const c = db.campus.update(ctx.campusId!, input);
      if (c) db.log({ staffId: ctx.staff!.id, module: "CAMPUS", action: "UPDATE" });
      return c;
    }),

  staffList: protectedProcedure.use(requireRoles("PRINCIPAL"))
    .input(z.object({ page: z.number().default(1), pageSize: z.number().default(20), status: z.enum(["ACTIVE", "INACTIVE"]).optional() }))
    .query(({ ctx, input }) => {
      let items = db.staff.filter((s) => s.campusId === ctx.campusId);
      if (input.status) items = items.filter((s) => s.status === input.status);
      items = sortBy(items, "createdAt", "desc");
      return paginate(items, input.page, input.pageSize);
    }),

  updateStaffRole: protectedProcedure.use(requireRoles("PRINCIPAL"))
    .input(z.object({ id: z.string(), role: z.enum(["PRINCIPAL", "ACADEMIC_AFFAIRS", "TEACHING_LEAD", "FINANCE"]), status: z.enum(["ACTIVE", "INACTIVE"]).optional() }))
    .mutation(({ ctx, input }) => {
      const patch: Partial<Staff> = { role: input.role };
      if (input.status) patch.status = input.status;
      const s = db.staff.update(input.id, patch);
      if (s) db.log({ staffId: ctx.staff!.id, module: "STAFF", action: "UPDATE_ROLE", targetId: input.id, afterData: patch });
      return s;
    }),

  getRules: protectedProcedure.query(({ ctx }) => {
    return db.settingRules.findOne((r) => r.campusId === ctx.campusId);
  }),

  updateRules: protectedProcedure.use(requireRoles("PRINCIPAL"))
    .input(z.object({
      trialFollowUpHours: z.number().min(1).max(168),
      renewalHighRiskHours: z.number().min(1).max(200),
      renewalMidRiskHours: z.number().min(1).max(500),
      feedbackTimeoutHours: z.number().min(1).max(336),
    }))
    .mutation(({ ctx, input }) => {
      let rule: SettingRule | undefined = db.settingRules.findOne((r) => r.campusId === ctx.campusId) ?? undefined;
      if (!rule) {
        rule = db.settingRules.create({ campusId: ctx.campusId!, ...input } as SettingRule);
      } else {
        rule = db.settingRules.update(rule.id, input as Partial<SettingRule>) ?? rule;
      }
      if (rule) db.log({ staffId: ctx.staff!.id, module: "SETTING", action: "UPDATE_RULES" });
      return rule;
    }),

  profile: protectedProcedure.query(({ ctx }) => {
    return ctx.staff ?? null;
  }),

  updateProfile: protectedProcedure
    .input(z.object({ name: z.string().optional(), email: z.string().optional(), phone: z.string().optional(), avatarUrl: z.string().optional() }))
    .mutation(({ ctx, input }) => {
      return db.staff.update(ctx.staff!.id, input);
    }),
});
