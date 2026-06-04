import { prisma } from '../db';
import { BookingStatus, DeviceStatus, MaintenanceStatus, NotificationType } from '@prisma/client';

export class MaintenanceService {
  static async reportMaintenance(data: {
    deviceId: string;
    reportedBy: string;
    description: string;
    startTime: Date;
    estimatedEndTime?: Date;
  }) {
    await prisma.device.update({
      where: { id: data.deviceId },
      data: { status: DeviceStatus.MAINTENANCE },
    });

    const maintenance = await prisma.maintenanceRecord.create({
      data: {
        ...data,
        status: MaintenanceStatus.REPORTED,
      },
      include: {
        device: true,
      },
    });

    await this.handleMaintenanceImpact(maintenance.id);

    return maintenance;
  }

  static async handleMaintenanceImpact(maintenanceId: string) {
    const maintenance = await prisma.maintenanceRecord.findUnique({
      where: { id: maintenanceId },
      include: { device: true },
    });

    if (!maintenance) return;

    const affectedBookings = await prisma.booking.findMany({
      where: {
        deviceId: maintenance.deviceId,
        status: { in: [BookingStatus.APPROVED, BookingStatus.PENDING_ADMIN, BookingStatus.PENDING_MENTOR] },
        startTime: { lte: maintenance.estimatedEndTime || new Date('2100-01-01') },
        endTime: { gte: maintenance.startTime },
      },
      include: { user: true },
    });

    for (const booking of affectedBookings) {
      await prisma.$transaction(async (tx) => {
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: BookingStatus.CANCELLED,
            cancelledReason: '设备故障维护',
            affectedMaintenanceId: maintenanceId,
          },
        });

        await tx.compensationRecord.create({
          data: {
            bookingId: booking.id,
            reason: '设备故障导致预约取消',
            priorityBonus: 1,
          },
        });

        await tx.notification.create({
          data: {
            userId: booking.userId,
            title: '预约因设备故障被取消',
            content: `您预约的 ${maintenance.device.name} 因故障需要维护，预约已被自动取消。系统已为您记录补偿，下次预约将享有优先权。`,
            type: NotificationType.MAINTENANCE_ALERT,
            relatedBookingId: booking.id,
            relatedMaintenanceId: maintenanceId,
          },
        });
      });
    }

    await prisma.maintenanceRecord.update({
      where: { id: maintenanceId },
      data: {
        status: MaintenanceStatus.IN_PROGRESS,
      },
    });

    return affectedBookings;
  }

  static async getMaintenanceImpact(maintenanceId: string) {
    const maintenance = await prisma.maintenanceRecord.findUnique({
      where: { id: maintenanceId },
      include: {
        device: true,
        affectedBookings: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
            project: {
              select: { id: true, name: true, projectNumber: true },
            },
          },
        },
      },
    });

    if (!maintenance) {
      throw new Error('维护记录不存在');
    }

    return {
      maintenance,
      affectedBookingCount: maintenance.affectedBookings.length,
      affectedUsers: maintenance.affectedBookings.map((b) => b.user),
    };
  }

  static async resolveMaintenance(maintenanceId: string, resolutionNotes: string) {
    const maintenance = await prisma.maintenanceRecord.findUnique({
      where: { id: maintenanceId },
      include: { device: true },
    });

    if (!maintenance) {
      throw new Error('维护记录不存在');
    }

    if (maintenance.status === MaintenanceStatus.RESOLVED) {
      throw new Error('该维护记录已解决');
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.maintenanceRecord.update({
        where: { id: maintenanceId },
        data: {
          status: MaintenanceStatus.RESOLVED,
          actualEndTime: new Date(),
          resolutionNotes,
        },
      });

      await tx.device.update({
        where: { id: maintenance.deviceId },
        data: { status: DeviceStatus.AVAILABLE },
      });

      const affectedNotifications = await tx.notification.findMany({
        where: {
          type: NotificationType.MAINTENANCE_ALERT,
          relatedMaintenanceId: maintenanceId,
        },
        select: { userId: true },
      });

      const uniqueUserIds = [...new Set(affectedNotifications.map((n) => n.userId))];

      await Promise.all(
        uniqueUserIds.map((userId) =>
          tx.notification.create({
            data: {
              userId,
              title: '设备已恢复可用',
              content: `${maintenance.device.name} 已完成维护并恢复正常使用，您可以重新预约了。`,
              type: NotificationType.MAINTENANCE_ALERT,
              relatedMaintenanceId: maintenanceId,
            },
          })
        )
      );

      return tx.maintenanceRecord.findUnique({
        where: { id: maintenanceId },
        include: {
          device: { select: { id: true, name: true, location: true } },
          reporter: { select: { id: true, name: true } },
          _count: { select: { affectedBookings: true } },
        },
      });
    });

    return updated;
  }

  static async updateMaintenanceStatus(
    maintenanceId: string,
    status: MaintenanceStatus,
    resolutionNotes?: string
  ) {
    const maintenance = await prisma.maintenanceRecord.findUnique({
      where: { id: maintenanceId },
      include: { device: true },
    });

    if (!maintenance) {
      throw new Error('维护记录不存在');
    }

    const data: any = { status };
    if (status === MaintenanceStatus.RESOLVED) {
      data.actualEndTime = new Date();
      data.resolutionNotes = resolutionNotes;

      await prisma.device.update({
        where: { id: maintenance.deviceId },
        data: { status: DeviceStatus.AVAILABLE },
      });

      const waitingUsers = await prisma.notification.findMany({
        where: {
          type: NotificationType.MAINTENANCE_ALERT,
          relatedMaintenanceId: maintenanceId,
        },
        select: { userId: true },
      });

      const uniqueUserIds = [...new Set(waitingUsers.map((n) => n.userId))];

      await Promise.all(
        uniqueUserIds.map((userId) =>
          prisma.notification.create({
            data: {
              userId,
              title: '设备已恢复可用',
              content: `${maintenance.device.name} 已完成维护并恢复正常使用，您可以重新预约了。`,
              type: NotificationType.MAINTENANCE_ALERT,
              relatedMaintenanceId: maintenanceId,
            },
          })
        )
      );
    }

    return prisma.maintenanceRecord.update({
      where: { id: maintenanceId },
      data,
    });
  }
}
