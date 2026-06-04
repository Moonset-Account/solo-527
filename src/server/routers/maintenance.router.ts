import { z } from 'zod';
import { router, maintenanceProcedure, protectedProcedure } from '../trpc';
import { MaintenanceService } from '../services/maintenance.service';
import { prisma } from '../db';
import { MaintenanceStatus } from '@prisma/client';

export const maintenanceRouter = router({
  report: maintenanceProcedure
    .input(
      z.object({
        deviceId: z.string(),
        description: z.string().min(10),
        startTime: z.date(),
        estimatedEndTime: z.date().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return MaintenanceService.reportMaintenance({
        ...input,
        reportedBy: ctx.user.id,
      });
    }),

  getImpact: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return MaintenanceService.getMaintenanceImpact(input.id);
    }),

  resolve: maintenanceProcedure
    .input(
      z.object({
        id: z.string(),
        resolutionNotes: z.string().min(5),
      })
    )
    .mutation(async ({ input }) => {
      return MaintenanceService.resolveMaintenance(input.id, input.resolutionNotes);
    }),

  updateStatus: maintenanceProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.nativeEnum(MaintenanceStatus),
        resolutionNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return MaintenanceService.updateMaintenanceStatus(input.id, input.status, input.resolutionNotes);
    }),

  getAll: protectedProcedure
    .input(
      z.object({
        status: z.nativeEnum(MaintenanceStatus).optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      return prisma.maintenanceRecord.findMany({
        where: { status: input.status },
        include: {
          device: { select: { id: true, name: true, location: true } },
          reporter: { select: { id: true, name: true } },
          _count: {
            select: { affectedBookings: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
        skip: input.offset,
      });
    }),

  getByDevice: protectedProcedure
    .input(z.object({ deviceId: z.string() }))
    .query(async ({ input }) => {
      return prisma.maintenanceRecord.findMany({
        where: { deviceId: input.deviceId },
        include: {
          reporter: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }),
});
