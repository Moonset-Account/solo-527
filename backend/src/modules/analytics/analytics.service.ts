import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async dashboard() {
    const [total, pendingReview, approved, paid, checkedIn, refunded, closed, rejected] = await Promise.all([
      this.prisma.registration.count(),
      this.prisma.registration.count({ where: { status: { in: ['pending', 'reviewing'] as any } } }),
      this.prisma.registration.count({ where: { status: 'approved' as any } }),
      this.prisma.registration.count({ where: { status: 'paid' as any } }),
      this.prisma.registration.count({ where: { status: 'checked_in' as any } }),
      this.prisma.registration.count({ where: { status: 'refunded' as any } }),
      this.prisma.registration.count({ where: { status: 'closed' as any } }),
      this.prisma.registration.count({ where: { status: 'rejected' as any } }),
    ]);

    const totalPaidLike = approved + paid + checkedIn;
    const passRate = total ? Math.round((totalPaidLike / total) * 100) : 0;
    const checkInRate = totalPaidLike ? Math.round((checkedIn / totalPaidLike) * 100) : 0;
    const refundRate = total ? Math.round((refunded / total) * 100) : 0;

    const tickets = await this.prisma.ticketType.findMany({
      select: { id: true, name: true, level: true, totalInventory: true, soldCount: true, price: true },
    });
    const revenue = await this.prisma.registration.aggregate({
      where: { status: { in: ['approved', 'paid', 'checked_in'] as any } },
      _sum: { amount: true },
    });

    const daily = await this.prisma.$queryRaw`
      SELECT date_trunc('day', created_at) AS day,
             COUNT(*) AS total,
             COUNT(*) FILTER (WHERE status IN ('approved','paid','checked_in')) AS passed
      FROM registrations
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY day
      ORDER BY day ASC` as any[];
    const dailyFormatted = daily.map(d => ({
      day: new Date(d.day).toISOString().slice(0, 10),
      total: Number(d.total), passed: Number(d.passed),
    }));

    const pendingRefunds = await this.prisma.refund.count({ where: { status: 'pending' as any } });
    const gapTodos = await this.prisma.gapTodo.count({ where: { status: 'pending' } });

    return {
      kpi: {
        total, pendingReview, approved, paid, checkedIn, refunded, closed, rejected,
        passRate, checkInRate, refundRate,
        revenue: Number(revenue._sum.amount || 0),
      },
      tickets,
      daily: dailyFormatted,
      todos: { pendingReview, pendingRefunds, gapTodos },
    };
  }

  async quality(params: any) {
    const { dimension = 'channel', dateFrom, dateTo } = params;
    const where: any = {};
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const qualityMetrics = await this.prisma.qualityMetric.findMany({
      where: { registration: where },
      include: { registration: { include: { user: true, ticketType: true, session: true } } },
    });

    const stats: Record<string, any> = {};
    let result: any;

    if (dimension === 'channel') {
      for (const qm of qualityMetrics) {
        const key = qm.registration.user.channelSource || '未知';
        if (!stats[key]) stats[key] = { count: 0, totalScore: 0, approved: 0, checkedIn: 0 };
        stats[key].count++;
        stats[key].totalScore += qm.totalScore;
        if (['approved', 'paid', 'checked_in'].includes(qm.registration.status)) stats[key].approved++;
        if (qm.registration.status === 'checked_in') stats[key].checkedIn++;
      }
      result = Object.entries(stats).map(([name, s]) => ({
        name, count: s.count, avgScore: Math.round(s.totalScore / s.count),
        passRate: s.count ? Math.round((s.approved / s.count) * 100) : 0,
        checkInRate: s.approved ? Math.round((s.checkedIn / s.approved) * 100) : 0,
      }));
    } else if (dimension === 'ticketType') {
      for (const qm of qualityMetrics) {
        const key = qm.registration.ticketType.name;
        if (!stats[key]) stats[key] = { count: 0, totalScore: 0, revenue: 0, checkedIn: 0 };
        stats[key].count++;
        stats[key].totalScore += qm.totalScore;
        stats[key].revenue += Number(qm.registration.amount);
        if (qm.registration.status === 'checked_in') stats[key].checkedIn++;
      }
      result = Object.entries(stats).map(([name, s]) => ({
        name, count: s.count, avgScore: Math.round(s.totalScore / s.count),
        revenue: Math.round(s.revenue), checkInCount: s.checkedIn,
      }));
    } else {
      for (const qm of qualityMetrics) {
        const key = qm.registration.session.name;
        if (!stats[key]) stats[key] = { count: 0, totalScore: 0, checkedIn: 0 };
        stats[key].count++;
        stats[key].totalScore += qm.totalScore;
        if (qm.registration.status === 'checked_in') stats[key].checkedIn++;
      }
      result = Object.entries(stats).map(([name, s]) => ({
        name, count: s.count, avgScore: Math.round(s.totalScore / s.count),
        checkInRate: s.count ? Math.round((s.checkedIn / s.count) * 100) : 0,
      }));
    }

    const dist = [0, 0, 0, 0, 0];
    qualityMetrics.forEach(q => {
      if (q.totalScore >= 90) dist[0]++;
      else if (q.totalScore >= 80) dist[1]++;
      else if (q.totalScore >= 70) dist[2]++;
      else if (q.totalScore >= 60) dist[3]++;
      else dist[4]++;
    });

    return { dimension, data: result, scoreDistribution: [
      { range: '90-100', count: dist[0], label: '优秀' },
      { range: '80-89', count: dist[1], label: '良好' },
      { range: '70-79', count: dist[2], label: '中等' },
      { range: '60-69', count: dist[3], label: '及格' },
      { range: '0-59', count: dist[4], label: '较差' },
    ]};
  }

  async funnel() {
    const steps = [
      { key: 'exposure', label: '页面曝光', value: 5800, desc: '着陆页访问量' },
      { key: 'click_form', label: '点击报名', value: 2100, desc: '进入表单页' },
      { key: 'submitted', label: '提交报名', value: 0, desc: '成功提交表单' },
      { key: 'review_pass', label: '审核通过', value: 0, desc: '通过审核' },
      { key: 'paid', label: '完成支付', value: 0, desc: '付费+免费通过合计' },
      { key: 'checked_in', label: '到场签到', value: 0, desc: '实际到场' },
    ];
    const counts = await Promise.all([
      this.prisma.registration.count(),
      this.prisma.registration.count({ where: { status: { in: ['approved', 'paid', 'checked_in'] as any } } }),
      this.prisma.registration.count({ where: { status: { in: ['paid', 'approved', 'checked_in'] as any } } }),
      this.prisma.registration.count({ where: { status: 'checked_in' as any } }),
    ]);
    steps[2].value = counts[0];
    steps[3].value = counts[1];
    steps[4].value = counts[2];
    steps[5].value = counts[3];

    const data = steps.map((s, i) => ({
      ...s,
      rate: i === 0 ? 100 : Math.round((s.value / steps[i - 1].value) * 100 * 10) / 10,
      overallRate: Math.round((s.value / steps[0].value) * 100 * 10) / 10,
    }));
    return data;
  }
}
