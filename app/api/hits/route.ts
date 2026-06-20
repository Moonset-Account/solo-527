import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { cacheGet, cacheSet, cacheDel } from '@/lib/redis';
import { hitScreenSchema } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'PENDING' | 'VALID' | 'FALSE_POSITIVE' | undefined;
    const knowledgeId = searchParams.get('knowledgeId') || undefined;
    const ticketId = searchParams.get('ticketId') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    const cacheKey = `hits:list:${status}:${knowledgeId}:${ticketId}:${page}:${pageSize}`;
    const cached = await cacheGet(cacheKey);

    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        fromCache: true,
      });
    }

    const where: Record<string, any> = {};
    if (status) where.status = status;
    if (knowledgeId) where.knowledgeId = knowledgeId;
    if (ticketId) where.ticketId = ticketId;

    const [hits, total] = await Promise.all([
      prisma.knowledgeHit.findMany({
        where,
        include: {
          knowledge: { select: { id: true, title: true, category: true } },
          ticket: { select: { id: true, title: true, customerId: true } },
          screener: { select: { id: true, name: true } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.knowledgeHit.count({ where }),
    ]);

    const result = {
      list: hits,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };

    await cacheSet(cacheKey, result, 60);

    return NextResponse.json({
      success: true,
      data: result,
      fromCache: false,
    });
  } catch (error) {
    console.error('知识命中列表API错误:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取知识命中失败',
      },
      { status: 500 }
    );
  }
}
