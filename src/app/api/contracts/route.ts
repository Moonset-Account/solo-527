import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';
import { pushReminderQueue } from '@/lib/redis';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const assigneeId = searchParams.get('assigneeId');
  const uploaderId = searchParams.get('uploaderId');

  const where: any = {};
  if (status) where.status = status;
  if (assigneeId) where.assigneeId = assigneeId;
  if (uploaderId) where.uploaderId = uploaderId;

  const contracts = db.contracts.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ contracts });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const contract = db.contracts.create({
      data: {
        title: body.title,
        contractNumber: body.contractNumber || null,
        description: body.description || null,
        fileUrl: body.fileUrl || '/uploads/default.pdf',
        fileName: body.fileName || '合同文件.pdf',
        fileSize: body.fileSize || 0,
        status: body.status || 'DRAFT',
        riskLevel: body.riskLevel || null,
        riskDescription: body.riskDescription || null,
        deadline: body.deadline || null,
        uploaderId: body.uploaderId || 'user-1',
        assigneeId: body.assigneeId || null,
      },
    });

    await pushReminderQueue({
      contractId: contract.id,
      type: 'NEW_CONTRACT',
      message: `新合同上传：${contract.title}`,
    });

    db.operationLogs.create({
      data: {
        operationType: 'UPLOAD',
        userId: 'user-1',
        contractId: contract.id,
        description: `上传合同《${contract.title}》`,
      },
    });

    return NextResponse.json({ contract }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: '创建合同失败' }, { status: 500 });
  }
}
