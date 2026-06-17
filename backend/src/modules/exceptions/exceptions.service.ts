import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExceptionsService {
  constructor(private prisma: PrismaService) {}

  listReasons() {
    return this.prisma.closeReason.findMany({
      where: { isActive: true }, orderBy: { sortOrder: 'asc' },
    });
  }

  async list(query: any) {
    const { page = 1, pageSize = 20, category, closeReasonId, keyword, dateFrom, dateTo } = query;
    const where: any = {};
    if (closeReasonId) where.closeReasonId = closeReasonId;
    if (category) where.closeReason = { category };
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }
    if (keyword) {
      where.OR = [
        { customReason: { contains: keyword } },
        { note: { contains: keyword } },
        { registration: { orderNo: { contains: keyword } } },
        { registration: { user: { name: { contains: keyword } } } },
      ];
    }
    const skip = (Number(page) - 1) * Number(pageSize);
    const [items, total] = await Promise.all([
      this.prisma.closeException.findMany({
        where, skip, take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
          closeReason: true,
          registration: {
            include: { user: true, ticketType: true, session: true, qualityMetric: true },
          },
        },
      }),
      this.prisma.closeException.count({ where }),
    ]);
    const reasons = await this.prisma.closeReason.findMany({ orderBy: { sortOrder: 'asc' } });
    const categoryStats: Record<string, number> = {};
    const reasonStats: Record<string, number> = {};
    const allExceptions = await this.prisma.closeException.findMany({ include: { closeReason: true } });
    allExceptions.forEach(e => {
      categoryStats[e.closeReason.category] = (categoryStats[e.closeReason.category] || 0) + 1;
      reasonStats[e.closeReason.name] = (reasonStats[e.closeReason.name] || 0) + 1;
    });
    return {
      items, total, page: Number(page), pageSize: Number(pageSize),
      reasons,
      stats: {
        total: allExceptions.length,
        byCategory: Object.entries(categoryStats).map(([name, count]) => ({ name, count })),
        byReason: Object.entries(reasonStats).map(([name, count]) => ({ name, count })),
      },
    };
  }

  async detail(id: string) {
    const e = await this.prisma.closeException.findUnique({
      where: { id },
      include: {
        closeReason: true,
        registration: {
          include: {
            user: true, ticketType: true, session: true, seat: true,
            checkinCode: true, refunds: true, qualityMetric: true, guestAllocation: true,
          },
        },
      },
    });
    if (!e) throw new Error('记录不存在');
    return e;
  }

  async traceOriginal(closeExceptionId: string) {
    const e = await this.detail(closeExceptionId);
    const timeline: any[] = [
      { time: e.registration.createdAt, event: '提交报名', color: 'c-blue', operator: e.registration.user.name,
        detail: `订单号 ${e.registration.orderNo} · ${e.registration.ticketType?.name || '-'} · ${e.registration.session?.name || '-'}` },
    ];
    if (e.registration.reviewAt) {
      timeline.push({ time: e.registration.reviewAt, event: '进入审核', color: 'c-amber', operator: '审核系统' });
    }
    timeline.push({ time: e.createdAt, event: '异常关闭', color: 'c-rose', operator: (e.registration as any).reviewedById || '管理员',
      detail: `原因：${e.closeReason.name}${e.customReason ? '（' + e.customReason + '）' : ''}${e.note ? ' · 备注：' + e.note : ''}` });
    if (e.registration.refunds?.length) {
      e.registration.refunds.forEach((r: any) => {
        timeline.push({ time: r.createdAt, event: '发起退款', color: 'c-slate', operator: '退款系统',
          detail: `退款单 ${r.refundNo} · ¥${r.amount} · 状态：${r.status}` });
      });
    }
    timeline.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    return {
      exception: {
        id: e.id, exceptionNo: `EX-${e.id.slice(0, 8).toUpperCase()}`,
        closeReason: e.closeReason, customReason: e.customReason, note: e.note,
        operator: (e.registration as any).reviewedById ? { name: (e.registration as any).reviewedById } : null,
        createdAt: e.createdAt,
      },
      registration: {
        orderNo: e.registration.orderNo, status: e.registration.status,
        amount: Number(e.registration.amount), qualityScore: e.registration.qualityScore,
        submittedAt: e.registration.createdAt, createdAt: e.registration.createdAt,
        reviewAt: e.registration.reviewAt, reviewNote: e.registration.reviewNote,
        user: e.registration.user,
        ticketType: e.registration.ticketType,
        session: e.registration.session,
      },
      timeline,
      refund: e.registration.refunds?.[0] || null,
      guestAllocation: e.registration.guestAllocation || null,
      qualityBreakdown: e.registration.qualityMetric || null,
    };
  }
}
