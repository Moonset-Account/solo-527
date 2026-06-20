import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { cacheGet, cacheSet, cacheDelByPattern } from '@/lib/redis';
import { createSLARuleSchema, updateSLARuleSchema } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const isActive = searchParams.get('isActive');

    const cacheKey = `sla:list:${category}:${isActive}`;
    const cached = await cacheGet(cacheKey);

    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        fromCache: true,
      });
    }

    const where: Record<string, any> = {};
    if (category) where.category = category;
    if (isActive !== null) where.isActive = isActive === 'true';

    const rules = await prisma.sLARule.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true } },
        versions: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    await cacheSet(cacheKey, rules, 1800);

    return NextResponse.json({
      success: true,
      data: rules,
      fromCache: false,
    });
  } catch (error) {
    console.error('SLA规则列表API错误:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取SLA规则失败',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createSLARuleSchema.parse(body);

    const defaultUserId = '00000000-0000-0000-0000-000000000001';

    const rule = await prisma.sLARule.create({
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        conditions: data.conditions,
        responseTime: data.responseTime,
        resolutionTime: data.resolutionTime,
        escalationLevels: data.escalationLevels,
        createdBy: defaultUserId,
      },
    });

    await cacheDelByPattern('sla:list:*');

    return NextResponse.json({
      success: true,
      data: rule,
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

    console.error('创建SLA规则API错误:', error);
    return NextResponse.json(
      {
        success: false,
        error: '创建SLA规则失败',
      },
      { status: 500 }
    );
  }
}
