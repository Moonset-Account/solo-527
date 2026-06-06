import { prisma } from './prisma';
import { createAuditLog } from './audit';
import { generateVisitorToken, refreshVisitorToken } from './visitor-token';
import { grantAccess, revokeAllMeetingAccess } from './access-control';
import { MeetingStatus, VisitorStatus } from '@prisma/client';

interface CreateMeetingInput {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  hostId: string;
  departmentId: string;
  roomId?: string;
  visitors: Array<{
    name: string;
    phone: string;
    idCardNumber?: string;
    company?: string;
  }>;
}

export async function createMeeting(input: CreateMeetingInput, userId: string) {
  return prisma.$transaction(async (tx) => {
    if (input.roomId) {
      const conflictingMeeting = await tx.meeting.findFirst({
        where: {
          roomId: input.roomId,
          status: {
            in: ['SCHEDULED', 'IN_PROGRESS'],
          },
          OR: [
            {
              startTime: {
                lt: input.endTime,
              },
              endTime: {
                gt: input.startTime,
              },
            },
          ],
        },
      });

      if (conflictingMeeting) {
        throw new Error('会议室在该时间段已被占用');
      }
    }

    const meeting = await tx.meeting.create({
      data: {
        title: input.title,
        description: input.description,
        startTime: input.startTime,
        endTime: input.endTime,
        hostId: input.hostId,
        departmentId: input.departmentId,
        roomId: input.roomId,
      },
    });

    for (const visitorData of input.visitors) {
      const visitor = await tx.visitor.create({
        data: {
          ...visitorData,
          meetingId: meeting.id,
        },
      });

      await generateVisitorToken(visitor.id, input.endTime, userId);
      await grantAccess(visitor.id, meeting.id, input.startTime, input.endTime, userId);

      await tx.frontDeskTask.create({
        data: {
          meetingId: meeting.id,
          visitorName: visitor.name,
          taskType: 'VERIFY_ID',
        },
      });

      sendVisitorSMS(visitor.phone, {
        meetingTitle: input.title,
        meetingTime: input.startTime,
        visitorName: visitor.name,
      });
    }

    await createAuditLog(
      'MEETING_CREATED',
      'Meeting',
      meeting.id,
      userId,
      {
        title: input.title,
        visitorCount: input.visitors.length,
        roomId: input.roomId,
      }
    );

    return tx.meeting.findUnique({
      where: { id: meeting.id },
      include: {
        visitors: true,
        room: true,
        host: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  });
}

interface UpdateMeetingInput {
  title?: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
  roomId?: string;
  status?: MeetingStatus;
}

export async function updateMeeting(
  meetingId: string,
  input: UpdateMeetingInput,
  userId: string
) {
  return prisma.$transaction(async (tx) => {
    const existingMeeting = await tx.meeting.findUnique({
      where: { id: meetingId },
      include: {
        visitors: true,
      },
    });

    if (!existingMeeting) {
      throw new Error('会议不存在');
    }

    if (input.roomId && input.roomId !== existingMeeting.roomId) {
      const conflictingMeeting = await tx.meeting.findFirst({
        where: {
          id: { not: meetingId },
          roomId: input.roomId,
          status: {
            in: ['SCHEDULED', 'IN_PROGRESS'],
          },
          OR: [
            {
              startTime: {
                lt: input.endTime || existingMeeting.endTime,
              },
              endTime: {
                gt: input.startTime || existingMeeting.startTime,
              },
            },
          ],
        },
      });

      if (conflictingMeeting) {
        throw new Error('会议室在该时间段已被占用');
      }
    }

    const updatedMeeting = await tx.meeting.update({
      where: { id: meetingId },
      data: {
        ...input,
        previousRoomId: input.roomId ? existingMeeting.roomId : undefined,
      },
    });

    const roomChanged = input.roomId && input.roomId !== existingMeeting.roomId;
    const timeChanged = (input.startTime && input.startTime.getTime() !== existingMeeting.startTime.getTime()) ||
                       (input.endTime && input.endTime.getTime() !== existingMeeting.endTime.getTime());

    if (roomChanged || timeChanged) {
      for (const visitor of existingMeeting.visitors) {
        if (visitor.status === 'CHECKED_IN') {
          await tx.frontDeskTask.create({
            data: {
              meetingId: meetingId,
              visitorName: visitor.name,
              taskType: roomChanged ? 'NOTIFY_ROOM_CHANGE' : 'NOTIFY_TIME_CHANGE',
              notes: roomChanged ? `会议室已变更，需要通知已入场访客` : '会议时间已变更，需要通知已入场访客',
            },
          });
        } else {
          const newEndTime = input.endTime || existingMeeting.endTime;
          await refreshVisitorToken(visitor.id, newEndTime, userId);

          if (timeChanged) {
            sendVisitorSMS(visitor.phone, {
              meetingTitle: updatedMeeting.title,
              meetingTime: input.startTime || existingMeeting.startTime,
              visitorName: visitor.name,
              isUpdate: true,
            });
          }
        }
      }

      if (roomChanged) {
        await revokeAllMeetingAccess(meetingId, userId);
        for (const visitor of existingMeeting.visitors) {
          if (visitor.status !== 'CHECKED_OUT' && visitor.status !== 'CANCELLED') {
            await grantAccess(
              visitor.id,
              meetingId,
              input.startTime || existingMeeting.startTime,
              input.endTime || existingMeeting.endTime,
              userId
            );
          }
        }
      }
    }

    await createAuditLog(
      'MEETING_UPDATED',
      'Meeting',
      meetingId,
      userId,
      {
        changes: input,
        roomChanged,
        timeChanged,
      }
    );

    return updatedMeeting;
  });
}

export async function cancelMeeting(meetingId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const meeting = await tx.meeting.findUnique({
      where: { id: meetingId },
      include: {
        visitors: true,
      },
    });

    if (!meeting) {
      throw new Error('会议不存在');
    }

    const checkedInVisitors = meeting.visitors.filter(v => v.status === 'CHECKED_IN');

    if (checkedInVisitors.length > 0) {
      for (const visitor of checkedInVisitors) {
        await tx.frontDeskTask.create({
          data: {
            meetingId: meetingId,
            visitorName: visitor.name,
            taskType: 'HANDLE_CHECKED_IN_VISITOR',
            notes: '会议已取消，该访客已入场，需要前台处理',
          },
        });
      }
    }

    await tx.meeting.update({
      where: { id: meetingId },
      data: {
        status: 'CANCELLED',
      },
    });

    await tx.visitor.updateMany({
      where: {
        meetingId,
        status: {
          in: ['INVITED'],
        },
      },
      data: {
        status: 'CANCELLED',
      },
    });

    await revokeAllMeetingAccess(meetingId, userId);

    await tx.frontDeskTask.updateMany({
      where: {
        meetingId,
        status: 'PENDING',
      },
      data: {
        status: 'CANCELLED',
      },
    });

    await createAuditLog(
      'MEETING_CANCELLED',
      'Meeting',
      meetingId,
      userId,
      {
        checkedInVisitorCount: checkedInVisitors.length,
        totalVisitorCount: meeting.visitors.length,
      }
    );

    return {
      success: true,
      checkedInVisitorCount: checkedInVisitors.length,
    };
  });
}

export async function rollbackMeetingCreation(meetingId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const meeting = await tx.meeting.findUnique({
      where: { id: meetingId },
      include: { visitors: true },
    });

    if (!meeting) {
      throw new Error('会议不存在');
    }

    await revokeAllMeetingAccess(meetingId, userId);

    await tx.visitorToken.deleteMany({
      where: {
        visitor: {
          meetingId,
        },
      },
    });

    await tx.frontDeskTask.deleteMany({
      where: { meetingId },
    });

    await tx.visitor.deleteMany({
      where: { meetingId },
    });

    await tx.meeting.delete({
      where: { id: meetingId },
    });

    await createAuditLog(
      'MEETING_CANCELLED',
      'Meeting',
      meetingId,
      userId,
      { rollback: true }
    );

    return { success: true };
  });
}

function sendVisitorSMS(
  phone: string,
  data: {
    meetingTitle: string;
    meetingTime: Date;
    visitorName: string;
    isUpdate?: boolean;
  }
) {
  console.log(`[SMS Mock] 发送短信到 ${phone}: ${data.visitorName}，您${data.isUpdate ? '更新的' : ''}会议「${data.meetingTitle}」将于${data.meetingTime.toLocaleString()}开始，请凭二维码入场。`);
}

export async function getMeetingsByRoom(roomId: string, startDate: Date, endDate: Date) {
  return prisma.meeting.findMany({
    where: {
      roomId,
      status: {
        in: ['SCHEDULED', 'IN_PROGRESS'],
      },
      startTime: {
        gte: startDate,
      },
      endTime: {
        lte: endDate,
      },
    },
    include: {
      host: {
        select: {
          id: true,
          name: true,
        },
      },
      visitors: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
    },
    orderBy: {
      startTime: 'asc',
    },
  });
}

export async function getMeetingsByDepartment(departmentId: string, userId: string, userRole: string) {
  const where: any = {
    departmentId,
  };

  if (userRole === 'EMPLOYEE') {
    where.OR = [
      { hostId: userId },
      {
        visitors: {
          some: {},
        },
      },
    ];
  }

  return prisma.meeting.findMany({
    where,
    include: {
      room: true,
      host: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      visitors: {
        select: {
          id: true,
          name: true,
          phone: true,
          status: true,
          checkInTime: true,
          checkOutTime: true,
        },
      },
    },
    orderBy: {
      startTime: 'desc',
    },
  });
}
