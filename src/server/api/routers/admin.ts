import { z } from 'zod'
import { createTRPCRouter, adminProcedure, protectedProcedure } from '../trpc'

export const adminRouter = createTRPCRouter({
  listUsers: adminProcedure
    .input(z.object({
      role: z.enum(['RESIDENT', 'REPRESENTATIVE', 'ADMIN', 'AUDITOR']).optional(),
      limit: z.number().min(1).max(200).default(100),
    }))
    .query(async ({ ctx, input }) => {
      const where = input.role ? { role: input.role } : {}
      return ctx.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          address: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
      })
    }),

  updateUserRole: adminProcedure
    .input(z.object({
      id: z.string(),
      role: z.enum(['RESIDENT', 'REPRESENTATIVE', 'ADMIN', 'AUDITOR']),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.update({
        where: { id: input.id },
        data: { role: input.role },
      })
      await ctx.prisma.auditLog.create({
        data: {
          action: 'USER_ROLE_UPDATE',
          entityType: 'User',
          entityId: input.id,
          userId: ctx.user.id,
          detail: { newRole: input.role } as never,
        },
      })
      return user
    }),

  updateUserProfile: adminProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.update({
        where: { id: input.id },
        data: {
          name: input.name,
          phone: input.phone,
          address: input.address,
        },
      })
      await ctx.prisma.auditLog.create({
        data: {
          action: 'USER_PROFILE_UPDATE',
          entityType: 'User',
          entityId: input.id,
          userId: ctx.user.id,
        },
      })
      return user
    }),

  listVotingRules: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.votingRule.findMany({
      orderBy: { createdAt: 'desc' },
    })
  }),

  createVotingRule: adminProcedure
    .input(z.object({
      name: z.string().min(2),
      description: z.string().optional(),
      defaultVoteType: z.enum(['SINGLE', 'MULTIPLE', 'RANKED']).default('SINGLE'),
      defaultQuorum: z.number().int().min(1).optional(),
      defaultThreshold: z.number().min(0).max(1).default(0.5),
      allowAnonymous: z.boolean().default(false),
      allowAmendments: z.boolean().default(true),
      votingDurationHours: z.number().int().min(1).default(72),
      requireVerification: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      const rule = await ctx.prisma.votingRule.create({ data: input })
      await ctx.prisma.auditLog.create({
        data: {
          action: 'VOTING_RULE_CREATE',
          entityType: 'VotingRule',
          entityId: rule.id,
          userId: ctx.user.id,
        },
      })
      return rule
    }),

  updateVotingRule: adminProcedure
    .input(z.object({
      id: z.string(),
      description: z.string().optional(),
      defaultVoteType: z.enum(['SINGLE', 'MULTIPLE', 'RANKED']).optional(),
      defaultQuorum: z.number().int().min(1).optional(),
      defaultThreshold: z.number().min(0).max(1).optional(),
      allowAnonymous: z.boolean().optional(),
      allowAmendments: z.boolean().optional(),
      votingDurationHours: z.number().int().min(1).optional(),
      requireVerification: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      const rule = await ctx.prisma.votingRule.update({ where: { id }, data })
      await ctx.prisma.auditLog.create({
        data: {
          action: 'VOTING_RULE_UPDATE',
          entityType: 'VotingRule',
          entityId: id,
          userId: ctx.user.id,
        },
      })
      return rule
    }),

  deleteVotingRule: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.votingRule.delete({ where: { id: input.id } })
      await ctx.prisma.auditLog.create({
        data: {
          action: 'VOTING_RULE_DELETE',
          entityType: 'VotingRule',
          entityId: input.id,
          userId: ctx.user.id,
        },
      })
      return { success: true }
    }),

  listAuditLogs: adminProcedure
    .input(z.object({
      action: z.string().optional(),
      entityType: z.string().optional(),
      userId: z.string().optional(),
      limit: z.number().min(1).max(500).default(200),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: any = {}
      if (input.action) where.action = input.action
      if (input.entityType) where.entityType = input.entityType
      if (input.userId) where.userId = input.userId

      const [items, total] = await Promise.all([
        ctx.prisma.auditLog.findMany({
          where,
          include: { user: { select: { name: true, email: true } } },
          orderBy: { createdAt: 'desc' },
          take: input.limit + 1,
          cursor: input.cursor ? { id: input.cursor } : undefined,
        }),
        ctx.prisma.auditLog.count({ where }),
      ])
      let nextCursor: typeof input.cursor | undefined
      if (items.length > input.limit) {
        const nextItem = items.pop()
        nextCursor = nextItem?.id
      }
      return { items, nextCursor, total }
    }),

  exportAuditLogs: adminProcedure
    .input(z.object({
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
      entityType: z.string().optional(),
      action: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: any = {}
      if (input.startDate || input.endDate) {
        where.createdAt = {}
        if (input.startDate) where.createdAt.gte = input.startDate
        if (input.endDate) where.createdAt.lte = input.endDate
      }
      if (input.entityType) where.entityType = input.entityType
      if (input.action) where.action = input.action

      const logs = await ctx.prisma.auditLog.findMany({
        where,
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'asc' },
      })

      const headers = ['时间', '操作', '实体类型', '实体ID', '操作人', '邮箱', 'IP地址', '详情']
      const rows = logs.map(log => [
        log.createdAt.toISOString(),
        log.action,
        log.entityType,
        log.entityId || '',
        log.user?.name || '',
        log.user?.email || '',
        log.ipAddress || '',
        log.detail ? JSON.stringify(log.detail) : '',
      ])

      await ctx.prisma.auditLog.create({
        data: {
          action: 'AUDIT_LOG_EXPORT',
          entityType: 'AuditLog',
          userId: ctx.user.id,
          detail: input as never,
        },
      })

      return { headers, rows, count: logs.length }
    }),

  exportVotes: adminProcedure
    .input(z.object({ topicId: z.string() }))
    .query(async ({ ctx, input }) => {
      const topic = await ctx.prisma.topic.findUnique({
        where: { id: input.topicId },
        include: { options: true },
      })
      if (!topic) throw new Error('议题不存在')

      const votes = await ctx.prisma.vote.findMany({
        where: { topicId: input.topicId },
        include: {
          user: { select: { name: true, email: true } },
          option: { select: { label: true } },
        },
        orderBy: { votedAt: 'asc' },
      })

      const headers = topic.isAnonymous
        ? ['投票时间', '选项', '评论', '排序']
        : ['投票时间', '投票人', '邮箱', '选项', '评论', '排序']

      const rows = votes.map(vote => {
        const base = [
          vote.votedAt.toISOString(),
          vote.option.label,
          vote.comment || '',
          String(vote.rankOrder || ''),
        ]
        return topic.isAnonymous ? base : [
          vote.votedAt.toISOString(),
          vote.user.name || '',
          vote.user.email,
          vote.option.label,
          vote.comment || '',
          String(vote.rankOrder || ''),
        ]
      })

      await ctx.prisma.auditLog.create({
        data: {
          action: 'VOTE_EXPORT',
          entityType: 'Topic',
          entityId: input.topicId,
          userId: ctx.user.id,
        },
      })

      return { topic, headers, rows, count: votes.length }
    }),

  dashboardStats: adminProcedure.query(async ({ ctx }) => {
    const [userCount, topicCount, votingTopicCount, facilityCount, pendingDamages, volunteerTaskCount] = await Promise.all([
      ctx.prisma.user.count(),
      ctx.prisma.topic.count(),
      ctx.prisma.topic.count({ where: { status: 'VOTING' } }),
      ctx.prisma.facility.count(),
      ctx.prisma.damageReport.count({ where: { status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] } } }),
      ctx.prisma.volunteerTask.count(),
    ])

    const recentTopics = await ctx.prisma.topic.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { votes: true } } },
    })

    const recentDamages = await ctx.prisma.damageReport.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { facility: { select: { name: true, location: true } } },
    })

    return {
      userCount,
      topicCount,
      votingTopicCount,
      facilityCount,
      pendingDamages,
      volunteerTaskCount,
      recentTopics,
      recentDamages,
    }
  }),
})
