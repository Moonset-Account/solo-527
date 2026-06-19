import { NextRequest, NextResponse } from 'next/server';
import { getDataService } from '@/lib/data-service';
import { OperationType } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const svc = await getDataService();
  const contract = await svc.getContractById(params.id);

  if (!contract) {
    return NextResponse.json({ error: '合同不存在' }, { status: 404 });
  }

  const reviews = await svc.getContractReviews(params.id);
  const materials = await svc.getContractMaterials(params.id);
  const stampNodes = await svc.getStampNodes(params.id);
  const downloadRecords = await svc.getDownloadRecords({ contractId: params.id });
  const logs = await svc.getOperationLogs({ contractId: params.id });

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
    const svc = await getDataService();
    const body = await request.json();

    const { actorUserId, operationType, description, ...contractData } = body;

    const updated = await svc.updateContract(params.id, contractData, {
      actorUserId: actorUserId || 'user-1',
      operationType: operationType as OperationType || undefined,
      description: description || undefined,
    });

    if (!updated) {
      return NextResponse.json({ error: '合同不存在' }, { status: 404 });
    }

    return NextResponse.json({ contract: updated });
  } catch (error) {
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}
