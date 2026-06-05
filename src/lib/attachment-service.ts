import { db } from '@/db';
import { attachments, projects } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const THUMBNAIL_DIR = path.join(UPLOAD_DIR, 'thumbnails');

async function ensureUploadDirs() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.mkdir(THUMBNAIL_DIR, { recursive: true });
}

function isImage(mimeType: string) {
  return mimeType.startsWith('image/');
}

export async function uploadAttachment(
  projectId: string,
  file: File,
  uploadedBy: string,
  isPublic = false
) {
  await ensureUploadDirs();

  const fileId = uuidv4();
  const ext = path.extname(file.name);
  const fileName = `${fileId}${ext}`;
  const filePath = path.join(UPLOAD_DIR, fileName);

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  await fs.writeFile(filePath, buffer);

  let thumbnailPath: string | null = null;

  if (isImage(file.type)) {
    try {
      const thumbnailName = `${fileId}_thumb${ext}`;
      const thumbnailFullPath = path.join(THUMBNAIL_DIR, thumbnailName);

      await sharp(buffer)
        .resize(300, 300, { fit: 'inside' })
        .toFile(thumbnailFullPath);

      thumbnailPath = path.join('thumbnails', thumbnailName);
    } catch (error) {
      console.error('Failed to generate thumbnail:', error);
    }
  }

  const [attachment] = await db
    .insert(attachments)
    .values({
      projectId,
      fileName: file.name,
      filePath: fileName,
      thumbnailPath,
      mimeType: file.type,
      fileSize: file.size,
      isPublic,
      uploadedBy,
    })
    .returning();

  return attachment;
}

export async function getAttachmentsByProject(projectId: string) {
  return db.query.attachments.findMany({
    where: eq(attachments.projectId, projectId),
    orderBy: (attachments, { desc }) => [desc(attachments.createdAt)],
    with: {
      uploader: {
        columns: {
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function getAttachmentById(attachmentId: string) {
  return db.query.attachments.findFirst({
    where: eq(attachments.id, attachmentId),
  });
}

export async function deleteAttachment(attachmentId: string) {
  const attachment = await getAttachmentById(attachmentId);
  if (!attachment) return;

  try {
    const filePath = path.join(UPLOAD_DIR, attachment.filePath);
    await fs.unlink(filePath).catch(() => {});

    if (attachment.thumbnailPath) {
      const thumbPath = path.join(UPLOAD_DIR, attachment.thumbnailPath);
      await fs.unlink(thumbPath).catch(() => {});
    }
  } catch (error) {
    console.error('Failed to delete attachment files:', error);
  }

  await db.delete(attachments).where(eq(attachments.id, attachmentId));
}

export async function checkAttachmentAccess(
  attachmentId: string,
  userId: string,
  userRole: string
): Promise<boolean> {
  if (userRole === 'admin') return true;

  const attachment = await getAttachmentById(attachmentId);
  if (!attachment) return false;

  if (attachment.isPublic) return true;

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, attachment.projectId),
  });

  if (!project) return false;

  const client = await db.query.clients.findFirst({
    where: eq(clients.id, project.clientId!),
  });

  return client?.userId === userId;
}

export function getAttachmentFilePath(filePath: string) {
  return path.join(UPLOAD_DIR, filePath);
}
