import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import { prisma } from "@/server/db/prisma";
import { createAuditLog } from "@/server/services/auditLogService";

export const vehicleRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(20),
        keyword: z.string().optional(),
        brand: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { page, pageSize, keyword, brand } = input;
      const skip = (page - 1) * pageSize;

      const where: Record<string, unknown> = {};
      if (keyword) {
        where.OR = [
          { plateNumber: { contains: keyword, mode: "insensitive" } },
          { ownerName: { contains: keyword, mode: "insensitive" } },
          { ownerPhone: { contains: keyword } },
          { brand: { contains: keyword, mode: "insensitive" } },
          { model: { contains: keyword, mode: "insensitive" } },
        ];
      }
      if (brand) {
        where.brand = brand;
      }

      const [data, total] = await Promise.all([
        prisma.vehicle.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: "desc" },
          include: {
            _count: {
              select: { workOrders: true },
            },
          },
        }),
        prisma.vehicle.count({ where }),
      ]);

      return { data, total, page, pageSize };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: input.id },
        include: {
          workOrders: {
            take: 10,
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!vehicle) {
        throw new Error("车辆不存在");
      }

      return vehicle;
    }),

  create: protectedProcedure
    .input(
      z.object({
        plateNumber: z.string(),
        brand: z.string(),
        model: z.string(),
        year: z.number(),
        color: z.string(),
        vin: z.string(),
        ownerName: z.string(),
        ownerPhone: z.string(),
        mileage: z.number().default(0),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const existing = await prisma.vehicle.findFirst({
        where: {
          OR: [{ plateNumber: input.plateNumber }, { vin: input.vin }],
        },
      });

      if (existing) {
        throw new Error("车牌号或车架号已存在");
      }

      const vehicle = await prisma.vehicle.create({
        data: input,
      });

      await createAuditLog({
        action: "CREATE",
        entityType: "VEHICLE",
        entityId: vehicle.id,
        newValue: vehicle,
        userId: ctx.userId,
        userName: "当前用户",
      });

      return vehicle;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        plateNumber: z.string().optional(),
        brand: z.string().optional(),
        model: z.string().optional(),
        year: z.number().optional(),
        color: z.string().optional(),
        vin: z.string().optional(),
        ownerName: z.string().optional(),
        ownerPhone: z.string().optional(),
        mileage: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const oldVehicle = await prisma.vehicle.findUnique({
        where: { id: input.id },
      });

      if (!oldVehicle) {
        throw new Error("车辆不存在");
      }

      const vehicle = await prisma.vehicle.update({
        where: { id: input.id },
        data: input,
      });

      await createAuditLog({
        action: "UPDATE",
        entityType: "VEHICLE",
        entityId: vehicle.id,
        oldValue: oldVehicle,
        newValue: vehicle,
        userId: ctx.userId,
        userName: "当前用户",
      });

      return vehicle;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const workOrderCount = await prisma.workOrder.count({
        where: { vehicleId: input.id },
      });

      if (workOrderCount > 0) {
        throw new Error("该车辆存在关联工单，无法删除");
      }

      const vehicle = await prisma.vehicle.delete({
        where: { id: input.id },
      });

      await createAuditLog({
        action: "DELETE",
        entityType: "VEHICLE",
        entityId: input.id,
        oldValue: vehicle,
        userId: ctx.userId,
        userName: "当前用户",
      });

      return true;
    }),
});
