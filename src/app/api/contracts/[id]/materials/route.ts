import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';

export async function GET(
  request: NextRequest,
  { params }: { params: { contractId: string } }
) {
  const materials = db.evidenceMaterials.findMany({
    where: { contractId: params.contractId },
  });

  return NextResponse.json({ materials });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { contractId: string } }
) {
  try {
    const body = await request.json();

    const material = db.evidenceMaterials.create({
      data: {
        contractId: params.contractId,
        name: body.name,
        fileUrl: body.fileUrl || '/uploads/material.pdf',
        fileType: body.fileType || 'application/pdf',
        status: body.status || 'UPLOADED',
        description: body.description || null,
        uploaderId: body.uploaderId || 'user-1',
      },
    });

    const contract = db.contracts.findUnique({ where: { id: params.contractId } });
    if (contract) {
      db.contracts.update({
        where: { id: params.contractId },
        data: { materialComplete: false },
      });
    }

    return NextResponse.json({ material }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: '添加材料失败' }, { status: 500 });
  }
}
