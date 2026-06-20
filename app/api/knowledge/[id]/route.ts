import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cacheGet, cacheSet, cacheDel } from '@/lib/redis';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const cacheKey = `knowledge:detail:${id}`;
    const cached = await cacheGet(cacheKey);

    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        fromCache: true,
      });
    }

    const knowledge = await prisma.knowledge.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        satisfactions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        hits: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!knowledge) {
      return NextResponse.json(
        {
          success: false,
          error: '知识不存在',
        },
        { status: 404 }
      );
    }

    await prisma.knowledge.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    await cacheSet(cacheKey, knowledge, 3600);

    return NextResponse.json({
      success: true,
      data: knowledge,
      fromCache: false,
    });
  } catch (error) {
    console.error('知识详情API错误:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取知识详情失败',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const updated = await prisma.knowledge.update({
      where: { id },
      data: {
        ...body,
        version: { increment: 1 },
      },
    });

    await cacheDel(`knowledge:detail:${id}`);
    await cacheDel('knowledge:search:*');

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('更新知识API错误:', error);
    return NextResponse.json(
      {
        success: false,
        error: '更新知识失败',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await prisma.knowledge.delete({
      where: { id },
    });

    await cacheDel(`knowledge:detail:${id}`);
    await cacheDel('knowledge:search:*');

    return NextResponse.json({
      success: true,
      message: '删除成功',
    });
  } catch (error) {
    console.error('删除知识API错误:', error);
    return NextResponse.json(
      {
        success: false,
        error: '删除知识失败',
      },
      { status: 500 }
    );
  }
}
