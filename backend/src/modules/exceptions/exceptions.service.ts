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
    const related: any = {};
    related.registration = e.registration;
    related.qualityBreakdown = e.registration.qualityMetric;
    if (e.registration.refunds?.length) related.refunds = e.registration.refunds;
    if (e.registration.guestAllocation) related.guestAllocation = e.registration.guestAllocation;
    return {
      exception: { id: e.id, reason: e.closeReason.name, category: e.closeReason.category, customReason: e.customReason, note: e.note, createdAt: e.createdAt },
      originalOrder: {
        orderNo: e.registration.orderNo, status: e.registration.status,
        amount: e.registration.amount, createdAt: e.registration.createdAt,
        reviewNote: e.registration.reviewNote, qualityScore: e.registration.qualityScore,
      },
      related,
      timeline: [
        { time: e.registration.createdAt, event: '提交报名', by: e.registration.user.name },
        { time: e.registration.reviewAt || e.createdAt, event: '审核/关闭', note: e.note, reason: e.closeReason.name },
      ].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()),
    };
  }
}
