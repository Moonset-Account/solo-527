import { z } from "zod";
import { createTRPCRouter, protectedProcedure, staffProcedure, supervisorProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";

export const feedbackRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().min(1),
        category: z.enum(["PRODUCT", "SERVICE", "BILLING", "TECHNICAL", "OTHER"]),
        urgency: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
        attachments: z
          .array(
            z.object({
              name: z.string(),
              url: z.string(),
              size: z.number(),
              mimeType: z.string(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { attachments, ...data } = input;
      const feedback = await prisma.feedback.create({
        data: {
          ...data,
          customerId: ctx.user.id,
          attachments: attachments
            ? { create: attachments }
            : undefined,
        },
        include: { attachments: true, customer: true },
      });

      await prisma.todo.create({
        data: {
          title: `新反馈待处理: ${input.title}`,
          type: "UNCLOSED_FEEDBACK",
          priority: input.urgency === "CRITICAL" ? "CRITICAL" : input.urgency === "HIGH" ? "HIGH" : "MEDIUM",
          relatedFeedbackId: feedback.id,
          dueDate: new Date(Date.now() + (input.urgency === "CRITICAL" ? 4 : input.urgency === "HIGH" ? 8 : 24) * 60 * 60 * 1000),
        },
      });

      await prisma.auditLog.create({
        data: {
          entityType: "FEEDBACK",
          entityId: feedback.id,
          action: "CREATED",
          userId: ctx.user.id,
          newValue: JSON.stringify({ title: input.title, category: input.category, urgency: input.urgency }),
        },
      });

      return feedback;
    }),

  list: staffProcedure
    .input(
      z.object({
        status: z.enum(["PENDING", "IN_PROGRESS", "PENDING_REVIEW", "CLOSED"]).optional(),
        category: z.enum(["PRODUCT", "SERVICE", "BILLING", "TECHNICAL", "OTHER"]).optional(),
        urgency: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, ...filters } = input;
      const where = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== undefined)
      );
      const [items, total] = await Promise.all([
        prisma.feedback.findMany({
          where,
          include: {
            customer: { select: { id: true, name: true, email: true } },
            assignee: { select: { id: true, name: true, email: true } },
            _count: { select: { notes: true, attachments: true, ratings: true } },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.feedback.count({ where }),
      ]);
      return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const feedback = await prisma.feedback.findUnique({
        where: { id: input.id },
        include: {
          customer: { select: { id: true, name: true, email: true } },
          assignee: { select: { id: true, name: true, email: true } },
          knowledgeEntry: true,
          attachments: true,
          notes: { include: { author: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" } },
          ratings: true,
          responseRecords: { orderBy: { recordedAt: "asc" } },
          knowledgeHits: { include: { knowledgeEntry: { select: { id: true, title: true } } } },
        },
      });
      if (!feedback) throw new Error("反馈不存在");
      return feedback;
    }),

  update: staffProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["PENDING", "IN_PROGRESS", "PENDING_REVIEW", "CLOSED"]).optional(),
        result: z.string().optional(),
        rootCause: z.string().optional(),
        knowledgeEntryId: z.string().optional(),
        assigneeId: z.string().optional(),
        knowledgeHelpful: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, knowledgeHelpful, ...updates } = input;
      const old = await prisma.feedback.findUnique({ where: { id } });
      if (!old) throw new Error("反馈不存在");

      const data: Record<string, unknown> = { ...updates };

      if (updates.status === "IN_PROGRESS" && !old.firstResponseAt) {
        data.firstResponseAt = new Date();
        const minutes = Math.round((Date.now() - old.createdAt.getTime()) / 60000);
        await prisma.responseTimeRecord.create({
          data: {
            feedbackId: id,
            responseMinutes: minutes,
            type: "FIRST_RESPONSE",
          },
        });
      }

      if (updates.status === "CLOSED" && !old.closedAt) {
        data.closedAt = new Date();
        const minutes = Math.round((Date.now() - old.createdAt.getTime()) / 60000);
        await prisma.responseTimeRecord.create({
          data: {
            feedbackId: id,
            responseMinutes: minutes,
            type: "FULL_RESOLUTION",
          },
        });
      }

      if (updates.knowledgeEntryId && updates.knowledgeEntryId !== old.knowledgeEntryId) {
        const existingHit = await prisma.knowledgeHit.findFirst({
          where: {
            knowledgeEntryId: updates.knowledgeEntryId,
            feedbackId: id,
          },
        });
        if (!existingHit) {
          await prisma.knowledgeHit.create({
            data: {
              knowledgeEntryId: updates.knowledgeEntryId,
              feedbackId: id,
              helpful: knowledgeHelpful ?? true,
            },
          });
          await prisma.auditLog.create({
            data: {
              entityType: "FEEDBACK",
              entityId: id,
              action: "KNOWLEDGE_LINKED",
              userId: ctx.user.id,
              newValue: JSON.stringify({ knowledgeEntryId: updates.knowledgeEntryId }),
            },
          });
        }
      }

      const feedback = await prisma.feedback.update({
        where: { id },
        data,
        include: { customer: true, assignee: true },
      });

      if (updates.status && updates.status !== old.status) {
        await prisma.auditLog.create({
          data: {
            entityType: "FEEDBACK",
            entityId: id,
            action: "STATUS_CHANGED",
            userId: ctx.user.id,
            oldValue: old.status,
            newValue: updates.status,
          },
        });
      }

      if (updates.result && updates.result !== old.result) {
        await prisma.auditLog.create({
          data: {
            entityType: "FEEDBACK",
            entityId: id,
            action: "RESULT_UPDATED",
            userId: ctx.user.id,
            oldValue: old.result,
            newValue: updates.result,
          },
        });
      }

      if (updates.rootCause && updates.rootCause !== old.rootCause) {
        await prisma.auditLog.create({
          data: {
            entityType: "FEEDBACK",
            entityId: id,
            action: "ROOTCAUSE_UPDATED",
            userId: ctx.user.id,
            oldValue: old.rootCause,
            newValue: updates.rootCause,
          },
        });
      }

      if (updates.status === "CLOSED") {
        await prisma.todo.updateMany({
          where: { relatedFeedbackId: id, status: "PENDING" },
          data: { status: "COMPLETED", completedAt: new Date() },
        });

        if (feedback.knowledgeEntryId) {
          await prisma.knowledgeHit.updateMany({
            where: {
              knowledgeEntryId: feedback.knowledgeEntryId,
              feedbackId: id,
            },
            data: { helpful: knowledgeHelpful ?? true },
          });
        }
      }

      return feedback;
    }),

  addNote: staffProcedure
    .input(
      z.object({
        feedbackId: z.string(),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const note = await prisma.note.create({
        data: {
          feedbackId: input.feedbackId,
          authorId: ctx.user.id,
          content: input.content,
        },
        include: { author: { select: { id: true, name: true } } },
      });

      await prisma.auditLog.create({
        data: {
          entityType: "FEEDBACK",
          entityId: input.feedbackId,
          action: "NOTE_ADDED",
          userId: ctx.user.id,
          newValue: JSON.stringify({ noteId: note.id, content: input.content }),
        },
      });

      return note;
    }),

  updateKnowledgeHit: staffProcedure
    .input(
      z.object({
        hitId: z.string(),
        helpful: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const old = await prisma.knowledgeHit.findUnique({
        where: { id: input.hitId },
        include: { knowledgeEntry: { select: { title: true } } },
      });
      if (!old) throw new Error("知识命中记录不存在");

      const hit = await prisma.knowledgeHit.update({
        where: { id: input.hitId },
        data: { helpful: input.helpful },
      });

      await prisma.auditLog.create({
        data: {
          entityType: "FEEDBACK",
          entityId: hit.feedbackId,
          action: "KNOWLEDGE_HIT_UPDATED",
          userId: ctx.user.id,
          oldValue: JSON.stringify({ hitId: input.hitId, helpful: old.helpful }),
          newValue: JSON.stringify({ hitId: input.hitId, helpful: input.helpful }),
        },
      });

      return hit;
    }),

  rate: protectedProcedure
    .input(
      z.object({
        feedbackId: z.string(),
        score: z.number().min(1).max(5),
        comment: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const rating = await prisma.rating.create({
        data: input,
      });

      await prisma.auditLog.create({
        data: {
          entityType: "FEEDBACK",
          entityId: input.feedbackId,
          action: "RATING_CREATED",
          userId: ctx.user.id,
          newValue: JSON.stringify({ score: input.score, comment: input.comment }),
        },
      });

      let todo = null;
      if (input.score <= 3) {
        todo = await prisma.todo.create({
          data: {
            title: "低分评价跟进: 反馈 " + input.feedbackId.slice(0, 8),
            type: "LOW_RATING",
            priority: "HIGH",
            relatedFeedbackId: input.feedbackId,
            description: "客户评分 " + input.score + "/5" + (input.comment ? "，评语: " + input.comment : ""),
          },
        });

        await prisma.auditLog.create({
          data: {
            entityType: "FEEDBACK",
            entityId: input.feedbackId,
            action: "TODO_CREATED",
            userId: ctx.user.id,
            newValue: JSON.stringify({ todoId: todo.id, type: "LOW_RATING", score: input.score }),
          },
        });
      }

      return { success: true, rating, todoCreated: !!todo };
    }),

  getMyFeedback: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit } = input;
      const [items, total] = await Promise.all([
        prisma.feedback.findMany({
          where: { customerId: ctx.user.id },
          include: {
            _count: { select: { notes: true, attachments: true, ratings: true } },
            ratings: true,
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.feedback.count({ where: { customerId: ctx.user.id } }),
      ]);
      return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
    }),
});
