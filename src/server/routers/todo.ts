import { z } from "zod";
import { createTRPCRouter, protectedProcedure, staffProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";

export const todoRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        type: z.enum(["KNOWLEDGE_VERSION", "UNCLOSED_FEEDBACK", "LOW_RATING", "IMPROVEMENT_DUE"]).optional(),
        status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]).optional(),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, ...filters } = input;
      const where = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== undefined)
      );
      if (ctx.user?.role === "STAFF") {
        (where as Record<string, unknown>).assigneeId = ctx.user.id;
      }
      const [items, total] = await Promise.all([
        prisma.todo.findMany({
          where,
          include: {
            relatedFeedback: { select: { id: true, title: true, status: true } },
            relatedKnowledge: { select: { id: true, title: true, version: true } },
            assignee: { select: { id: true, name: true } },
          },
          orderBy: [
            { priority: "desc" },
            { createdAt: "desc" },
          ],
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.todo.count({ where }),
      ]);
      return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return prisma.todo.findUnique({
        where: { id: input.id },
        include: {
          relatedFeedback: true,
          relatedKnowledge: true,
          assignee: { select: { id: true, name: true, email: true } },
        },
      });
    }),

  create: staffProcedure
    .input(
      z.object({
        title: z.string().min(1),
        type: z.enum(["KNOWLEDGE_VERSION", "UNCLOSED_FEEDBACK", "LOW_RATING", "IMPROVEMENT_DUE"]),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
        relatedFeedbackId: z.string().optional(),
        relatedKnowledgeId: z.string().optional(),
        assigneeId: z.string().optional(),
        dueDate: z.date().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const todo = await prisma.todo.create({ data: input });

      await prisma.auditLog.create({
        data: {
          entityType: "TODO",
          entityId: todo.id,
          action: "CREATED",
          userId: ctx.user.id,
          newValue: JSON.stringify({ title: input.title, type: input.type, priority: input.priority }),
        },
      });

      return todo;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]).optional(),
        result: z.string().optional(),
        assigneeId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const old = await prisma.todo.findUnique({ where: { id } });
      if (!old) throw new Error("待办不存在");

      const data: Record<string, unknown> = { ...updates };
      if (updates.status === "COMPLETED") {
        data.completedAt = new Date();
      }

      const todo = await prisma.todo.update({ where: { id }, data });

      if (updates.status && updates.status !== old.status) {
        await prisma.auditLog.create({
          data: {
            entityType: "TODO",
            entityId: id,
            action: "STATUS_CHANGED",
            userId: ctx.user.id,
            oldValue: old.status,
            newValue: updates.status,
          },
        });
      }

      return todo;
    }),

  complete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        result: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const old = await prisma.todo.findUnique({ where: { id: input.id } });
      if (!old) throw new Error("待办不存在");

      const todo = await prisma.todo.update({
        where: { id: input.id },
        data: {
          status: "COMPLETED",
          result: input.result,
          completedAt: new Date(),
        },
      });

      await prisma.auditLog.create({
        data: {
          entityType: "TODO",
          entityId: input.id,
          action: "COMPLETED",
          userId: ctx.user.id,
          oldValue: old.status,
          newValue: "COMPLETED",
        },
      });

      return todo;
    }),
});
