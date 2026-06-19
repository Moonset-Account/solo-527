import { NextRequest, NextResponse } from 'next/server';
import { getDataService } from '@/lib/data-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const svc = await getDataService();
  const materials = await svc.getContractMaterials(params.id);

  return NextResponse.json({ materials });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const svc = await getDataService();
    const body = await request.json();

    const material = await svc.createMaterial({
      contractId: params.id,
      name: body.name,
      fileUrl: body.fileUrl || '/uploads/material.pdf',
      fileType: body.fileType || 'application/pdf',
      description: body.description || undefined,
      uploaderId: body.uploaderId || 'user-1',
    });

    return NextResponse.json({ material }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: '添加材料失败' }, { status: 500 });
  }
}
