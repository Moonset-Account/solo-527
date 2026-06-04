import { z } from 'zod';
import { router, protectedProcedure, adminProcedure } from '../trpc';
import { prisma } from '../db';
import { DeviceStatus } from '@prisma/client';

export const deviceRouter = router({
  getAll: protectedProcedure
    .input(
      z.object({
        typeId: z.string().optional(),
        status: z.nativeEnum(DeviceStatus).optional(),
        location: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      return prisma.device.findMany({
        where: {
          typeId: input.typeId,
          status: input.status,
          location: input.location,
          OR: input.search
            ? [
                { name: { contains: input.search, mode: 'insensitive' } },
                { model: { contains: input.search, mode: 'insensitive' } },
              ]
            : undefined,
        },
        include: {
          type: { select: { id: true, name: true } },
          _count: {
            select: { bookings: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
        skip: input.offset,
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return prisma.device.findUnique({
        where: { id: input.id },
        include: {
        type: true,
        maintenanceRecords: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      });
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string(),
        typeId: z.string(),
        model: z.string().optional(),
        location: z.string().optional(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
        requiresNightAuthorization: z.boolean().default(true),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.device.create({ data: input });
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        status: z.nativeEnum(DeviceStatus).optional(),
        location: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return prisma.device.update({ where: { id }, data });
    }),

  getTypes: protectedProcedure.query(async () => {
      return prisma.deviceType.findMany({
        include: { _count: { select: { devices: true } } },
      });
    }),

  createType: adminProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        requiresCertificate: z.boolean().default(true),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.deviceType.create({ data: input });
    }),
});
