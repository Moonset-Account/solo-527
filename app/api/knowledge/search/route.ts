import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { cacheGet, cacheSet } from '@/lib/redis';
import { knowledgeSearchSchema } from '@/lib/validation';
import { searchKnowledge } from '@/lib/search';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const category = searchParams.get('category') || undefined;
    const type = searchParams.get('type') as 'ANSWER' | 'TUTORIAL' | undefined;
    const status = searchParams.get('status') as 'ACTIVE' | 'PENDING_INVALID' | 'INVALID' | undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    const params = knowledgeSearchSchema.parse({
      q: q || undefined,
      category: category || undefined,
      type,
      status,
      page,
      pageSize,
    });

    const cacheKey = `knowledge:search:${JSON.stringify(params)}`;
    const cached = await cacheGet(cacheKey);

    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        fromCache: true,
      });
    }

    const results = await searchKnowledge(params);

    await cacheSet(cacheKey, results, 300);

    return NextResponse.json({
      success: true,
      data: results,
      fromCache: false,
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

    console.error('知识搜索API错误:', error);
    return NextResponse.json(
      {
        success: false,
        error: '搜索失败，请稍后重试',
      },
      { status: 500 }
    );
  }
}
