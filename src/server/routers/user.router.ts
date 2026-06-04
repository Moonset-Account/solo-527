import { z } from 'zod';
import { router, protectedProcedure, adminProcedure } from '../trpc';
import { prisma } from '../db';
import { UserRole } from '@prisma/client';

export const userRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    return prisma.user.findUnique({
      where: { id: ctx.user.id },
      include: {
        certificates: true,
        _count: {
          select: { bookings: true },
        },
      },
    });
  }),

  getMyProjects: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role === 'MENTOR') {
      return prisma.project.findMany({
        where: { mentorId: ctx.user.id },
        include: {
          _count: { select: { members: true, bookings: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }
    return prisma.project.findMany({
      where: { members: { some: { id: ctx.user.id } } },
      include: {
        mentor: { select: { id: true, name: true } },
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }),

  uploadCertificate: protectedProcedure
    .input(
      z.object({
        deviceTypeId: z.string(),
        title: z.string(),
        fileUrl: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return prisma.certificate.create({
        data: {
          ...input,
          userId: ctx.user.id,
        },
      });
    }),

  getMyCertificates: protectedProcedure.query(async ({ ctx }) => {
    return prisma.certificate.findMany({
      where: { userId: ctx.user.id },
      include: {
        deviceType: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }),

  verifyCertificate: adminProcedure
    .input(
      z.object({
        certificateId: z.string(),
        verified: z.boolean(),
        expiresAt: z.date().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return prisma.certificate.update({
        where: { id: input.certificateId },
        data: {
          verified: input.verified,
          verifiedAt: new Date(),
          verifiedBy: ctx.user.id,
          expiresAt: input.expiresAt,
        },
      });
    }),

  getUsers: adminProcedure
    .input(
      z.object({
        role: z.nativeEnum(UserRole).optional(),
        department: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      return prisma.user.findMany({
        where: {
          role: input.role,
          department: input.department,
          OR: input.search
            ? [
                { name: { contains: input.search, mode: 'insensitive' } },
                { email: { contains: input.search, mode: 'insensitive' } },
                { studentId: { contains: input.search, mode: 'insensitive' } },
              ]
            : undefined,
        },
        include: {
          _count: {
            select: { bookings: true, certificates: true },
          },
        },
        orderBy: { name: 'asc' },
        take: input.limit,
        skip: input.offset,
      });
    }),

  updateSafetyTraining: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        hasCompleted: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.user.update({
        where: { id: input.userId },
        data: {
          hasCompletedSafetyTraining: input.hasCompleted,
          safetyTrainingDate: input.hasCompleted ? new Date() : null,
        },
      });
    }),
});
