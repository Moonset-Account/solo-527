import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { markNotificationAsRead, markAllNotificationsAsRead } from "@/lib/notifications";
import { NotificationType, NotificationStatus } from "@prisma/client";

export const notificationRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
        type: z.nativeEnum(NotificationType).optional(),
        status: z.nativeEnum(NotificationStatus).optional(),
        unreadOnly: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = { userId: ctx.userId };

      if (input.type) where.type = input.type;
      if (input.status) where.status = input.status;
      if (input.unreadOnly) {
        where.status = {
          in: [NotificationStatus.PENDING, NotificationStatus.SENT, NotificationStatus.DELIVERED],
        };
      }

      const skip = (input.page - 1) * input.pageSize;
      const take = input.pageSize;

      const [items, total, unreadCount] = await Promise.all([
        ctx.prisma.notification.findMany({
          where,
          include: {
            repairRequest: { select: { id: true, title: true } },
            trade: { select: { id: true, title: true } },
            complaint: { select: { id: true, title: true } },
            refund: { select: { id: true, amount: true } },
          },
          skip,
          take,
          orderBy: { createdAt: "desc" },
        }),
        ctx.prisma.notification.count({ where }),
        ctx.prisma.notification.count({
          where: {
            userId: ctx.userId,
            status: {
              in: [NotificationStatus.PENDING, NotificationStatus.SENT, NotificationStatus.DELIVERED],
            },
          },
        }),
      ]);

      return {
        items,
        total,
        unreadCount,
        page: input.page,
        pageSize: input.pageSize,
        totalPages: Math.ceil(total / input.pageSize),
      };
    }),

  markAsRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return markNotificationAsRead(input.id, ctx.userId);
    }),

  markAllAsRead: protectedProcedure
    .mutation(async ({ ctx }) => {
      return markAllNotificationsAsRead(ctx.userId);
    }),

  getUnreadCount: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.prisma.notification.count({
        where: {
          userId: ctx.userId,
          status: {
            in: [NotificationStatus.PENDING, NotificationStatus.SENT, NotificationStatus.DELIVERED],
          },
        },
      });
    }),
});
