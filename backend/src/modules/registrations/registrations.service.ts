import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommonService } from '../common/common.service';
import { RegistrationStatus } from '@prisma/client';

@Injectable()
export class RegistrationsService {
  constructor(private prisma: PrismaService, private common: CommonService) {}

  async create(body: any) {
    const { name, phone, email, company, title, idCard, ticketTypeId, sessionId, seatId, invoiceInfo, channelSource } = body;
    const ticket = await this.prisma.ticketType.findUnique({ where: { id: ticketTypeId } });
    if (!ticket) throw new NotFoundException('票种不存在');
    if (!ticket.isOnSale && ticket.level !== 'guest') throw new BadRequestException('该票种已停售');
    if (ticket.soldCount >= ticket.totalInventory) throw new BadRequestException('该票种已售罄');
    const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
    if (!session || !session.isActive) throw new BadRequestException('场次无效');

    let user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await this.prisma.user.create({
        data: { name, phone, email, company, title, idCardHash: idCard, channelSource: channelSource || '官方网站' },
      });
    }

    if (seatId) {
      const seat = await this.prisma.seat.findUnique({ where: { id: seatId } });
      if (!seat || seat.status !== 'available') throw new BadRequestException('座位不可用');
      await this.prisma.seat.update({ where: { id: seatId }, data: { status: 'sold' } });
    }

    const orderNo = this.common.generateOrderNo();
    const quality = this.common.calculateQualityScore(user, ticket, session);

    const reg = await this.prisma.$transaction(async (tx) => {
      const r = await tx.registration.create({
        data: {
          orderNo, userId: user.id, ticketTypeId, sessionId, seatId,
          status: RegistrationStatus.pending, amount: ticket.price,
          invoiceInfo: invoiceInfo || null, qualityScore: quality.totalScore,
        },
      });
      await tx.qualityMetric.create({
        data: {
          registrationId: r.id,
          channelScore: quality.channelScore,
          companyScore: quality.companyScore,
          positionScore: quality.positionScore,
          paymentSpeedScore: quality.paymentSpeedScore,
          totalScore: quality.totalScore,
          detailsJson: JSON.stringify({ auto: true, ticketLevel: ticket.level }),
        },
      });
      await tx.ticketType.update({
        where: { id: ticketTypeId },
        data: { soldCount: { increment: 1 } },
      });
      return r;
    });

    return { orderId: reg.id, orderNo: reg.orderNo, status: reg.status, qualityScore: quality.totalScore };
  }

  async list(query: any) {
    const {
      status, ticketTypeId, sessionId, channel, dateFrom, dateTo,
      page = 1, pageSize = 20, keyword, qualityFrom, qualityTo,
    } = query;
    const where: any = {};
    if (status) where.status = status;
    if (ticketTypeId) where.ticketTypeId = ticketTypeId;
    if (sessionId) where.sessionId = sessionId;
    if (qualityFrom || qualityTo) {
      where.qualityScore = {};
      if (qualityFrom) where.qualityScore.gte = Number(qualityFrom);
      if (qualityTo) where.qualityScore.lte = Number(qualityTo);
    }
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }
    if (keyword) {
      where.OR = [
        { orderNo: { contains: keyword } },
        { user: { name: { contains: keyword } } },
        { user: { phone: { contains: keyword } } },
        { user: { company: { contains: keyword } } },
      ];
    }
    const skip = (Number(page) - 1) * Number(pageSize);
    const [items, total] = await Promise.all([
      this.prisma.registration.findMany({
        where, skip, take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
          user: true, ticketType: true, session: true, seat: true,
          checkinCode: true, closeException: { include: { closeReason: true } },
          qualityMetric: true,
        },
      }),
      this.prisma.registration.count({ where }),
    ]);
    return { items, total, page: Number(page), pageSize: Number(pageSize) };
  }

  async detail(id: string) {
    const reg = await this.prisma.registration.findUnique({
      where: { id },
      include: {
        user: true, ticketType: true, session: true, seat: true,
        checkinCode: true, refunds: true, closeException: { include: { closeReason: true } },
        qualityMetric: true, guestAllocation: { include: { guest: true } },
      },
    });
    if (!reg) throw new NotFoundException('报名记录不存在');
    return reg;
  }

  async lookup(phone: string, orderId?: string) {
    const where: any = { user: { phone } };
    if (orderId) where.orderNo = orderId;
    const list = await this.prisma.registration.findMany({
      where, orderBy: { createdAt: 'desc' },
      include: {
        user: true, ticketType: true, session: true, seat: true,
        checkinCode: true, closeException: true, refunds: true,
      },
    });
    return list;
  }

  async review(id: string, action: string, data: any, adminId: string) {
    const reg = await this.prisma.registration.findUnique({ where: { id }, include: { user: true } });
    if (!reg) throw new NotFoundException('报名不存在');
    if (!['pending', 'reviewing'].includes(reg.status)) {
      throw new BadRequestException(`当前状态 ${reg.status} 无法审核`);
    }

    const now = new Date();
    let newStatus: any = reg.status;
    let reviewResult = '';
    const result: any = {};

    if (action === 'approve') {
      newStatus = RegistrationStatus.approved;
      reviewResult = 'approved';
      const code = this.common.generateCode('CHK');
      const qr = this.common.generateQRCodeSVG(code);
      await this.prisma.checkinCode.upsert({
        where: { registrationId: id },
        update: { code, qrSvg: qr, isUsed: false, usedAt: null },
        create: { registrationId: id, code, qrSvg: qr },
      });
      result.checkinCode = code;
    } else if (action === 'reject') {
      newStatus = RegistrationStatus.rejected;
      reviewResult = 'rejected';
    } else if (action === 'close') {
      if (!data.closeReasonId) throw new BadRequestException('异常关闭必须选择原因');
      newStatus = RegistrationStatus.closed;
      reviewResult = 'closed';
      await this.prisma.closeException.create({
        data: {
          registrationId: id, closeReasonId: data.closeReasonId,
          customReason: data.customReason, note: data.note, closedById: adminId,
        },
      });
      await this.prisma.ticketType.update({
        where: { id: reg.ticketTypeId }, data: { soldCount: { decrement: 1 } },
      });
      if (reg.seatId) {
        await this.prisma.seat.update({ where: { id: reg.seatId }, data: { status: 'available' } });
      }
    } else {
      throw new BadRequestException('非法审核操作');
    }

    const updated = await this.prisma.registration.update({
      where: { id },
      data: {
        status: newStatus, reviewResult, reviewAt: now,
        reviewedById: adminId, reviewNote: data.note || '',
      },
    });
    return { ...result, status: updated.status, message: '审核完成' };
  }
}
