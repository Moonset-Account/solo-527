import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { cacheGet, cacheSet, cacheDel } from '@/lib/redis';
import { trajectorySchema } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get('ticketId') || undefined;
    const actionType = searchParams.get('actionType') || undefined;

    const cacheKey = `trajectory:list:${ticketId}:${actionType}`;
    const cached = await cacheGet(cacheKey);

    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        fromCache: true,
      });
    }

    const where: Record<string, any> = {};
    if (ticketId) where.ticketId = ticketId;
    if (actionType) where.actionType = actionType;

    const trajectories = await prisma.trajectory.findMany({
      where,
      include: {
        operator: { select: { id: true, name: true } },
        ticket: { select: { id: true, title: true } },
        slaRule: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    await cacheSet(cacheKey, trajectories, 300);

    return NextResponse.json({
      success: true,
      data: trajectories,
      fromCache: false,
    });
  } catch (error) {
    console.error('处理轨迹列表API错误:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取处理轨迹失败',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = trajectorySchema.parse(body);

    const defaultUserId = '00000000-0000-0000-0000-000000000001';

    const trajectory = await prisma.trajectory.create({
      data: {
        ticketId: data.ticketId,
        actionType: data.actionType,
        description: data.description,
        improvementAction: data.improvementAction,
        beforeState: data.beforeState as any,
        afterState: data.afterState as any,
        slaRuleId: data.slaRuleId,
        operatorId: defaultUserId,
      },
    });

    await cacheDel(`trajectory:list:${data.ticketId}:*`);

    return NextResponse.json({
      success: true,
      data: trajectory,
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

    console.error('创建处理轨迹API错误:', error);
    return NextResponse.json(
      {
        success: false,
        error: '创建处理轨迹失败',
      },
      { status: 500 }
    );
  }
}
