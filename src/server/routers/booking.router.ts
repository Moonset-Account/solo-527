import { z } from 'zod';
import { router, protectedProcedure, studentProcedure, mentorProcedure, adminProcedure } from '../trpc';
import { BookingService } from '../services/booking.service';
import { prisma } from '../db';
import { BookingStatus } from '@prisma/client';

export const bookingRouter = router({
  create: studentProcedure
    .input(
      z.object({
        deviceId: z.string(),
        projectId: z.string(),
        startTime: z.date(),
        endTime: z.date(),
        purpose: z.string().min(10),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return BookingService.createBooking({
        ...input,
        userId: ctx.user.id,
      });
    }),

  checkConflict: protectedProcedure
    .input(
      z.object({
        deviceId: z.string(),
        startTime: z.date(),
        endTime: z.date(),
      })
    )
    .query(async ({ input }) => {
      const hasConflict = await BookingService.checkConflict(input.deviceId, input.startTime, input.endTime);
      const hasMaintenanceConflict = await BookingService.checkMaintenanceConflict(input.deviceId, input.startTime, input.endTime);
      return { hasConflict, hasMaintenanceConflict, isNightBooking: BookingService.isNightBooking(input.startTime, input.endTime) };
    }),

  getMyBookings: protectedProcedure
    .input(
      z.object({
        status: z.nativeEnum(BookingStatus).optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      return prisma.booking.findMany({
        where: {
          userId: ctx.user.id,
          status: input.status,
        },
        include: {
          device: { select: { id: true, name: true, location: true } },
          project: { select: { id: true, name: true, projectNumber: true } },
          compensation: true,
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
        skip: input.offset,
      });
    }),

  getForMentorApproval: mentorProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      return prisma.booking.findMany({
        where: {
          project: { mentorId: ctx.user.id },
          status: BookingStatus.PENDING_MENTOR,
        },
        include: {
          user: { select: { id: true, name: true, email: true, studentId: true } },
          device: { select: { id: true, name: true } },
          project: { select: { id: true, name: true, projectNumber: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
        skip: input.offset,
      });
    }),

  getForAdminApproval: adminProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      return prisma.booking.findMany({
        where: {
          status: BookingStatus.PENDING_ADMIN,
        },
        include: {
          user: { select: { id: true, name: true, email: true, studentId: true } },
          device: { select: { id: true, name: true } },
          project: { select: { id: true, name: true, projectNumber: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
        skip: input.offset,
      });
    }),

  approveByMentor: mentorProcedure
    .input(
      z.object({
        bookingId: z.string(),
        approved: z.boolean(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return BookingService.approveByMentor(input.bookingId, ctx.user.id, input.approved, input.reason);
    }),

  approveByAdmin: adminProcedure
    .input(
      z.object({
        bookingId: z.string(),
        approved: z.boolean(),
        nightAuthorized: z.boolean().default(false),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return BookingService.approveByAdmin(input.bookingId, ctx.user.id, input.approved, input.nightAuthorized, input.reason);
    }),

  cancel: protectedProcedure
    .input(
      z.object({
        bookingId: z.string(),
        reason: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return BookingService.cancelBooking(input.bookingId, ctx.user.id, input.reason);
    }),

  getByDevice: protectedProcedure
    .input(
      z.object({
        deviceId: z.string(),
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ input }) => {
      return prisma.booking.findMany({
        where: {
          deviceId: input.deviceId,
          status: { in: [BookingStatus.APPROVED, BookingStatus.PENDING_ADMIN] },
          startTime: { lte: input.endDate },
          endTime: { gte: input.startDate },
        },
        include: {
          user: { select: { id: true, name: true } },
        },
      });
    }),

  getDetail: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const booking = await prisma.booking.findUnique({
        where: { id: input.id },
        include: {
          device: true,
          user: { select: { id: true, name: true, email: true, studentId: true } },
          project: true,
          compensation: true,
          affectedByMaintenance: true,
        },
      });

      if (!booking) {
        throw new Error('预约不存在');
      }

      if (
        ctx.user.role !== 'ADMIN' &&
        ctx.user.id !== booking.userId &&
        booking.project.mentorId !== ctx.user.id
      ) {
        if (booking.project.mentorId !== ctx.user.id) {
          throw new Error('无权限查看此预约');
        }
      }

      return booking;
    }),
});
