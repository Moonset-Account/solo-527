import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as Handlebars from 'handlebars';

@Injectable()
export class NotificationsService {
  private logger = new Logger('Notifications');

  constructor(private prisma: PrismaService) {}

  listTemplates(onlyActive = true) {
    const where: any = {};
    if (onlyActive) where.isActive = true;
    return this.prisma.notificationTemplate.findMany({ where, orderBy: { code: 'asc' } });
  }

  async getTemplate(id: string) {
    const t = await this.prisma.notificationTemplate.findUnique({ where: { id } });
    if (!t) throw new NotFoundException('模板不存在');
    return t;
  }

  updateTemplate(id: string, data: any) {
    return this.prisma.notificationTemplate.update({
      where: { id },
      data: {
        name: data.name, subject: data.subject, contentBody: data.contentBody,
        variables: data.variables, isActive: data.isActive !== false,
      },
    });
  }

  private render(template: string, vars: Record<string, any>): string {
    try {
      return Handlebars.compile(template)(vars || {});
    } catch (e) {
      this.logger.warn('模板渲染失败: ' + e.message);
      return template;
    }
  }

  private buildAudienceFilter(audience: any) {
    const where: any = {};
    if (audience?.statuses?.length) where.status = { in: audience.statuses };
    if (audience?.ticketTypeIds?.length) where.ticketTypeId = { in: audience.ticketTypeIds };
    if (audience?.sessionIds?.length) where.sessionId = { in: audience.sessionIds };
    if (audience?.qualityFrom || audience?.qualityTo) {
      where.qualityScore = {};
      if (audience.qualityFrom) where.qualityScore.gte = Number(audience.qualityFrom);
      if (audience.qualityTo) where.qualityScore.lte = Number(audience.qualityTo);
    }
    if (audience?.registrationIds?.length) where.id = { in: audience.registrationIds };
    return where;
  }

  async send(params: { audience: any; templateId?: string; templateCode?: string; variables?: Record<string, any> }) {
    const { audience, templateId, templateCode, variables = {} } = params;
    const templateWhere: any = {};
    if (templateId) templateWhere.id = templateId;
    else if (templateCode) templateWhere.code = templateCode;
    else throw new NotFoundException('请指定模板');
    const template = await this.prisma.notificationTemplate.findFirst({ where: templateWhere });
    if (!template) throw new NotFoundException('模板不存在');

    const filter = this.buildAudienceFilter(audience);
    const registrations = await this.prisma.registration.findMany({
      where: filter, include: { user: true, ticketType: true, session: true, checkinCode: true },
      take: audience?.limit || 1000,
    });
    const results = [];
    for (const reg of registrations) {
      const vars = {
        ...variables,
        name: reg.user.name,
        phone: reg.user.phone,
        email: reg.user.email,
        orderNo: reg.orderNo,
        orderId: reg.orderNo,
        summitName: process.env.SUMMIT_NAME || '2026 全球科技创新峰会',
        ticketName: reg.ticketType.name,
        sessionName: reg.session.name,
        amount: reg.amount.toString(),
        checkinCode: reg.checkinCode?.code || '',
        confirmLink: `http://localhost:4200/status?orderId=${reg.orderNo}&phone=${reg.user.phone}`,
        reason: variables?.reason || template.code === 'review_rejected' ? '资料审核未通过' : '',
      };
      const renderedSubject = this.render(template.subject, vars);
      const renderedContent = this.render(template.contentBody, vars);
      const recipient = template.type === 'email' ? (reg.user.email || reg.user.phone) : reg.user.phone;

      this.logger.log(`[${template.type}] 发送给 ${reg.user.name}(${recipient}): ${renderedSubject}`);

      const log = await this.prisma.notificationLog.create({
        data: {
          templateId: template.id, recipient, subject: renderedSubject,
          content: renderedContent, status: 'sent', variables: vars,
        },
      });
      results.push({ id: log.id, recipient, subject: renderedSubject, status: 'sent' });
    }
    return { total: results.length, results };
  }

  listHistory(query: any) {
    const { page = 1, pageSize = 50, templateId, status, keyword, dateFrom, dateTo } = query;
    const where: any = {};
    if (templateId) where.templateId = templateId;
    if (status) where.status = status;
    if (keyword) where.OR = [{ recipient: { contains: keyword } }, { subject: { contains: keyword } }];
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }
    const skip = (Number(page) - 1) * Number(pageSize);
    return Promise.all([
      this.prisma.notificationLog.findMany({
        where, skip, take: Number(pageSize), orderBy: { createdAt: 'desc' },
        include: { template: true },
      }),
      this.prisma.notificationLog.count({ where }),
    ]).then(([items, total]) => ({ items, total, page: Number(page), pageSize: Number(pageSize) }));
  }
}
