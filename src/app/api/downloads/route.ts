import { NextRequest, NextResponse } from 'next/server';
import { getDataService } from '@/lib/data-service';

export async function GET(request: NextRequest) {
  const svc = await getDataService();
  const { searchParams } = new URL(request.url);
  const contractId = searchParams.get('contractId');
  const userId = searchParams.get('userId');

  const records = await svc.getDownloadRecords({
    contractId: contractId || undefined,
    userId: userId || undefined,
  });

  return NextResponse.json({ records });
}

export async function POST(request: NextRequest) {
  try {
    const svc = await getDataService();
    const body = await request.json();

    const record = await svc.recordDownload(
      body.contractId,
      body.userId || 'user-1',
      body.fileName || '合同文件',
      body.ipAddress || request.headers.get('x-forwarded-for') || undefined
    );

    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: '记录下载失败' }, { status: 500 });
  }
}
