import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { safeDbCall, assertDbAvailable } from "../lib/safeDb";
import { createLog, diffAndCreateLogs } from "../lib/logs";

const trackedFields = ["name", "phone", "email", "source", "remark"] as const;

export const customerRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      pageSize: z.number().default(20),
      keyword: z.string().optional(),
      tagIds: z.array(z.string()).optional(),
      source: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};
      if (input.keyword) {
        where.OR = [
          { name: { contains: input.keyword, mode: "insensitive" } },
          { phone: { contains: input.keyword } },
        ];
      }
      if (input.source) where.source = input.source;
      if (input.tagIds?.length) {
        where.tags = { some: { tagId: { in: input.tagIds } } };
      }

      return safeDbCall(ctx, { total: 0, list: [] }, async () => {
        const [total, list] = await Promise.all([
          ctx.db.customer.count({ where }),
          ctx.db.customer.findMany({
            where,
            skip: (input.page - 1) * input.pageSize,
            take: input.pageSize,
            orderBy: { createdAt: "desc" },
            include: {
              tags: { include: { tag: true } },
              consultations: { take: 3, orderBy: { createdAt: "desc" } },
              leads: { take: 3, orderBy: { createdAt: "desc" } },
              _count: { select: { consultations: true, leads: true, payments: true } },
            },
          }),
        ]);
        return { total, list };
      }, "customer.list");
    }),

  detail: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      return safeDbCall(ctx, null, () =>
        ctx.db.customer.findUnique({
          where: { id: input },
          include: {
            tags: { include: { tag: true } },
            consultations: {
              orderBy: { createdAt: "desc" },
              include: { createdBy: true },
            },
            leads: {
              orderBy: { createdAt: "desc" },
              include: { stage: true, assignedTo: true, followUpPlans: true, payments: true },
            },
            payments: { orderBy: { createdAt: "desc" } },
          },
        }),
        "customer.detail"
      );
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      phone: z.string(),
      gender: z.string().optional(),
      age: z.number().optional(),
      email: z.string().optional(),
      address: z.string().optional(),
      source: z.string().optional(),
      remark: z.string().optional(),
      tagIds: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      assertDbAvailable(ctx, "创建客户");
      const existing = await ctx.db.customer.findFirst({
        where: { phone: input.phone },
      });
      if (existing) return existing;

      const customer = await ctx.db.customer.create({
        data: {
          name: input.name,
          phone: input.phone,
          gender: input.gender,
          age: input.age,
          email: input.email,
          address: input.address,
          source: input.source,
          remark: input.remark,
          tags: input.tagIds?.length
            ? { create: input.tagIds.map((id) => ({ tagId: id })) }
            : undefined,
        },
      });

      await createLog(ctx.db, {
        entityType: "Customer",
        entityId: customer.id,
        action: "CREATE",
        operatorId: ctx.dbUser.id,
        detail: `创建客户: ${customer.name}`,
      });

      return customer;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      phone: z.string().optional(),
      gender: z.string().optional(),
      age: z.number().optional(),
      email: z.string().optional(),
      address: z.string().optional(),
      source: z.string().optional(),
      remark: z.string().optional(),
      tagIds: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      assertDbAvailable(ctx, "更新客户");
      const old = await ctx.db.customer.findUnique({ where: { id: input.id } });
      if (!old) throw new Error("客户不存在");

      const { id, tagIds, ...rest } = input;

      const updated = await ctx.db.$transaction(async (tx) => {
        const cust = await tx.customer.update({
          where: { id },
          data: rest,
        });

        if (tagIds) {
          await tx.customerTagRelation.deleteMany({ where: { customerId: id } });
          if (tagIds.length > 0) {
            await tx.customerTagRelation.createMany({
              data: tagIds.map((tagId) => ({ customerId: id, tagId })),
            });
          }
        }
        return cust;
      });

      const logs = diffAndCreateLogs(
        "Customer", id, old, rest, ctx.dbUser.id, trackedFields
      );
      if (tagIds) {
        logs.push({
          entityType: "Customer",
          entityId: id,
          action: "UPDATE",
          fieldName: "tagIds",
          oldValue: (old as any).tagIds,
          newValue: tagIds,
          operatorId: ctx.dbUser.id,
          detail: "修改客户标签",
        });
      }
      for (const log of logs) await createLog(ctx.db, log);

      return updated;
    }),
});
