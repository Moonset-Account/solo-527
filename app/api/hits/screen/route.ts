import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { cacheDel, cacheDelByPattern } from '@/lib/redis';
import { hitScreenSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = hitScreenSchema.parse(body);

    const defaultUserId = '00000000-0000-0000-0000-000000000001';

    const updated = await prisma.knowledgeHit.updateMany({
      where: {
        id: { in: data.hitIds },
      },
      data: {
        status: data.status,
        screenedBy: defaultUserId,
        screenedAt: new Date(),
      },
    });

    await cacheDelByPattern('hits:list:*');

    return NextResponse.json({
      success: true,
      data: {
        updatedCount: updated.count,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: '参数校验失败',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('知识命中筛查API错误:', error);
    return NextResponse.json(
      {
        success: false,
        error: '筛查失败',
      },
      { status: 500 }
    );
  }
}
