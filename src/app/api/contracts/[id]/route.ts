import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const contract = db.contracts.findUnique({ where: { id: params.id } });

  if (!contract) {
    return NextResponse.json({ error: '合同不存在' }, { status: 404 });
  }

  const reviews = db.contractReviews.findMany({ where: { contractId: params.id } });
  const materials = db.evidenceMaterials.findMany({ where: { contractId: params.id } });
  const stampNodes = db.stampNodes.findMany({ where: { contractId: params.id } });
  const downloadRecords = db.downloadRecords.findMany({ where: { contractId: params.id } });
  const logs = db.operationLogs.findMany({ where: { contractId: params.id } });

  return NextResponse.json({
    contract,
    reviews,
    materials,
    stampNodes,
    downloadRecords,
    logs,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const updated = db.contracts.update({
      where: { id: params.id },
      data: body,
    });

    if (!updated) {
      return NextResponse.json({ error: '合同不存在' }, { status: 404 });
    }

    return NextResponse.json({ contract: updated });
  } catch (error) {
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}
