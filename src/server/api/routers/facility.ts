import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, representativeProcedure, publicProcedure, adminProcedure } from '../trpc'

export const facilityRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({
      status: z.enum(['NORMAL', 'DAMAGED', 'UNDER_REPAIR', 'REPAIRED', 'RECTIFIED']).optional(),
      type: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {}
      if (input.status) where.status = input.status
      if (input.type) where.type = input.type
      const [items, total] = await Promise.all([
        ctx.prisma.facility.findMany({
          where,
          include: { _count: { select: { photos: true, damageReports: true } } },
          orderBy: { createdAt: 'desc' },
          take: input.limit,
        }),
        ctx.prisma.facility.count({ where }),
      ])
      return { items, total }
    }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const facility = await ctx.prisma.facility.findUnique({
        where: { id: input.id },
        include: {
          photos: { orderBy: { createdAt: 'desc' } },
          damageReports: {
            orderBy: { createdAt: 'desc' },
            include: { reporter: { select: { name: true } } },
          },
          reviews: {
            orderBy: { createdAt: 'desc' },
          },
        },
      })
      if (!facility) throw new Error('设施不存在')
      return facility
    }),

  create: representativeProcedure
    .input(z.object({
      name: z.string().min(2),
      type: z.string().min(1),
      location: z.string().min(1),
      description: z.string().optional(),
      photoUrls: z.array(z.string().url()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.$transaction(async (tx) => {
        const facility = await tx.facility.create({
          data: {
            name: input.name,
            type: input.type,
            location: input.location,
            description: input.description,
          },
        })
        if (input.photoUrls?.length) {
          await tx.facilityPhoto.createMany({
            data: input.photoUrls.map(url => ({
              facilityId: facility.id,
              url,
              uploadedBy: ctx.user.id,
            })),
          })
        }
        await tx.auditLog.create({
          data: {
            action: 'FACILITY_CREATE',
            entityType: 'Facility',
            entityId: facility.id,
            userId: ctx.user.id,
          },
        })
        return facility
      })
    }),

  addPhoto: protectedProcedure
    .input(z.object({
      facilityId: z.string(),
      url: z.string().url(),
      caption: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const photo = await ctx.prisma.facilityPhoto.create({
        data: {
          facilityId: input.facilityId,
          url: input.url,
          caption: input.caption,
          uploadedBy: ctx.user.id,
        },
      })
      await ctx.prisma.auditLog.create({
        data: {
          action: 'FACILITY_ADD_PHOTO',
          entityType: 'Facility',
          entityId: input.facilityId,
          userId: ctx.user.id,
        },
      })
      return photo
    }),

  updateStatus: representativeProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(['NORMAL', 'DAMAGED', 'UNDER_REPAIR', 'REPAIRED', 'RECTIFIED']),
    }))
    .mutation(async ({ ctx, input }) => {
      const facility = await ctx.prisma.facility.update({
        where: { id: input.id },
        data: { status: input.status, lastCheckedAt: new Date() },
      })
      await ctx.prisma.auditLog.create({
        data: {
          action: 'FACILITY_STATUS_UPDATE',
          entityType: 'Facility',
          entityId: input.id,
          userId: ctx.user.id,
          detail: { status: input.status } as never,
        },
      })
      return facility
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.facility.delete({ where: { id: input.id } })
      await ctx.prisma.auditLog.create({
        data: {
          action: 'FACILITY_DELETE',
          entityType: 'Facility',
          entityId: input.id,
          userId: ctx.user.id,
        },
      })
      return { success: true }
    }),

  reportDamage: protectedProcedure
    .input(z.object({
      facilityId: z.string(),
      title: z.string().min(2),
      description: z.string().min(5),
      photoUrl: z.string().url().optional(),
      priority: z.number().min(1).max(5).default(1),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.$transaction(async (tx) => {
        const report = await tx.damageReport.create({
          data: {
            facilityId: input.facilityId,
            reporterId: ctx.user.id,
            title: input.title,
            description: input.description,
            photoUrl: input.photoUrl,
            priority: input.priority,
            status: 'PENDING',
          },
        })
        await tx.facility.update({
          where: { id: input.facilityId },
          data: { status: 'DAMAGED' },
        })
        await tx.auditLog.create({
          data: {
            action: 'DAMAGE_REPORT_CREATE',
            entityType: 'DamageReport',
            entityId: report.id,
            userId: ctx.user.id,
          },
        })
        return report
      })
    }),

  listDamageReports: protectedProcedure
    .input(z.object({
      status: z.enum(['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'REVIEWED']).optional(),
      facilityId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {}
      if (input.status) where.status = input.status
      if (input.facilityId) where.facilityId = input.facilityId
      return ctx.prisma.damageReport.findMany({
        where,
        include: {
          facility: { select: { name: true, location: true } },
          reporter: { select: { name: true } },
        },
        orderBy: { priority: 'desc', createdAt: 'desc' },
      })
    }),

  updateDamageReport: representativeProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'REVIEWED']).optional(),
      assignedTo: z.string().optional(),
      resultNote: z.string().optional(),
      resultPhotoUrl: z.string().url().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const data: Record<string, unknown> = {}
      if (input.status) {
        data.status = input.status
        if (input.status === 'COMPLETED') data.resolvedAt = new Date()
      }
      if (input.assignedTo !== undefined) data.assignedTo = input.assignedTo
      if (input.resultNote !== undefined) data.resultNote = input.resultNote
      if (input.resultPhotoUrl !== undefined) data.resultPhotoUrl = input.resultPhotoUrl

      const report = await ctx.prisma.damageReport.update({
        where: { id: input.id },
        data,
      })

      if (input.status === 'COMPLETED') {
        await ctx.prisma.facility.update({
          where: { id: report.facilityId },
          data: { status: 'REPAIRED' },
        })
      }

      await ctx.prisma.auditLog.create({
        data: {
          action: 'DAMAGE_REPORT_UPDATE',
          entityType: 'DamageReport',
          entityId: input.id,
          userId: ctx.user.id,
          detail: input as never,
        },
      })
      return report
    }),

  createReview: representativeProcedure
    .input(z.object({
      damageReportId: z.string(),
      facilityId: z.string(),
      result: z.string().min(5),
      photoUrl: z.string().url().optional(),
      isPassed: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.$transaction(async (tx) => {
        const review = await tx.rectificationReview.create({
          data: {
            damageReportId: input.damageReportId,
            facilityId: input.facilityId,
            result: input.result,
            photoUrl: input.photoUrl,
            isPassed: input.isPassed,
          },
        })
        await tx.damageReport.update({
          where: { id: input.damageReportId },
          data: { status: 'REVIEWED' },
        })
        if (input.isPassed) {
          await tx.facility.update({
            where: { id: input.facilityId },
            data: { status: 'RECTIFIED', lastCheckedAt: new Date() },
          })
        }
        await tx.auditLog.create({
          data: {
            action: 'RECTIFICATION_REVIEW_CREATE',
            entityType: 'RectificationReview',
            entityId: review.id,
            userId: ctx.user.id,
            detail: { isPassed: input.isPassed } as never,
          },
        })
        return review
      })
    }),
})
