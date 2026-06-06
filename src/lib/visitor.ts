import { prisma } from './prisma';
import { createAuditLog } from './audit';
import { revokeAllVisitorAccess } from './access-control';
import { deleteIDPhoto } from './id-photo';

export async function checkInVisitor(visitorId: string, userId?: string) {
  return prisma.$transaction(async (tx) => {
    const visitor = await tx.visitor.update({
      where: { id: visitorId },
      data: {
        status: 'CHECKED_IN',
        checkInTime: new Date(),
      },
      include: {
        meeting: true,
      },
    });

    await tx.frontDeskTask.updateMany({
      where: {
        meetingId: visitor.meetingId,
        visitorName: visitor.name,
        status: 'PENDING',
      },
      data: {
        status: 'COMPLETED',
      },
    });

    await createAuditLog(
      'VISITOR_CHECKED_IN',
      'Visitor',
      visitorId,
      userId,
      { meetingId: visitor.meetingId }
    );

    return visitor;
  });
}

export async function checkOutVisitor(visitorId: string, userId?: string) {
  return prisma.$transaction(async (tx) => {
    const visitor = await tx.visitor.update({
      where: { id: visitorId },
      data: {
        status: 'CHECKED_OUT',
        checkOutTime: new Date(),
      },
    });

    await revokeAllVisitorAccess(visitorId, userId);

    await deleteIDPhoto(visitorId, userId);

    await createAuditLog(
      'VISITOR_CHECKED_OUT',
      'Visitor',
      visitorId,
      userId,
      { meetingId: visitor.meetingId }
    );

    return visitor;
  });
}

export async function getVisitorsByDepartment(departmentId: string, userId: string, userRole: string) {
  if (userRole === 'ADMIN' || userRole === 'RECEPTIONIST') {
    return prisma.visitor.findMany({
      include: {
        meeting: {
          include: {
            room: true,
            host: {
              select: {
                id: true,
                name: true,
                departmentId: true,
              },
            },
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  return prisma.visitor.findMany({
    where: {
      meeting: {
        departmentId,
        OR: [
          { hostId: userId },
          {
            visitors: {
              some: {},
            },
          },
        ],
      },
    },
    include: {
      meeting: {
        include: {
          room: true,
          host: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function getVisitorById(visitorId: string, userId: string, userRole: string, userDepartmentId?: string) {
  const visitor = await prisma.visitor.findUnique({
    where: { id: visitorId },
    include: {
      meeting: {
        include: {
          room: true,
          host: {
            select: {
              id: true,
              name: true,
              departmentId: true,
            },
          },
          department: true,
        },
      },
      tokens: {
        where: { isActive: true },
      },
    },
  });

  if (!visitor) return null;

  if (userRole === 'ADMIN' || userRole === 'RECEPTIONIST') {
    return visitor;
  }

  if (userRole === 'EMPLOYEE') {
    if (visitor.meeting.departmentId !== userDepartmentId) {
      return null;
    }
    if (visitor.meeting.hostId !== userId) {
      return null;
    }
  }

  return visitor;
}
