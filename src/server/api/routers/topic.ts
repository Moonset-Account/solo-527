import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, representativeProcedure, publicProcedure, adminProcedure } from '../trpc'

export const topicRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({
      status: z.enum(['DRAFT', 'PUBLISHED', 'VOTING', 'CLOSED', 'CANCELLED']).optional(),
      limit: z.number().min(1).max(100).default(20),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where = input.status ? { status: input.status } : {}
      const [items, total] = await Promise.all([
        ctx.prisma.topic.findMany({
          where,
          include: {
            options: { orderBy: { sortOrder: 'asc' } },
            _count: { select: { votes: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: input.limit + 1,
          cursor: input.cursor ? { id: input.cursor } : undefined,
        }),
        ctx.prisma.topic.count({ where }),
      ])
      let nextCursor: typeof input.cursor | undefined
      if (items.length > input.limit) {
        const nextItem = items.pop()
        nextCursor = nextItem?.id
      }
      return { items, nextCursor, total }
    }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const topic = await ctx.prisma.topic.findUnique({
        where: { id: input.id },
        include: {
          options: { orderBy: { sortOrder: 'asc' } },
        },
      })
      if (!topic) throw new Error('议题不存在')

      const voteStats = await ctx.prisma.vote.groupBy({
        by: ['optionId'],
        where: { topicId: input.id },
        _count: { id: true },
      })

      const userVotes = ctx.user
        ? await ctx.prisma.vote.findMany({
            where: { topicId: input.id, userId: ctx.user.id },
            select: { optionId: true },
          })
        : []

      return {
        ...topic,
        voteStats,
        userVotedOptionIds: userVotes.map(v => v.optionId),
      }
    }),

  create: representativeProcedure
    .input(z.object({
      title: z.string().min(2).max(200),
      description: z.string().min(5),
      voteType: z.enum(['SINGLE', 'MULTIPLE', 'RANKED']).default('SINGLE'),
      maxSelections: z.number().min(1).max(10).optional(),
      startAt: z.coerce.date().optional(),
      endAt: z.coerce.date().optional(),
      quorum: z.number().int().min(1).optional(),
      passThreshold: z.number().min(0).max(1).default(0.5),
      isAnonymous: z.boolean().default(false),
      options: z.array(z.object({
        label: z.string().min(1),
        description: z.string().optional(),
      })).min(2),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.$transaction(async (tx) => {
        const topic = await tx.topic.create({
          data: {
            title: input.title,
            description: input.description,
            voteType: input.voteType,
            maxSelections: input.maxSelections,
            startAt: input.startAt,
            endAt: input.endAt,
            quorum: input.quorum,
            passThreshold: input.passThreshold,
            isAnonymous: input.isAnonymous,
            creatorId: ctx.user.id,
            status: 'DRAFT',
          },
        })
        await tx.voteOption.createMany({
          data: input.options.map((opt, i) => ({
            topicId: topic.id,
            label: opt.label,
            description: opt.description,
            sortOrder: i,
          })),
        })
        await tx.auditLog.create({
          data: {
            action: 'TOPIC_CREATE',
            entityType: 'Topic',
            entityId: topic.id,
            userId: ctx.user.id,
          },
        })
        return topic
      })
    }),

  publish: representativeProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const topic = await ctx.prisma.topic.update({
        where: { id: input.id },
        data: { status: 'PUBLISHED' },
      })
      await ctx.prisma.auditLog.create({
        data: {
          action: 'TOPIC_PUBLISH',
          entityType: 'Topic',
          entityId: topic.id,
          userId: ctx.user.id,
        },
      })
      return topic
    }),

  startVoting: representativeProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const topic = await ctx.prisma.topic.update({
        where: { id: input.id },
        data: { status: 'VOTING', startAt: new Date() },
      })
      await ctx.prisma.auditLog.create({
        data: {
          action: 'TOPIC_START_VOTING',
          entityType: 'Topic',
          entityId: topic.id,
          userId: ctx.user.id,
        },
      })
      return topic
    }),

  close: representativeProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const topic = await ctx.prisma.topic.update({
        where: { id: input.id },
        data: { status: 'CLOSED', endAt: new Date() },
      })
      await ctx.prisma.auditLog.create({
        data: {
          action: 'TOPIC_CLOSE',
          entityType: 'Topic',
          entityId: topic.id,
          userId: ctx.user.id,
        },
      })
      return topic
    }),

  vote: protectedProcedure
    .input(z.object({
      topicId: z.string(),
      optionIds: z.array(z.string()).min(1),
      comment: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const topic = await ctx.prisma.topic.findUnique({
        where: { id: input.topicId },
        include: { options: true },
      })
      if (!topic) throw new Error('议题不存在')
      if (topic.status !== 'VOTING') throw new Error('议题当前不可投票')

      const maxSel = topic.maxSelections || 1
      if (input.optionIds.length > maxSel) {
        throw new Error(`最多选择 ${maxSel} 个选项`)
      }

      const validOptionIds = topic.options.map(o => o.id)
      if (!input.optionIds.every(id => validOptionIds.includes(id))) {
        throw new Error('包含无效选项')
      }

      return ctx.prisma.$transaction(async (tx) => {
        await tx.vote.deleteMany({
          where: { topicId: input.topicId, userId: ctx.user.id },
        })
        await tx.vote.createMany({
          data: input.optionIds.map((optId, i) => ({
            topicId: input.topicId,
            optionId: optId,
            userId: ctx.user.id,
            comment: i === 0 ? input.comment : undefined,
            rankOrder: topic.voteType === 'RANKED' ? i + 1 : undefined,
          })),
        })
        await tx.auditLog.create({
          data: {
            action: 'TOPIC_VOTE',
            entityType: 'Topic',
            entityId: input.topicId,
            userId: ctx.user.id,
            detail: { optionCount: input.optionIds.length } as never,
          },
        })
        return { success: true, count: input.optionIds.length }
      })
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.topic.delete({ where: { id: input.id } })
      await ctx.prisma.auditLog.create({
        data: {
          action: 'TOPIC_DELETE',
          entityType: 'Topic',
          entityId: input.id,
          userId: ctx.user.id,
        },
      })
      return { success: true }
    }),
})
