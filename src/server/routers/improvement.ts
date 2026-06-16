import { z } from "zod";
import { createTRPCRouter, protectedProcedure, supervisorProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";

export const improvementRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]).optional(),
        assigneeId: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, ...filters } = input;
      const where = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== undefined)
      );

      const now = new Date();
      const twoDaysLater = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

      const dueSoonImprovements = await prisma.improvement.findMany({
        where: {
          status: { in: ["PENDING", "IN_PROGRESS"] },
          dueDate: { lte: twoDaysLater },
        },
        select: { id: true, title: true, dueDate: true, assigneeId: true },
      });

      for (const imp of dueSoonImprovements) {
        const existingTodo = await prisma.todo.findFirst({
          where: {
            type: "IMPROVEMENT_DUE",
            relatedFeedbackId: null,
            title: { contains: imp.id.slice(0, 8) },
            status: { in: ["PENDING", "IN_PROGRESS"] },
          },
        });

        if (!existingTodo) {
          const isOverdue = imp.dueDate < now;
          const dueDateStr = imp.dueDate.toLocaleDateString();
          const todoTitle = isOverdue
            ? "改进动作已逾期: " + imp.title
            : "改进动作即将到期: " + imp.title;
          const todoDesc = isOverdue
            ? "改进动作 " + imp.title + " 已超过截止日期，请尽快处理"
            : "改进动作 " + imp.title + " 截止日期为 " + dueDateStr + "，请尽快处理";

          await prisma.todo.create({
            data: {
              title: todoTitle,
              description: todoDesc,
              type: "IMPROVEMENT_DUE",
              priority: isOverdue ? "HIGH" : "MEDIUM",
              assigneeId: imp.assigneeId,
              dueDate: imp.dueDate,
            },
          });

          await prisma.auditLog.create({
            data: {
              entityType: "IMPROVEMENT",
              entityId: imp.id,
              action: "TODO_CREATED",
              userId: ctx.user?.id ?? "system",
              newValue: JSON.stringify({
                type: "IMPROVEMENT_DUE",
                overdue: isOverdue,
              }),
            },
          });
        }
      }

      const itemsPromise = prisma.improvement.findMany({
        where,
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          feedbacks: {
            include: {
              feedback: {
                select: { id: true, title: true, status: true, category: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      });

      const totalPromise = prisma.improvement.count({ where });

      const [items, total] = await Promise.all([itemsPromise, totalPromise]);

      return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
    }),

  create: supervisorProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        rootCause: z.string().optional(),
        assigneeId: z.string().min(1),
        dueDate: z.date(),
        relatedFeedbackIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { relatedFeedbackIds, ...data } = input;
      const improvement = await prisma.improvement.create({
        data: {
          ...data,
          feedbacks: relatedFeedbackIds
            ? {
                create: relatedFeedbackIds.map((fid) => ({ feedbackId: fid })),
              }
            : undefined,
        },
        include: { assignee: true, feedbacks: { include: { feedback: true } } },
      });

      await prisma.auditLog.create({
        data: {
          entityType: "IMPROVEMENT",
          entityId: improvement.id,
          action: "CREATED",
          userId: ctx.user.id,
          newValue: JSON.stringify({ title: input.title, assigneeId: input.assigneeId }),
        },
      });

      return improvement;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]).optional(),
        result: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const old = await prisma.improvement.findUnique({ where: { id } });
      if (!old) throw new Error("改进动作不存在");

      const data: Record<string, unknown> = { ...updates };
      if (updates.status === "COMPLETED") {
        data.completedAt = new Date();
      }

      const improvement = await prisma.improvement.update({
        where: { id },
        data,
        include: { assignee: true },
      });

      if (updates.status && updates.status !== old.status) {
        await prisma.auditLog.create({
          data: {
            entityType: "IMPROVEMENT",
            entityId: id,
            action: "STATUS_CHANGED",
            userId: ctx.user.id,
            oldValue: old.status,
            newValue: updates.status,
          },
        });
      }

      return improvement;
    }),
});
