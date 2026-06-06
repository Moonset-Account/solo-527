import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireDesignerOrAdmin } from '@/lib/auth';
import { logCreate } from '@/lib/audit';

export async function POST(request: Request) {
  const user = await requireDesignerOrAdmin();
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
        uploadedById: user.id!,
      },
    });

    if (projectId) {
      await logCreate(user.id!, 'ATTACHMENT', attachment.id, {
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

  const isClient = user.role === 'CLIENT';

  const whereClause: any = {
    ...(projectId ? { projectId } : {}),
    ...(taskId ? { taskId } : {}),
  };

  if (isClient) {
    if (user.clientId) {
      whereClause.project = {
        clientId: user.clientId,
      };
    }
    whereClause.isDeliverable = true;
  }

  const attachments = await prisma.attachment.findMany({
    where: whereClause,
    include: {
      uploadedBy: {
        select: { id: isClient ? false : true, name: true, email: isClient ? false : true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(attachments);
}
