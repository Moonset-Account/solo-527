import { NextRequest, NextResponse } from 'next/server';
import { getDataService } from '@/lib/data-service';

export async function GET(request: NextRequest) {
  const svc = await getDataService();
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const contractId = searchParams.get('contractId');
  const operationType = searchParams.get('operationType');
  const take = searchParams.get('take');

  const logs = await svc.getOperationLogs({
    userId: userId || undefined,
    contractId: contractId || undefined,
    operationType: operationType as any,
    take: take ? parseInt(take) : undefined,
  });

  return NextResponse.json({ logs });
}

export async function POST(request: NextRequest) {
  try {
    const svc = await getDataService();
    const body = await request.json();

    await svc.logOperation(
      body.operationType,
      body.userId || 'user-1',
      body.description,
      body.contractId || undefined,
      body.ipAddress || undefined
    );

    const logs = await svc.getOperationLogs({
      userId: body.userId || 'user-1',
      take: 1,
    });
    const log = logs[0] || null;

    return NextResponse.json({ log }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: '创建日志失败' }, { status: 500 });
  }
}
