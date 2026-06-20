import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { cacheDel } from '@/lib/redis';
import { updateSLARuleSchema } from '@/lib/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const rule = await prisma.sLARule.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true } },
        versions: {
          orderBy: { createdAt: 'desc' },
          include: {
            changer: { select: { id: true, name: true } },
        },
      },
    });

    if (!rule) {
      return NextResponse.json(
        {
          success: false,
          error: 'SLA规则不存在',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: rule,
    });
  } catch (error) {
    console.error('SLA规则详情API错误:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取SLA规则失败',
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
    const data = updateSLARuleSchema.parse(body);

    const existingRule = await prisma.sLARule.findUnique({
      where: { id } });

    if (!existingRule) {
      return NextResponse.json(
        {
          success: false,
          error: 'SLA规则不存在',
        },
        { status: 404 }
      );
    }

    const { changeReason, ...updateData } = data;
    const defaultUserId = '00000000-0000-0000-0000-000000000001';

    const updated = await prisma.$transaction(async (tx) => {
      const updatedRule = await tx.sLARule.update({
        where: { id },
        data: {
          ...updateData,
          version: { increment: 1 },
        },
      });

      await tx.sLARuleVersion.create({
        data: {
          slaRuleId: id,
          ruleSnapshot: existingRule,
          version: existingRule.version,
          changeReason: changeReason || '规则更新',
          changedBy: defaultUserId,
        },
      });

      return updatedRule;
    });

    await cacheDel('sla:list:*');

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

    console.error('更新SLA规则API错误:', error);
    return NextResponse.json(
      {
        success: false,
        error: '更新SLA规则失败',
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

    await prisma.sLARule.delete({
      where: { id } });

    await cacheDel('sla:list:*');

    return NextResponse.json({
      success: true,
      message: '删除成功',
    });
  } catch (error) {
    console.error('删除SLA规则API错误:', error);
    return NextResponse.json(
      {
        success: false,
        error: '删除SLA规则失败',
      },
      { status: 500 }
    );
  }
}
