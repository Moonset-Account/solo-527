import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { exportSchema } from '@/lib/validation';
import { exportToExcel, exportToCSV } from '@/lib/export';
import { prisma } from '@/lib/prisma';
import type { ExportData } from '@/lib/export';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = exportSchema.parse(body);

    let exportData: ExportData = {};
    const timestamp = new Date().toISOString().slice(0, 10);

    const filters = data.filters as Record<string, unknown> || {};
    const where: Record<string, unknown> = {};

    if (filters.status) where.status = filters.status;
    if (filters.knowledgeId) where.knowledgeId = filters.knowledgeId;

    if (data.type === 'HITS') {
      exportData.hits = await prisma.knowledgeHit.findMany({
        where,
        include: {
          knowledge: { select: { title: true } },
          ticket: { select: { title: true } },
        },
        take: 1000,
        orderBy: { createdAt: 'desc' },
      });
    } else if (data.type === 'KNOWLEDGE') {
      exportData.knowledge = await prisma.knowledge.findMany({
        where,
        take: 1000,
        orderBy: { createdAt: 'desc' },
      });
    } else if (data.type === 'SLA') {
      exportData.sla = await prisma.sLARule.findMany({
        where,
        take: 1000,
        orderBy: { createdAt: 'desc' },
      });
    } else if (data.type === 'TRAJECTORY') {
      exportData.trajectory = await prisma.trajectory.findMany({
        where: filters.ticketId ? { ticketId: filters.ticketId as string } : {},
        include: {
          operator: { select: { name: true } },
        },
        take: 1000,
        orderBy: { createdAt: 'desc' },
      });
    }

    let buffer: Buffer;
    let filename: string;
    let mimeType: string;

    if (data.format === 'xlsx') {
      buffer = await exportToExcel(exportData, '数据导出');
      filename = `${data.type}_${timestamp}.xlsx`;
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else {
      const csvContent = await exportToCSV(exportData);
      buffer = Buffer.from(csvContent, 'utf-8');
      filename = `${data.type}_${timestamp}.csv`;
      mimeType = 'text/csv; charset=utf-8';
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
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

    console.error('导出API错误:', error);
    return NextResponse.json(
      {
        success: false,
        error: '导出失败',
      },
      { status: 500 }
    );
  }
}
