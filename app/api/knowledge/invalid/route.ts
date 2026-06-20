import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { cacheDel, cacheDelByPattern } from '@/lib/redis';
import { invalidKnowledgeSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = invalidKnowledgeSchema.parse(body);

    const defaultUserId = '00000000-0000-0000-0000-000000000001';

    const updated = await prisma.knowledge.update({
      where: { id: data.knowledgeId },
      data: {
        status: 'INVALID',
        invalidNote: data.invalidNote,
        invalidResult: data.invalidResult,
        processedBy: defaultUserId,
        processedAt: new Date(),
      },
    });

    await cacheDel(`knowledge:detail:${data.knowledgeId}`);
    await cacheDelByPattern('knowledge:search:*');

    return NextResponse.json({
      success: true,
      data: updated,
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

    console.error('知识失效API错误:', error);
    return NextResponse.json(
      {
        success: false,
        error: '标记失效失败',
      },
      { status: 500 }
    );
  }
}
