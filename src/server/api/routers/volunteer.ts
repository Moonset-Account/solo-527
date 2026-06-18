import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, representativeProcedure, adminProcedure } from '../trpc'

export const volunteerRouter = createTRPCRouter({
  listBindableDamageReports: representativeProcedure
    .query(async ({ ctx }) => {
      return ctx.prisma.damageReport.findMany({
        where: {
          status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] },
        },
        include: {
          facility: { select: { name: true, location: true } },
        },
        orderBy: { priority: 'desc' },
      })
    }),

  listTasks: protectedProcedure
    .input(z.object({
      status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']).optional(),
      mineOnly: z.boolean().default(false),
    }))
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {}
      if (input.status) where.status = input.status
      if (input.mineOnly) where.assigneeId = ctx.user.id
      return ctx.prisma.volunteerTask.findMany({
        where,
        include: {
          assignee: { select: { name: true, email: true } },
          damageReport: {
            select: {
              id: true,
              title: true,
              status: true,
              facility: { select: { name: true, location: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    }),

  stats: protectedProcedure
    .query(async ({ ctx }) => {
      const totalTasks = await ctx.prisma.volunteerTask.count()
      const completedTasks = await ctx.prisma.volunteerTask.count({ where: { status: 'COMPLETED' } })
      const myTasks = await ctx.prisma.volunteerTask.count({ where: { assigneeId: ctx.user.id } })
      const myCompletedTasks = await ctx.prisma.volunteerTask.count({
        where: { assigneeId: ctx.user.id, status: 'COMPLETED' },
      })
      const totalHours = await ctx.prisma.volunteerTask.aggregate({
        _sum: { hoursSpent: true },
        where: { status: 'COMPLETED' },
      })
      const myHours = await ctx.prisma.volunteerTask.aggregate({
        _sum: { hoursSpent: true },
        where: { assigneeId: ctx.user.id, status: 'COMPLETED' },
      })
      const byType = await ctx.prisma.volunteerTask.groupBy({
        by: ['type'],
        _count: { id: true },
        _sum: { hoursSpent: true },
      })
      const damageRelatedTasks = await ctx.prisma.volunteerTask.count({
        where: { damageReportId: { not: null }, status: 'COMPLETED' },
      })

      return {
        totalTasks,
        completedTasks,
        myTasks,
        myCompletedTasks,
        totalHours: totalHours._sum.hoursSpent ?? 0,
        myHours: myHours._sum.hoursSpent ?? 0,
        byType,
        damageRelatedTasks,
      }
    }),

  createTask: representativeProcedure
    .input(z.object({
      title: z.string().min(2),
      description: z.string().min(5),
      type: z.string().min(1),
      damageReportId: z.string().optional(),
      scheduledAt: z.coerce.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.$transaction(async (tx) => {
        const task = await tx.volunteerTask.create({
          data: {
            title: input.title,
            description: input.description,
            type: input.type,
            damageReportId: input.damageReportId,
            scheduledAt: input.scheduledAt,
            status: 'PENDING',
          },
        })
        if (input.damageReportId) {
          await tx.damageReport.update({
            where: { id: input.damageReportId },
            data: { status: 'ASSIGNED' },
          })
        }
        await tx.auditLog.create({
          data: {
            action: 'VOLUNTEER_TASK_CREATE',
            entityType: 'VolunteerTask',
            entityId: task.id,
            userId: ctx.user.id,
            detail: { damageReportId: input.damageReportId } as never,
          },
        })
        return task
      })
    }),

  signUp: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.$transaction(async (tx) => {
        const task = await tx.volunteerTask.update({
          where: { id: input.id },
          data: { assigneeId: ctx.user.id, status: 'CONFIRMED' },
        })
        if (task.damageReportId) {
          await tx.damageReport.update({
            where: { id: task.damageReportId },
            data: { status: 'IN_PROGRESS', assignedTo: ctx.user.id },
          })
        }
        await tx.auditLog.create({
          data: {
            action: 'VOLUNTEER_SIGNUP',
            entityType: 'VolunteerTask',
            entityId: input.id,
            userId: ctx.user.id,
            detail: { damageReportId: task.damageReportId } as never,
          },
        })
        return task
      })
    }),

  completeTask: protectedProcedure
    .input(z.object({
      id: z.string(),
      hoursSpent: z.number().min(0.5).optional(),
      note: z.string().optional(),
      resultNote: z.string().optional(),
      resultPhotoUrl: z.string().url().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.$transaction(async (tx) => {
        const task = await tx.volunteerTask.findUnique({ where: { id: input.id } })
        if (!task) throw new Error('任务不存在')
        if (task.assigneeId !== ctx.user.id && ctx.user.role !== 'ADMIN' && ctx.user.role !== 'REPRESENTATIVE') {
          throw new Error('只能完成自己报名的任务')
        }
        const updated = await tx.volunteerTask.update({
          where: { id: input.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            hoursSpent: input.hoursSpent,
            note: input.note,
          },
        })
        if (task.damageReportId) {
          const damageUpdateData: any = { status: 'COMPLETED', resolvedAt: new Date() }
          if (input.resultNote) damageUpdateData.resultNote = input.resultNote
          if (input.resultPhotoUrl) damageUpdateData.resultPhotoUrl = input.resultPhotoUrl
          await tx.damageReport.update({
            where: { id: task.damageReportId },
            data: damageUpdateData,
          })
        }
        await tx.auditLog.create({
          data: {
            action: 'VOLUNTEER_TASK_COMPLETE',
            entityType: 'VolunteerTask',
            entityId: input.id,
            userId: ctx.user.id,
            detail: {
              hoursSpent: input.hoursSpent,
              damageReportId: task.damageReportId,
              resultNote: input.resultNote,
            } as never,
          },
        })
        return updated
      })
    }),

  cancelSignUp: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.$transaction(async (tx) => {
        const task = await tx.volunteerTask.update({
          where: { id: input.id, assigneeId: ctx.user.id },
          data: { assigneeId: null, status: 'PENDING' },
        })
        if (task.damageReportId) {
          const existingOther = await tx.volunteerTask.count({
            where: { damageReportId: task.damageReportId, status: { in: ['CONFIRMED'] } },
          })
          await tx.damageReport.update({
            where: { id: task.damageReportId },
            data: { status: existingOther > 0 ? 'IN_PROGRESS' : 'PENDING', assignedTo: null },
          })
        }
        await tx.auditLog.create({
          data: {
            action: 'VOLUNTEER_CANCEL',
            entityType: 'VolunteerTask',
            entityId: input.id,
            userId: ctx.user.id,
          },
        })
        return task
      })
    }),

  deleteTask: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.volunteerTask.delete({ where: { id: input.id } })
      await ctx.prisma.auditLog.create({
        data: {
          action: 'VOLUNTEER_TASK_DELETE',
          entityType: 'VolunteerTask',
          entityId: input.id,
          userId: ctx.user.id,
        },
      })
      return { success: true }
    }),
})
