import { prisma } from './prisma';
import { createAuditLog } from './audit';
import { AccessStatus } from '@prisma/client';
import { addMinutes } from 'date-fns';

export async function grantAccess(
  visitorId: string,
  meetingId: string,
  startTime: Date,
  endTime: Date,
  userId?: string
) {
  const adjustedStartTime = addMinutes(startTime, -30);

  const accessGrant = await prisma.accessGrant.create({
    data: {
      visitorId,
      meetingId,
      startTime: adjustedStartTime,
      endTime,
      status: 'ACTIVE',
    },
  });

  await createAuditLog(
    'ACCESS_GRANTED',
    'AccessGrant',
    accessGrant.id,
    userId,
    {
      visitorId,
      meetingId,
      startTime: adjustedStartTime.toISOString(),
      endTime: endTime.toISOString(),
    }
  );

  return accessGrant;
}

export async function revokeAccess(accessGrantId: string, userId?: string) {
  const accessGrant = await prisma.accessGrant.update({
    where: {
      id: accessGrantId,
    },
    data: {
      status: 'REVOKED',
      revokedAt: new Date(),
      revokedBy: userId,
    },
  });

  await createAuditLog(
    'ACCESS_REVOKED',
    'AccessGrant',
    accessGrantId,
    userId,
    { visitorId: accessGrant.visitorId }
  );

  return accessGrant;
}

export async function revokeAllVisitorAccess(visitorId: string, userId?: string) {
  const accessGrants = await prisma.accessGrant.findMany({
    where: {
      visitorId,
      status: 'ACTIVE',
    },
  });

  for (const grant of accessGrants) {
    await revokeAccess(grant.id, userId);
  }

  return accessGrants.length;
}

export async function revokeAllMeetingAccess(meetingId: string, userId?: string) {
  const accessGrants = await prisma.accessGrant.findMany({
    where: {
      meetingId,
      status: 'ACTIVE',
    },
  });

  for (const grant of accessGrants) {
    await revokeAccess(grant.id, userId);
  }

  return accessGrants.length;
}

export async function checkAccess(visitorId: string, roomId: string) {
  const now = new Date();

  const accessGrant = await prisma.accessGrant.findFirst({
    where: {
      visitorId,
      status: 'ACTIVE',
      startTime: {
        lte: now,
      },
      endTime: {
        gte: now,
      },
      meeting: {
        roomId,
      },
    },
    include: {
      meeting: {
        include: {
          room: true,
        },
      },
    },
  });

  return !!accessGrant;
}

export async function getActiveAccessGrants(visitorId: string) {
  return prisma.accessGrant.findMany({
    where: {
      visitorId,
      status: 'ACTIVE',
    },
    include: {
      meeting: {
        include: {
          room: true,
        },
      },
    },
  });
}
