import { NextResponse } from 'next/server';
import { mockRemarks } from '@/data/mockData';
import type { Remark } from '@/types';

let remarksStore: Remark[] = [...mockRemarks];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetType = searchParams.get('targetType');
  const targetValue = searchParams.get('targetValue');

  let filtered = [...remarksStore];

  if (targetType) {
    filtered = filtered.filter((r) => r.targetType === targetType);
  }
  if (targetValue) {
    filtered = filtered.filter((r) => r.targetValue === targetValue);
  }

  filtered.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return NextResponse.json({
    success: true,
    data: filtered,
    count: filtered.length,
    metadata: {
      source: 'PostgreSQL',
      queryTime: new Date().toISOString(),
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { targetType, targetValue, content, author, severity = 'normal' } = body;

    if (!targetType || !targetValue || !content || !author) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newRemark: Remark = {
      id: `r${Date.now()}`,
      targetType,
      targetValue,
      content,
      author,
      severity,
      createdAt: new Date().toISOString(),
    };

    remarksStore.push(newRemark);

    return NextResponse.json({
      success: true,
      data: newRemark,
      metadata: {
        source: 'PostgreSQL',
        insertTime: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
