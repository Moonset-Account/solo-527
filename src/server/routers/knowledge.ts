import { z } from "zod";
import { createTRPCRouter, protectedProcedure, supervisorProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";

export const knowledgeRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        category: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { page, limit, ...filters } = input;
      const where = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== undefined)
      );
      const [items, total] = await Promise.all([
        prisma.knowledgeEntry.findMany({
          where,
          include: {
            _count: { select: { hits: true, feedbacks: true } },
          },
          orderBy: { updatedAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.knowledgeEntry.count({ where }),
      ]);
      return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return prisma.knowledgeEntry.findUnique({
        where: { id: input.id },
        include: {
          hits: { include: { feedback: { select: { id: true, title: true } } }, orderBy: { createdAt: "desc" } },
          feedbacks: { select: { id: true, title: true, status: true } },
          todos: { select: { id: true, title: true, status: true } },
        },
      });
    }),

  create: supervisorProcedure
    .input(
      z.object({
        title: z.string().min(1),
        content: z.string().min(1),
        category: z.string().min(1),
        version: z.string().default("1.0"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const entry = await prisma.knowledgeEntry.create({ data: input });

      await prisma.auditLog.create({
        data: {
          entityType: "KNOWLEDGE_ENTRY",
          entityId: entry.id,
          action: "CREATED",
          userId: ctx.user.id,
          newValue: JSON.stringify({ title: input.title, version: input.version }),
        },
      });

      return entry;
    }),

  updateVersion: supervisorProcedure
    .input(
      z.object({
        id: z.string(),
        version: z.string().min(1),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const old = await prisma.knowledgeEntry.findUnique({ where: { id: input.id } });
      if (!old) throw new Error("知识条目不存在");

      const entry = await prisma.knowledgeEntry.update({
        where: { id: input.id },
        data: { version: input.version, content: input.content },
      });

      await prisma.auditLog.create({
        data: {
          entityType: "KNOWLEDGE_ENTRY",
          entityId: input.id,
          action: "VERSION_UPDATED",
          userId: ctx.user.id,
          oldValue: old.version,
          newValue: input.version,
        },
      });

      await prisma.todo.create({
        data: {
          title: `知识库版本更新验证: ${old.title} → v${input.version}`,
          type: "KNOWLEDGE_VERSION",
          priority: "MEDIUM",
          relatedKnowledgeId: input.id,
          description: `知识条目 "${old.title}" 从 v${old.version} 更新到 v${input.version}，需验证命中效果`,
        },
      });

      return entry;
    }),

  getHitStats: protectedProcedure
    .input(
      z.object({
        entryId: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      const where: Record<string, unknown> = {};
      if (input.entryId) where.knowledgeEntryId = input.entryId;
      if (input.startDate || input.endDate) {
        where.createdAt = {
          ...(input.startDate && { gte: input.startDate }),
          ...(input.endDate && { lte: input.endDate }),
        };
      }

      const [totalHits, helpfulHits, byEntry] = await Promise.all([
        prisma.knowledgeHit.count({ where }),
        prisma.knowledgeHit.count({ where: { ...where, helpful: true } }),
        prisma.knowledgeHit.groupBy({
          by: ["knowledgeEntryId"],
          where,
          _count: { id: true },
          orderBy: { _count: { id: "desc" } },
          take: 20,
        }),
      ]);

      const helpfulByEntry = await prisma.knowledgeHit.groupBy({
        by: ["knowledgeEntryId"],
        where: { ...where, helpful: true },
        _count: { id: true },
      });

      const entryIds = byEntry.map((e) => e.knowledgeEntryId);
      const entries = await prisma.knowledgeEntry.findMany({
        where: { id: { in: entryIds } },
        select: { id: true, title: true, category: true, version: true },
      });

      return {
        totalHits,
        helpfulHits,
        hitRate: totalHits > 0 ? (helpfulHits / totalHits) * 100 : 0,
        byEntry: byEntry.map((e) => ({
          ...entries.find((en) => en.id === e.knowledgeEntryId),
          hitCount: e._count.id,
          helpfulCount: helpfulByEntry.find((h) => h.knowledgeEntryId === e.knowledgeEntryId)?._count.id ?? 0,
        })),
      };
    }),

  recordHit: protectedProcedure
    .input(
      z.object({
        entryId: z.string(),
        feedbackId: z.string(),
        helpful: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const hit = await prisma.knowledgeHit.create({
        data: {
          knowledgeEntryId: input.entryId,
          feedbackId: input.feedbackId,
          helpful: input.helpful,
        },
      });

      await prisma.auditLog.create({
        data: {
          entityType: "KNOWLEDGE_HIT",
          entityId: hit.id,
          action: "RECORDED",
          userId: ctx.user.id,
          newValue: JSON.stringify({ entryId: input.entryId, feedbackId: input.feedbackId, helpful: input.helpful }),
        },
      });

      return hit;
    }),
});
