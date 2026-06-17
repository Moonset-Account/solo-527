import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GapService {
  constructor(private prisma: PrismaService) {}

  async refreshGap() {
    const candidates = await this.prisma.registration.findMany({
      where: {
        status: { in: ['approved', 'paid'] as any },
        checkinCode: { isNot: null },
        OR: [
          { checkinCode: { isUsed: false } },
        ],
      },
      include: { checkinCode: true, user: true, ticketType: true, session: true, qualityMetric: true },
      take: 50,
    });
    const existing = new Set((await this.prisma.gapTodo.findMany()).map(t => t.registrationId));
    const created = [];
    for (const reg of candidates) {
      if (existing.has(reg.id)) continue;
      const score = reg.qualityMetric?.totalScore || 70;
      const priority = score >= 85 ? 1 : score >= 75 ? 2 : 3;
      const gapType = score >= 85 ? 'high_value_missing' : 'unconfirmed';
      created.push(await this.prisma.gapTodo.create({
        data: { registrationId: reg.id, gapType, priority, status: 'pending' },
      }));
    }
    return { refreshed: created.length };
  }

  async list(status = 'pending') {
    await this.refreshGap();
    const where: any = {};
    if (status !== 'all') where.status = status;
    const todos = await this.prisma.gapTodo.findMany({
      where, orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
      include: {
        registration: {
          include: { user: true, ticketType: true, session: true, checkinCode: true, qualityMetric: true },
        },
      },
    } as any);

    const allHandled = await this.prisma.gapTodo.findMany({
      where: { status: 'handled' },
      include: { registration: { include: { qualityMetric: true } } },
    } as any);
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayHandled = allHandled.filter(t => t.handledAt && new Date(t.handledAt) >= todayStart);
    const replaced = allHandled.filter(t => t.handleAction === 'replaced');
    const confirmed = allHandled.filter(t => t.handleAction === 'confirmed');
    const closed = allHandled.filter(t => t.handleAction === 'closed_gap');
    const contacted = allHandled.filter(t => t.handleAction === 'contacted');
    const replacePct = allHandled.length ? Math.round(replaced.length / allHandled.length * 100) : 0;

    const dayMap: Record<string, { confirmed: number; replaced: number; closed: number; qualityDelta: number }> = {};
    allHandled.forEach(t => {
      if (!t.handledAt) return;
      const day = new Date(t.handledAt).toISOString().slice(0, 10);
      if (!dayMap[day]) dayMap[day] = { confirmed: 0, replaced: 0, closed: 0, qualityDelta: 0 };
      if (t.handleAction === 'confirmed') { dayMap[day].confirmed++; dayMap[day].qualityDelta += 1; }
      if (t.handleAction === 'replaced') { dayMap[day].replaced++; dayMap[day].qualityDelta += 2; }
      if (t.handleAction === 'closed_gap') { dayMap[day].closed++; dayMap[day].qualityDelta -= 1; }
    });
    const dailyChart = Object.entries(dayMap).sort(([a], [b]) => a.localeCompare(b)).map(([day, v]) => ({ day, ...v }));

    const stats = {
      pending: await this.prisma.gapTodo.count({ where: { status: 'pending' } }),
      handled: await this.prisma.gapTodo.count({ where: { status: 'handled' } }),
      highPriority: await this.prisma.gapTodo.count({ where: { status: 'pending', priority: 1 } }),
      todayHandled: todayHandled.length,
      replacePct,
      replacedCount: replaced.length,
      confirmedCount: confirmed.length,
      closedCount: closed.length,
      contactedCount: contacted.length,
      dailyChart,
      totalQualityDelta: allHandled.reduce((sum, t) => {
        if (t.handleAction === 'replaced') return sum + 2;
        if (t.handleAction === 'confirmed') return sum + 1;
        if (t.handleAction === 'closed_gap') return sum - 1;
        return sum;
      }, 0),
    };
    return { todos, stats };
  }

  async suggestions(registrationId: string) {
    const target = await this.prisma.registration.findUnique({
      where: { id: registrationId }, include: { ticketType: true, session: true, qualityMetric: true },
    });
    if (!target) throw new NotFoundException('报名不存在');
    const candidates = await this.prisma.registration.findMany({
      where: {
        status: { in: ['pending', 'reviewing'] as any },
        ticketTypeId: target.ticketTypeId,
        sessionId: target.sessionId,
        NOT: { id: registrationId },
      },
      include: { user: true, qualityMetric: true },
      orderBy: { qualityScore: 'desc' },
      take: 5,
    });
    return candidates.map(c => ({
      id: c.id, name: c.user.name, company: c.user.company, title: c.user.title,
      qualityScore: c.qualityScore, phone: c.user.phone,
      scoreBreakdown: {
        channel: c.qualityMetric?.channelScore,
        company: c.qualityMetric?.companyScore,
        position: c.qualityMetric?.positionScore,
      },
    }));
  }

  async handle(registrationId: string, action: string, note: string, adminId: string) {
    const todo = await this.prisma.gapTodo.findFirst({
      where: { registrationId }, orderBy: { createdAt: 'desc' },
    });
    if (!todo) throw new NotFoundException('缺口待办不存在');
    const now = new Date();
    let qualityImpact = 0;
    if (action === 'replaced') qualityImpact = +2;
    else if (action === 'confirmed') qualityImpact = +1;
    else if (action === 'closed_gap') qualityImpact = -1;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.gapTodo.update({
        where: { id: todo.id },
        data: { status: 'handled', handleAction: action, handleNote: note, handledById: adminId, handledAt: now },
      });
      if (qualityImpact) {
        const qm = await tx.qualityMetric.findFirst({ where: { registrationId } });
        if (qm) {
          await tx.qualityMetric.update({
            where: { id: qm.id },
            data: { totalScore: Math.max(0, Math.min(100, qm.totalScore + qualityImpact)) },
          });
        }
      }
      return updated;
    });
  }
}
