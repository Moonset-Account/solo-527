import { prisma } from './prisma';
import { createAuditLog } from './audit';
import { addHours } from 'date-fns';
import * as fs from 'fs/promises';
import * as path from 'path';

const PHOTO_DIR = path.join(process.cwd(), 'public', 'uploads', 'id-photos');
const RETENTION_HOURS = parseInt(process.env.ID_PHOTO_RETENTION_HOURS || '72', 10);

async function ensurePhotoDir() {
  try {
    await fs.access(PHOTO_DIR);
  } catch {
    await fs.mkdir(PHOTO_DIR, { recursive: true });
  }
}

export async function saveIDPhoto(
  visitorId: string,
  photoBase64: string,
  userId?: string
) {
  await ensurePhotoDir();

  const existingPhoto = await prisma.iDPhoto.findUnique({
    where: { visitorId },
  });

  if (existingPhoto) {
    try {
      await fs.unlink(existingPhoto.filePath);
    } catch (e) {
      console.error('Failed to delete old photo:', e);
    }
    await prisma.iDPhoto.delete({
      where: { id: existingPhoto.id },
    });
  }

  const base64Data = photoBase64.replace(/^data:image\/\w+;base64,/, '');
  const fileName = `${visitorId}-${Date.now()}.jpg`;
  const filePath = path.join(PHOTO_DIR, fileName);
  const relativePath = `/uploads/id-photos/${fileName}`;

  await fs.writeFile(filePath, base64Data, 'base64');

  const expiresAt = addHours(new Date(), RETENTION_HOURS);

  const idPhoto = await prisma.iDPhoto.create({
    data: {
      visitorId,
      filePath: relativePath,
      expiresAt,
    },
  });

  await prisma.visitor.update({
    where: { id: visitorId },
    data: { idPhotoPath: relativePath },
  });

  await createAuditLog(
    'ID_PHOTO_UPLOADED',
    'IDPhoto',
    idPhoto.id,
    userId,
    { visitorId, expiresAt: expiresAt.toISOString() }
  );

  return idPhoto;
}

export async function getIDPhoto(visitorId: string) {
  return prisma.iDPhoto.findUnique({
    where: { visitorId },
  });
}

export async function deleteIDPhoto(visitorId: string, userId?: string) {
  const idPhoto = await prisma.iDPhoto.findUnique({
    where: { visitorId },
  });

  if (!idPhoto) return null;

  try {
    const fullPath = path.join(process.cwd(), 'public', idPhoto.filePath);
    await fs.unlink(fullPath);
  } catch (e) {
    console.error('Failed to delete photo file:', e);
  }

  await prisma.iDPhoto.delete({
    where: { id: idPhoto.id },
  });

  await prisma.visitor.update({
    where: { id: visitorId },
    data: { idPhotoPath: null },
  });

  await createAuditLog(
    'ID_PHOTO_DELETED',
    'IDPhoto',
    idPhoto.id,
    userId,
    { visitorId }
  );

  return idPhoto;
}

export async function cleanupExpiredPhotos() {
  const now = new Date();

  const expiredPhotos = await prisma.iDPhoto.findMany({
    where: {
      expiresAt: {
        lt: now,
      },
    },
  });

  for (const photo of expiredPhotos) {
    try {
      const fullPath = path.join(process.cwd(), 'public', photo.filePath);
      await fs.unlink(fullPath);
    } catch (e) {
      console.error('Failed to delete expired photo:', e);
    }

    await prisma.iDPhoto.delete({
      where: { id: photo.id },
    });

    await prisma.visitor.updateMany({
      where: { idPhotoPath: photo.filePath },
      data: { idPhotoPath: null },
    });
  }

  return expiredPhotos.length;
}

export function getPhotoRetentionHours() {
  return RETENTION_HOURS;
}
