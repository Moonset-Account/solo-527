import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommonService } from '../common/common.service';
import { RefundStatus } from '@prisma/client';

@Injectable()
export class RefundsService {
  constructor(private prisma: PrismaService, private common: CommonService) {}

  async apply(body: any) {
    const { orderId, reason, note, phone } = body;
    const reg = await this.prisma.registration.findUnique({
      where: { orderNo: orderId }, include: { user: true },
    });
    if (!reg) throw new NotFoundException('订单不存在');
    if (reg.user.phone !== phone) throw new BadRequestException('手机号与订单不匹配');
    if (!['approved', 'paid', 'rejected'].includes(reg.status)) {
      throw new BadRequestException(`当前状态 ${reg.status} 无法申请退款`);
    }
    const existing = await this.prisma.refund.findFirst({
      where: { registrationId: reg.id, status: { in: ['pending', 'approved'] as any } },
    });
    if (existing) throw new BadRequestException('已存在处理中的退款申请');
    return this.prisma.refund.create({
      data: {
        refundNo: this.common.generateOrderNo('RF'),
        registrationId: reg.id, userId: reg.userId, amount: reg.amount,
        reason, note, status: RefundStatus.pending,
      },
    });
  }

  list(query: any) {
    const { page = 1, pageSize = 20, status, keyword, dateFrom, dateTo } = query;
    const where: any = {};
    if (status) where.status = status;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }
    if (keyword) {
      where.OR = [
        { refundNo: { contains: keyword } },
        { registration: { orderNo: { contains: keyword } } },
        { registration: { user: { name: { contains: keyword } } } },
      ];
    }
    const skip = (Number(page) - 1) * Number(pageSize);
    return Promise.all([
      this.prisma.refund.findMany({
        where, skip, take: Number(pageSize), orderBy: { createdAt: 'desc' },
        include: { registration: { include: { user: true, ticketType: true, session: true } } },
      }),
      this.prisma.refund.count({ where }),
    ]).then(([items, total]) => ({ items, total, page: Number(page), pageSize: Number(pageSize) }));
  }

  async detail(id: string) {
    const r = await this.prisma.refund.findUnique({
      where: { id },
      include: { registration: { include: { user: true, ticketType: true, checkinCode: true, session: true } } },
    });
    if (!r) throw new NotFoundException('退款申请不存在');
    return r;
  }

  async review(id: string, action: string, note: string, adminId: string) {
    const r = await this.prisma.refund.findUnique({ where: { id } });
    if (!r) throw new NotFoundException('退款申请不存在');
    if (r.status !== RefundStatus.pending) throw new BadRequestException('申请已处理');
    const now = new Date();
    if (action === 'approve') {
      return this.prisma.refund.update({
        where: { id },
        data: { status: RefundStatus.approved, reviewedById: adminId, reviewedAt: now, note },
      });
    } else if (action === 'reject') {
      return this.prisma.refund.update({
        where: { id },
        data: { status: RefundStatus.rejected, reviewedById: adminId, reviewedAt: now, note },
      });
    }
    throw new BadRequestException('非法操作');
  }

  async execute(id: string, adminId: string) {
    const r = await this.prisma.refund.findUnique({ where: { id }, include: { registration: true } });
    if (!r) throw new NotFoundException('退款申请不存在');
    if (r.status !== RefundStatus.approved) throw new BadRequestException('需先审批通过才能执行');
    const now = new Date();
    const txId = 'TXN' + Math.random().toString(36).substring(2, 14).toUpperCase();
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.refund.update({
        where: { id },
        data: { status: RefundStatus.executed, executedAt: now, transactionId: txId },
      });
      await tx.registration.update({
        where: { id: r.registrationId }, data: { status: 'refunded' as any },
      });
      await tx.ticketType.update({
        where: { id: r.registration.ticketTypeId }, data: { soldCount: { decrement: 1 } },
      });
      if (r.registration.seatId) {
        await tx.seat.update({ where: { id: r.registration.seatId }, data: { status: 'available' } });
      }
      return updated;
    });
  }
}
