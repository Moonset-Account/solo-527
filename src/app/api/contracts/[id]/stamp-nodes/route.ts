import { NextRequest, NextResponse } from 'next/server';
import { getDataService } from '@/lib/data-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const svc = await getDataService();
  const stampNodes = await svc.getStampNodes(params.id);

  return NextResponse.json({ stampNodes });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const svc = await getDataService();
    const body = await request.json();

    const node = await svc.completeStampNode(
      body.nodeId,
      body.userId || 'user-1',
      body.remark || undefined
    );

    return NextResponse.json({ stampNode: node });
  } catch (error) {
    return NextResponse.json({ error: '完成盖章失败' }, { status: 500 });
  }
}
