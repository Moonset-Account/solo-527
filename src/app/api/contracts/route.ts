import { NextRequest, NextResponse } from 'next/server';
import { getDataService } from '@/lib/data-service';

export async function GET(request: NextRequest) {
  const svc = await getDataService();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const assigneeId = searchParams.get('assigneeId');
  const uploaderId = searchParams.get('uploaderId');

  const contracts = await svc.getContracts({
    status: status as any,
    assigneeId: assigneeId || undefined,
    uploaderId: uploaderId || undefined,
  });

  return NextResponse.json({ contracts });
}

export async function POST(request: NextRequest) {
  try {
    const svc = await getDataService();
    const body = await request.json();

    const contract = await svc.createContract({
      title: body.title,
      contractNumber: body.contractNumber || undefined,
      description: body.description || undefined,
      fileUrl: body.fileUrl || '/uploads/default.pdf',
      fileName: body.fileName || '合同文件.pdf',
      fileSize: body.fileSize || 0,
      deadline: body.deadline ? new Date(body.deadline) : undefined,
      uploaderId: body.uploaderId || 'user-1',
      assigneeId: body.assigneeId || undefined,
    });

    return NextResponse.json({ contract }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: '创建合同失败' }, { status: 500 });
  }
}
