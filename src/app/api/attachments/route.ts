import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { logCreate } from '@/lib/audit';

export async function POST(request: Request) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;
    const taskId = formData.get('taskId') as string;
    const isDeliverable = formData.get('isDeliverable') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), process.env.UPLOAD_DIR || './uploads');
    await mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uniqueFileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(uploadDir, uniqueFileName);
    
    await writeFile(filePath, buffer);

    const attachment = await prisma.attachment.create({
      data: {
        fileName: file.name,
        filePath: uniqueFileName,
        mimeType: file.type,
        fileSize: file.size,
        isDeliverable,
        projectId: projectId || null,
        taskId: taskId || null,
        uploadedById: user.id,
      },
    });

    if (projectId) {
      await logCreate(user.id, 'ATTACHMENT', attachment.id, {
        fileName: file.name,
        isDeliverable,
      }, projectId);
    }

    return NextResponse.json(attachment);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const taskId = searchParams.get('taskId');

  const attachments = await prisma.attachment.findMany({
    where: {
      ...(projectId ? { projectId } : {}),
      ...(taskId ? { taskId } : {}),
    },
    include: {
      uploadedBy: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(attachments);
}
