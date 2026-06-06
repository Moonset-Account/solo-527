import { prisma } from './prisma';
import { createAuditLog } from './audit';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';
import { addHours } from 'date-fns';

export async function generateVisitorToken(visitorId: string, meetingEndTime: Date, userId?: string) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = addHours(meetingEndTime, 4);

  const qrCodeData = JSON.stringify({
    token,
    visitorId,
    expiresAt: expiresAt.toISOString(),
  });

  const qrCodeDataUrl = await QRCode.toDataURL(qrCodeData, {
    width: 300,
    margin: 2,
  });

  const visitorToken = await prisma.visitorToken.create({
    data: {
      visitorId,
      token,
      qrCodeData: qrCodeDataUrl,
      expiresAt,
    },
  });

  await createAuditLog(
    'QR_CODE_GENERATED',
    'VisitorToken',
    visitorToken.id,
    userId,
    { visitorId }
  );

  return visitorToken;
}

export async function refreshVisitorToken(visitorId: string, meetingEndTime: Date, userId?: string) {
  await prisma.visitorToken.updateMany({
    where: {
      visitorId,
      isActive: true,
    },
    data: {
      isActive: false,
    },
  });

  const newToken = await generateVisitorToken(visitorId, meetingEndTime, userId);

  await createAuditLog(
    'QR_CODE_UPDATED',
    'Visitor',
    visitorId,
    userId,
    { oldTokensRevoked: true }
  );

  return newToken;
}

export async function validateVisitorToken(token: string) {
  const visitorToken = await prisma.visitorToken.findFirst({
    where: {
      token,
      isActive: true,
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      visitor: {
        include: {
          meeting: {
            include: {
              room: true,
              host: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return visitorToken;
}

export async function getActiveVisitorToken(visitorId: string) {
  return prisma.visitorToken.findFirst({
    where: {
      visitorId,
      isActive: true,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}
