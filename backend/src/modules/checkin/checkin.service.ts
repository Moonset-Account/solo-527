import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommonService } from '../common/common.service';

@Injectable()
export class CheckinService {
  constructor(private prisma: PrismaService, private common: CommonService) {}

  async generate(registrationIds: string[]) {
    const registrations = await this.prisma.registration.findMany({
      where: {
        id: { in: registrationIds },
        status: { in: ['approved', 'paid'] as any },
      },
      include: { user: true },
    });
    if (!registrations.length) throw new BadRequestException('没有可生成签到码的报名');
    const results = [];
    for (const r of registrations) {
      const code = this.common.generateCode('CHK');
      const qr = this.common.generateQRCodeSVG(code);
      const created = await this.prisma.checkinCode.upsert({
        where: { registrationId: r.id },
        update: { code, qrSvg: qr, isUsed: false, usedAt: null },
        create: { registrationId: r.id, code, qrSvg: qr },
      });
      results.push({ orderNo: r.orderNo, name: r.user.name, code: created.code });
    }
    return { generated: results.length, results };
  }

  list(query: any) {
    const { page = 1, pageSize = 20, isUsed, keyword, sessionId } = query;
    const where: any = {};
    if (isUsed !== undefined) where.isUsed = isUsed === 'true';
    if (keyword) {
      where.OR = [
        { code: { contains: keyword } },
        { registration: { orderNo: { contains: keyword } } },
        { registration: { user: { name: { contains: keyword } } } },
      ];
    }
    if (sessionId) where.registration = { sessionId };
    const skip = (Number(page) - 1) * Number(pageSize);
    return Promise.all([
      this.prisma.checkinCode.findMany({
        where, skip, take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
          registration: { include: { user: true, ticketType: true, session: true } },
        },
      }),
      this.prisma.checkinCode.count({ where }),
    ]).then(([items, total]) => ({ items, total, page: Number(page), pageSize: Number(pageSize) }));
  }

  async getByCode(code: string) {
    const c = await this.prisma.checkinCode.findUnique({
      where: { code },
      include: { registration: { include: { user: true, ticketType: true, session: true } } },
    });
    if (!c) throw new NotFoundException('签到码不存在');
    return c;
  }

  async verify(code: string, location: string, operatorId: string) {
    const c = await this.prisma.checkinCode.findUnique({ where: { code }, include: { registration: true } });
    if (!c) throw new NotFoundException('签到码不存在');
    if (c.isUsed) throw new BadRequestException('该签到码已核销');
    if (!['approved', 'paid'].includes(c.registration.status)) {
      throw new BadRequestException('报名状态异常，无法签到');
    }
    const now = new Date();
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.checkinCode.update({
        where: { code }, data: { isUsed: true, usedAt: now, usedLocation: location, usedById: operatorId },
      });
      await tx.registration.update({ where: { id: c.registrationId }, data: { status: 'checked_in' as any } });
      await tx.gapTodo.updateMany({ where: { registrationId: c.registrationId }, data: { status: 'handled', handleAction: 'checked_in', handledAt: now, handledById: operatorId } });
      return updated;
    });
  }

  async exportCsv(sessionId?: string) {
    const where: any = {};
    if (sessionId) where.registration = { sessionId };
    const list = await this.prisma.checkinCode.findMany({
      where, include: { registration: { include: { user: true, ticketType: true, session: true } } },
    });
    const header = '订单号,姓名,手机,公司,职位,票种,场次,签到码,状态,核销时间,核销地点';
    const rows = list.map(c => [
      c.registration.orderNo,
      c.registration.user.name,
      c.registration.user.phone,
      c.registration.user.company || '',
      c.registration.user.title || '',
      c.registration.ticketType.name,
      c.registration.session.name,
      c.code,
      c.isUsed ? '已核销' : '未核销',
      c.usedAt || '',
      c.usedLocation || '',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    return '\ufeff' + [header, ...rows].join('\n');
  }
}
