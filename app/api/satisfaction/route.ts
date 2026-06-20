import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { cacheGet, cacheSet, cacheDel } from '@/lib/redis';
import { satisfactionSchema } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const knowledgeId = searchParams.get('knowledgeId') || undefined;
    const ticketId = searchParams.get('ticketId') || undefined;

    const cacheKey = `satisfaction:stats:${knowledgeId}:${ticketId}`;
    const cached = await cacheGet(cacheKey);

    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        fromCache: true,
      });
    }

    const where: Record<string, any> = {};
    if (knowledgeId) where.knowledgeId = knowledgeId;
    if (ticketId) where.ticketId = ticketId;

    const [satisfactions, stats] = await Promise.all([
      prisma.satisfaction.findMany({
        where,
        include: {
          knowledge: { select: { id: true, title: true } },
        },
        take: 50,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.satisfaction.aggregate({
        where,
        _avg: { score: true },
        _count: { score: true },
      }),
    ]);

    const distribution = await prisma.satisfaction.groupBy({
      by: ['score'],
      where,
      _count: { score: true },
    });

    const result = {
      list: satisfactions,
      stats: {
        avgScore: stats._avg.score || 0,
        totalCount: stats._count.score,
        distribution: distribution.map(d => ({
          score: d.score,
          count: d._count.score,
        })),
      },
    };

    await cacheSet(cacheKey, result, 300);

    return NextResponse.json({
      success: true,
      data: result,
      fromCache: false,
    });
  } catch (error) {
    console.error('满意度统计API错误:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取满意度统计失败',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = satisfactionSchema.parse(body);

    const satisfaction = await prisma.satisfaction.create({
      data: {
        ticketId: data.ticketId,
        knowledgeId: data.knowledgeId,
        score: data.score,
        feedback: data.feedback,
        keywords: data.keywords,
      },
    });

    await cacheDel(`satisfaction:stats:${data.knowledgeId}:*`);
    await cacheDel(`satisfaction:stats:*:${data.ticketId}`);

    return NextResponse.json({
      success: true,
      data: satisfaction,
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

    console.error('创建满意度评价API错误:', error);
    return NextResponse.json(
      {
        success: false,
        error: '提交评价失败',
      },
      { status: 500 }
    );
  }
}
