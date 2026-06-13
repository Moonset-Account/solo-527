import { z } from "zod";
import { createTRPCRouter, protectedProcedure, managerProcedure, adminProcedure } from "../trpc";
import { safeDbCall, assertDbAvailable } from "../lib/safeDb";
import { createLog, diffAndCreateLogs } from "../lib/logs";

export const userRouter = createTRPCRouter({
  me: protectedProcedure.query(async ({ ctx }) => {
    return safeDbCall(ctx, ctx.dbUser, () =>
      ctx.db.user.findUnique({
        where: { id: ctx.dbUser.id },
      })
    );
  }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return safeDbCall(ctx, [ctx.dbUser], () =>
      ctx.db.user.findMany({
        orderBy: { createdAt: "desc" },
      })
    );
  }),

  updateRole: adminProcedure
    .input(z.object({
      userId: z.string(),
      role: z.enum(["RECEPTIONIST", "DOCTOR", "MANAGER", "ADMIN"]),
    }))
    .mutation(async ({ ctx, input }) => {
      assertDbAvailable(ctx, "修改用户角色");
      const old = await ctx.db.user.findUnique({ where: { id: input.userId } });
      if (!old) throw new Error("用户不存在");

      const updated = await ctx.db.user.update({
        where: { id: input.userId },
        data: { role: input.role },
      });

      await createLog(ctx.db, {
        entityType: "User",
        entityId: input.userId,
        action: "UPDATE",
        fieldName: "role",
        oldValue: old.role,
        newValue: input.role,
        operatorId: ctx.dbUser.id,
        detail: "修改用户角色",
      });

      return updated;
    }),

  ensureUser: protectedProcedure
    .input(z.object({
      email: z.string(),
      name: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.dbUnavailable) return ctx.dbUser;
      try {
        const existing = await ctx.db.user.findUnique({
          where: { clerkId: ctx.userId },
        });
        if (existing) return existing;

        return await ctx.db.user.create({
          data: {
            clerkId: ctx.userId,
            email: input.email,
            name: input.name,
          },
        });
      } catch (e) {
        console.error("[ensureUser] DB error, returning context user:", e);
        return ctx.dbUser;
      }
    }),
});
