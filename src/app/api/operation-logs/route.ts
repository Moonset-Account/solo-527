import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const contractId = searchParams.get('contractId');
  const operationType = searchParams.get('operationType');
  const take = searchParams.get('take');

  const where: any = {};
  if (userId) where.userId = userId;
  if (contractId) where.contractId = contractId;
  if (operationType) where.operationType = operationType;

  const options: any = { where };
  if (take) options.take = parseInt(take);

  const logs = db.operationLogs.findMany(options);

  return NextResponse.json({ logs });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const log = db.operationLogs.create({
      data: {
        operationType: body.operationType,
        userId: body.userId || 'user-1',
        contractId: body.contractId || null,
        description: body.description,
        ipAddress: body.ipAddress || null,
        userAgent: body.userAgent || null,
      },
    });

    return NextResponse.json({ log }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: '创建日志失败' }, { status: 500 });
  }
}
