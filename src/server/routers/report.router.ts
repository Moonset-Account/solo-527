import { z } from 'zod';
import { router, adminProcedure } from '../trpc';
import { prisma } from '../db';
import { BookingStatus, DeviceStatus } from '@prisma/client';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

export const reportRouter = router({
  getDashboardStats: adminProcedure.query(async () => {
    const [totalDevices, totalBookings, activeMaintenance, totalUsers] =
      await Promise.all([
        prisma.device.count(),
        prisma.booking.count(),
        prisma.maintenanceRecord.count({
          where: { status: { in: ['REPORTED', 'IN_PROGRESS'] } },
        }),
        prisma.user.count(),
      ]);

    return { totalDevices, totalBookings, activeMaintenance, totalUsers };
  }),

  getDeviceUtilization: adminProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      const startDate = input.startDate || subMonths(new Date(), 1);
      const endDate = input.endDate || new Date();

      return prisma.device.findMany({
        include: {
          type: { select: { id: true, name: true } },
          bookings: {
            where: {
              status: BookingStatus.COMPLETED,
              startTime: { gte: startDate },
              endTime: { lte: endDate },
            },
          },
        },
      });
    }),

  getBookingTrend: adminProcedure
    .input(
      z.object({
        months: z.number().default(6),
      })
    )
    .query(async ({ input }) => {
      const result = [];
      for (let i = input.months - 1; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(new Date(), i));
        const monthEnd = endOfMonth(subMonths(new Date(), i));

        const count = await prisma.booking.count({
          where: {
            createdAt: { gte: monthStart, lte: monthEnd },
          },
        });

        result.push({
          month: monthStart.toISOString().slice(0, 7),
          count,
        });
      }
      return result;
    }),

  exportBookings: adminProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
        format: z.enum(['excel', 'pdf']),
      })
    )
    .query(async ({ input }) => {
      const bookings = await prisma.booking.findMany({
        where: {
          createdAt: { gte: input.startDate, lte: input.endDate },
        },
        include: {
          user: { select: { name: true, email: true } },
          device: { select: { name: true } },
          project: { select: { name: true, projectNumber: true } },
        },
      });

      return {
        bookings,
        format: input.format,
      };
    }),
});
