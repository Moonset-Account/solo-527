import { prisma } from '../db';
import { BookingStatus, MaintenanceStatus, NotificationType } from '@prisma/client';
import { addHours, isWithinInterval } from 'date-fns';

export class BookingService {
  static async checkConflict(
    deviceId: string,
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string
  ): Promise<boolean> {
    const overlappingBookings = await prisma.booking.findMany({
      where: {
        deviceId,
        id: excludeBookingId ? { not: excludeBookingId } : undefined,
        status: {
          in: [BookingStatus.APPROVED, BookingStatus.PENDING_MENTOR, BookingStatus.PENDING_ADMIN],
        },
        OR: [
          {
            startTime: { lte: startTime },
            endTime: { gt: startTime },
          },
          {
            startTime: { lt: endTime },
            endTime: { gte: endTime },
          },
          {
            startTime: { gte: startTime },
            endTime: { lte: endTime },
          },
        ],
      },
    });

    return overlappingBookings.length > 0;
  }

  static async checkMaintenanceConflict(
    deviceId: string,
    startTime: Date,
    endTime: Date
  ): Promise<boolean> {
    const activeMaintenance = await prisma.maintenanceRecord.findMany({
      where: {
        deviceId,
        status: { in: [MaintenanceStatus.REPORTED, MaintenanceStatus.IN_PROGRESS] },
        startTime: { lte: endTime },
        OR: [
          { actualEndTime: { gte: startTime } },
          { actualEndTime: null, estimatedEndTime: { gte: startTime } },
          { actualEndTime: null, estimatedEndTime: null },
        ],
      },
    });

    return activeMaintenance.length > 0;
  }

  static isNightBooking(startTime: Date, endTime: Date): boolean {
    const startHour = startTime.getHours();
    const endHour = endTime.getHours();
    return startHour >= 20 || endHour >= 20 || startHour < 8;
  }

  static async createBooking(data: {
    userId: string;
    deviceId: string;
    projectId: string;
    startTime: Date;
    endTime: Date;
    purpose: string;
  }) {
    const [hasConflict, hasMaintenanceConflict, user, device] = await Promise.all([
      this.checkConflict(data.deviceId, data.startTime, data.endTime),
      this.checkMaintenanceConflict(data.deviceId, data.startTime, data.endTime),
      prisma.user.findUnique({ where: { id: data.userId } }),
      prisma.device.findUnique({ where: { id: data.deviceId } }),
    ]);

    if (hasConflict) {
      throw new Error('该时段已被预约');
    }

    if (hasMaintenanceConflict) {
      throw new Error('该时段设备处于维护状态');
    }

    if (!user?.hasCompletedSafetyTraining) {
      throw new Error('请先完成安全培训');
    }

    if (device?.type.requiresCertificate) {
      const hasValidCertificate = await prisma.certificate.findFirst({
        where: {
          userId: data.userId,
          deviceTypeId: device.typeId,
          verified: true,
          OR: [{ expiresAt: { gte: new Date() } }, { expiresAt: null }],
        },
      });

      if (!hasValidCertificate) {
        throw new Error('请先获取该设备类型的操作资格证书');
      }
    }

    const isNightBooking = this.isNightBooking(data.startTime, data.endTime);
    const requiresNightAuthorization = device?.requiresNightAuthorization && isNightBooking;

    const booking = await prisma.booking.create({
      data: {
        ...data,
        isNightBooking,
        nightAuthorized: !requiresNightAuthorization,
        status: BookingStatus.PENDING_MENTOR,
      },
      include: {
        project: true,
      },
    });

    await prisma.notification.create({
      data: {
        userId: booking.project.mentorId,
        title: '新的预约待审批',
        content: `学生提交了设备预约申请，课题编号: ${booking.project.projectNumber}`,
        type: NotificationType.APPROVAL_REQUEST,
        relatedBookingId: booking.id,
      },
    });

    return booking;
  }

  static async approveByMentor(bookingId: string, mentorId: string, approved: boolean, reason?: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { project: true, user: true },
    });

    if (!booking) {
      throw new Error('预约不存在');
    }

    if (booking.project.mentorId !== mentorId) {
      throw new Error('无权限审批此预约');
    }

    if (booking.status !== BookingStatus.PENDING_MENTOR) {
      throw new Error('此预约状态不允许导师审批');
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: approved ? BookingStatus.PENDING_ADMIN : BookingStatus.REJECTED,
        rejectedReason: approved ? undefined : reason,
      },
    });

    await prisma.notification.create({
      data: {
        userId: booking.userId,
        title: approved ? '导师已确认课题' : '预约被导师驳回',
        content: approved
          ? '您的预约课题已被导师确认，等待管理员最终审核'
          : `您的预约被驳回，原因: ${reason}`,
        type: NotificationType.BOOKING_STATUS,
        relatedBookingId: bookingId,
      },
    });

    if (approved) {
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
      await Promise.all(
        admins.map((admin) =>
          prisma.notification.create({
            data: {
              userId: admin.id,
              title: '新的预约待审核',
              content: `学生 ${booking.user.name} 提交了设备预约，等待管理员审核`,
              type: NotificationType.APPROVAL_REQUEST,
              relatedBookingId: bookingId,
            },
          })
        )
      );
    }

    return updatedBooking;
  }

  static async approveByAdmin(
    bookingId: string,
    adminId: string,
    approved: boolean,
    nightAuthorized: boolean = false,
    reason?: string
  ) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true },
    });

    if (!booking) {
      throw new Error('预约不存在');
    }

    if (booking.status !== BookingStatus.PENDING_ADMIN) {
      throw new Error('此预约状态不允许管理员审批');
    }

    if (booking.isNightBooking && !nightAuthorized) {
      throw new Error('夜间预约需要特殊授权');
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: approved ? BookingStatus.APPROVED : BookingStatus.REJECTED,
        nightAuthorized,
        rejectedReason: approved ? undefined : reason,
      },
    });

    await prisma.notification.create({
      data: {
        userId: booking.userId,
        title: approved ? '预约已批准' : '预约被管理员驳回',
        content: approved
          ? '您的预约已被管理员批准，请按时使用设备'
          : `您的预约被驳回，原因: ${reason}`,
        type: NotificationType.BOOKING_STATUS,
        relatedBookingId: bookingId,
      },
    });

    return updatedBooking;
  }

  static async cancelBooking(bookingId: string, userId: string, reason: string) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });

    if (!booking) {
      throw new Error('预约不存在');
    }

    if (booking.userId !== userId) {
      throw new Error('无权限取消此预约');
    }

    if (booking.status !== BookingStatus.APPROVED && booking.status !== BookingStatus.PENDING_MENTOR && booking.status !== BookingStatus.PENDING_ADMIN) {
      throw new Error('此预约状态不允许取消');
    }

    return prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CANCELLED,
        cancelledReason: reason,
      },
    });
  }
}
