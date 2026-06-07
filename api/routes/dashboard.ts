import { Router, type Request, type Response } from 'express';
import { getDataSet, filterByParams, maskSensitiveProjects } from '../data/mockData.js';
import { cache, CACHE_TTL, buildCacheKey } from '../data/cache.js';
import type { FilterParams, Anomaly, AnomalyLevel } from '../../shared/types.js';

function parseFilterParams(req: Request): { params: FilterParams; customerStage?: string } {
  const projectIds = req.query.projectIds
    ? (Array.isArray(req.query.projectIds) ? req.query.projectIds as string[] : [req.query.projectIds as string])
    : undefined;
  const consultantIds = req.query.consultantIds
    ? (Array.isArray(req.query.consultantIds) ? req.query.consultantIds as string[] : [req.query.consultantIds as string])
    : undefined;
  const channelIds = req.query.channelIds
    ? (Array.isArray(req.query.channelIds) ? req.query.channelIds as string[] : [req.query.channelIds as string])
    : undefined;
  const months = req.query.months
    ? (Array.isArray(req.query.months) ? req.query.months as string[] : [req.query.months as string])
    : undefined;
  const customerStage = req.query.customerStage as string | undefined;

  return {
    params: { projectIds, consultantIds, channelIds, customerStage, months },
    customerStage,
  };
}

const router = Router();

router.get('/anomalies', (req: Request, res: Response): void => {
  const { params, customerStage } = parseFilterParams(req);
  const cacheKey = buildCacheKey('anomalies', { ...params, customerStage });

  const cached = cache.get<Anomaly[]>(cacheKey);
  if (cached) {
    res.json({ anomalies: cached });
    return;
  }

  const data = getDataSet();
  const consultations = filterByParams(data.consultations, params, data.customers, customerStage);
  const appointments = data.appointments.filter((a) => consultations.some((c) => c.id === a.consultationId));
  const visits = data.visits.filter((v) => appointments.some((a) => a.id === v.appointmentId));
  const plans = data.treatmentPlans.filter((p) => visits.some((v) => v.id === p.visitId));
  const payments = data.payments.filter((p) => plans.some((pl) => pl.id === p.planId));
  const followUps = data.followUps.filter((f) => payments.some((p) => p.id === f.paymentId));

  const totalConsultations = consultations.length;
  const totalAppointments = appointments.filter((a) => a.confirmedAt).length;
  const totalVisits = visits.length;
  const totalPlans = plans.length;
  const totalPayments = payments.filter((p) => p.status === 'completed').length;
  const totalFollowUps = followUps.filter((f) => f.actualVisitAt).length;

  const anomalies: Anomaly[] = [];

  if (totalConsultations > 0) {
    const appRate = totalAppointments / totalConsultations;
    if (appRate < 0.55) {
      anomalies.push({
        id: 'anom-1',
        level: 'critical' as AnomalyLevel,
        title: '咨询→预约转化率偏低',
        description: `当前转化率 ${(appRate * 100).toFixed(1)}%，低于阈值 55%`,
        metric: 'consultationToAppointment',
        currentValue: appRate,
        expectedValue: 0.72,
        relatedView: 'funnel',
        relatedFilter: params,
      });
    }

    const visitRate = totalAppointments > 0 ? totalVisits / totalAppointments : 0;
    if (visitRate < 0.55) {
      anomalies.push({
        id: 'anom-2',
        level: 'warning' as AnomalyLevel,
        title: '预约→到店转化率下降',
        description: `当前转化率 ${(visitRate * 100).toFixed(1)}%，低于正常水平`,
        metric: 'appointmentToVisit',
        currentValue: visitRate,
        expectedValue: 0.68,
        relatedView: 'funnel',
        relatedFilter: params,
      });
    }

    const planRate = totalVisits > 0 ? totalPlans / totalVisits : 0;
    if (planRate < 0.45) {
      anomalies.push({
        id: 'anom-3',
        level: 'warning' as AnomalyLevel,
        title: '到店→方案转化率偏低',
        description: `当前转化率 ${(planRate * 100).toFixed(1)}%，需关注方案设计环节`,
        metric: 'visitToPlan',
        currentValue: planRate,
        expectedValue: 0.6,
        relatedView: 'funnel',
        relatedFilter: params,
      });
    }

    const paymentRate = totalPlans > 0 ? totalPayments / totalPlans : 0;
    if (paymentRate < 0.4) {
      anomalies.push({
        id: 'anom-4',
        level: 'critical' as AnomalyLevel,
        title: '方案→付款转化率异常',
        description: `当前转化率 ${(paymentRate * 100).toFixed(1)}%，付款环节可能存在障碍`,
        metric: 'planToPayment',
        currentValue: paymentRate,
        expectedValue: 0.55,
        relatedView: 'funnel',
        relatedFilter: params,
      });
    }

    const followUpRate = totalPayments > 0 ? totalFollowUps / totalPayments : 0;
    if (followUpRate < 0.3) {
      anomalies.push({
        id: 'anom-5',
        level: 'info' as AnomalyLevel,
        title: '复诊率有待提升',
        description: `当前复诊率 ${(followUpRate * 100).toFixed(1)}%，建议加强术后跟踪`,
        metric: 'paymentToFollowUp',
        currentValue: followUpRate,
        expectedValue: 0.4,
        relatedView: 'follow-up',
        relatedFilter: params,
      });
    }
  }

  const consultantLoadMap = new Map<string, number>();
  for (const con of consultations) {
    consultantLoadMap.set(con.consultantId, (consultantLoadMap.get(con.consultantId) ?? 0) + 1);
  }
  for (const [id, load] of consultantLoadMap) {
    if (load > 30) {
      const consultant = data.consultants.find((c) => c.id === id);
      anomalies.push({
        id: `anom-load-${id}`,
        level: 'warning' as AnomalyLevel,
        title: `${consultant?.name ?? id} 负载过高`,
        description: `在管客户 ${load} 人，超出建议上限 30 人`,
        metric: 'consultantLoad',
        currentValue: load,
        expectedValue: 30,
        relatedView: 'consultant',
        relatedFilter: { ...params, consultantIds: [id] },
      });
    }
  }

  for (const channel of data.channels) {
    const channelConsultations = consultations.filter((c) => c.channelId === channel.id);
    if (channelConsultations.length >= 10) {
      const channelPayments = channelConsultations.reduce((acc, c) => {
        const apt = data.appointments.find((a) => a.consultationId === c.id);
        if (!apt) return acc;
        const vis = data.visits.find((v) => v.appointmentId === apt.id);
        if (!vis) return acc;
        const plan = data.treatmentPlans.find((p) => p.visitId === vis.id);
        if (!plan) return acc;
        const pay = data.payments.find((p) => p.planId === plan.id && p.status === 'completed');
        return pay ? acc + 1 : acc;
      }, 0);
      const channelRate = channelPayments / channelConsultations.length;
      if (channelRate < 0.2) {
        anomalies.push({
          id: `anom-ch-${channel.id}`,
          level: 'info' as AnomalyLevel,
          title: `${channel.name} 渠道质量偏低`,
          description: `成单转化率 ${(channelRate * 100).toFixed(1)}%，低于阈值 20%`,
          metric: 'channelCostEfficiency',
          currentValue: channelRate,
          expectedValue: 0.2,
          relatedView: 'channel',
          relatedFilter: { ...params, channelIds: [channel.id] },
        });
      }
    }
  }

  cache.set(cacheKey, anomalies, CACHE_TTL.anomalies);
  res.json({ anomalies });
});

router.get('/funnel', (req: Request, res: Response): void => {
  const { params, customerStage } = parseFilterParams(req);
  const cacheKey = buildCacheKey('funnel', { ...params, customerStage });

  const cached = cache.get(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  const data = getDataSet();
  const consultations = filterByParams(data.consultations, params, data.customers, customerStage);
  const appointments = data.appointments.filter((a) => consultations.some((c) => c.id === a.consultationId));
  const visits = data.visits.filter((v) => appointments.some((a) => a.id === v.appointmentId));
  const plans = data.treatmentPlans.filter((p) => visits.some((v) => v.id === p.visitId));
  const payments = data.payments.filter((p) => plans.some((pl) => pl.id === p.planId) && p.status === 'completed');
  const followUps = data.followUps.filter((f) => payments.some((p) => p.id === f.paymentId) && f.actualVisitAt);

  const totalConsultations = consultations.length;
  const totalAppointments = appointments.filter((a) => a.confirmedAt).length;
  const totalVisits = visits.length;
  const totalPlans = plans.length;
  const totalPayments = payments.length;
  const totalFollowUps = followUps.length;

  const stages = [
    {
      name: '咨询',
      count: totalConsultations,
      rate: 1,
      prevRate: 0.98,
    },
    {
      name: '预约',
      count: totalAppointments,
      rate: totalConsultations > 0 ? totalAppointments / totalConsultations : 0,
      prevRate: 0.72,
    },
    {
      name: '到店',
      count: totalVisits,
      rate: totalAppointments > 0 ? totalVisits / totalAppointments : 0,
      prevRate: 0.68,
    },
    {
      name: '方案',
      count: totalPlans,
      rate: totalVisits > 0 ? totalPlans / totalVisits : 0,
      prevRate: 0.6,
    },
    {
      name: '付款',
      count: totalPayments,
      rate: totalPlans > 0 ? totalPayments / totalPlans : 0,
      prevRate: 0.55,
    },
    {
      name: '复诊',
      count: totalFollowUps,
      rate: totalPayments > 0 ? totalFollowUps / totalPayments : 0,
      prevRate: 0.4,
    },
  ];

  const result = { stages };
  cache.set(cacheKey, result, CACHE_TTL.funnel);
  res.json(result);
});

router.get('/channel-quality', (req: Request, res: Response): void => {
  const { params, customerStage } = parseFilterParams(req);
  const cacheKey = buildCacheKey('channel', { ...params, customerStage });

  const cached = cache.get(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  const data = getDataSet();
  const consultations = filterByParams(data.consultations, params, data.customers, customerStage);

  const channels = data.channels.map((channel) => {
    const channelConsultations = consultations.filter((c) => c.channelId === channel.id);
    const total = channelConsultations.length;

    let visitedCount = 0;
    let dealCount = 0;

    for (const con of channelConsultations) {
      const apt = data.appointments.find((a) => a.consultationId === con.id && a.confirmedAt);
      if (!apt) continue;
      const vis = data.visits.find((v) => v.appointmentId === apt.id);
      if (vis) visitedCount++;
      const plan = vis ? data.treatmentPlans.find((p) => p.visitId === vis.id) : undefined;
      if (plan) {
        const pay = data.payments.find((p) => p.planId === plan.id && p.status === 'completed');
        if (pay) dealCount++;
      }
    }

    return {
      id: channel.id,
      name: channel.name,
      conversionRate: total > 0 ? (visitedCount / total) * 100 : 0,
      visitRate: total > 0 ? (visitedCount / total) * 100 : 0,
      dealRate: total > 0 ? (dealCount / total) * 100 : 0,
      rank: 0,
      prevRank: 0,
    };
  });

  channels.sort((a, b) => b.conversionRate - a.conversionRate);
  channels.forEach((ch, i) => {
    ch.rank = i + 1;
    ch.prevRank = i + 1 + (Math.random() > 0.5 ? 1 : -1);
    if (ch.prevRank < 1) ch.prevRank = 1;
  });

  const result = { channels };
  cache.set(cacheKey, result, CACHE_TTL.channel);
  res.json(result);
});

router.get('/consultant-load', (req: Request, res: Response): void => {
  const { params, customerStage } = parseFilterParams(req);
  const cacheKey = buildCacheKey('consultant', { ...params, customerStage });

  const cached = cache.get(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  const data = getDataSet();
  const consultations = filterByParams(data.consultations, params, data.customers, customerStage);

  const consultants = data.consultants.map((consultant) => {
    const myConsultations = consultations.filter((c) => c.consultantId === consultant.id);
    const stageDistribution: Record<string, number> = {
      lead: 0,
      consulted: 0,
      appointed: 0,
      visited: 0,
      planned: 0,
      paid: 0,
      followed_up: 0,
    };

    let paidCount = 0;
    let completedCount = 0;

    for (const con of myConsultations) {
      const apt = data.appointments.find((a) => a.consultationId === con.id && a.confirmedAt);
      if (apt) {
        stageDistribution.appointed++;
        const vis = data.visits.find((v) => v.appointmentId === apt.id);
        if (vis) {
          stageDistribution.visited++;
          const plan = data.treatmentPlans.find((p) => p.visitId === vis.id);
          if (plan) {
            stageDistribution.planned++;
            const pay = data.payments.find((p) => p.planId === plan.id && p.status === 'completed');
            if (pay) {
              paidCount++;
              stageDistribution.paid++;
              const fu = data.followUps.find((f) => f.paymentId === pay.id && f.actualVisitAt);
              if (fu) {
                completedCount++;
                stageDistribution.followed_up++;
              }
            }
          }
        }
      } else {
        stageDistribution.lead++;
      }
    }

    return {
      id: consultant.id,
      name: consultant.name,
      totalCustomers: myConsultations.length,
      stageDistribution,
      conversionRate: myConsultations.length > 0 ? paidCount / myConsultations.length : 0,
    };
  });

  const result = { consultants };
  cache.set(cacheKey, result, CACHE_TTL.consultant);
  res.json(result);
});

router.get('/follow-up-trend', (req: Request, res: Response): void => {
  const { params, customerStage } = parseFilterParams(req);
  const cacheKey = buildCacheKey('followup', { ...params, customerStage });

  const cached = cache.get(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  const data = getDataSet();
  const consultations = filterByParams(data.consultations, params, data.customers, customerStage);

  const monthly = data.months.map((month) => {
    const monthFollowUps = data.followUps.filter((f) => {
      const pay = data.payments.find((p) => p.id === f.paymentId);
      if (!pay) return false;
      const plan = data.treatmentPlans.find((pl) => pl.id === pay.planId);
      if (!plan) return false;
      const vis = data.visits.find((v) => v.id === plan.visitId);
      if (!vis) return false;
      const apt = data.appointments.find((a) => a.id === vis.appointmentId);
      if (!apt) return false;
      const con = data.consultations.find((c) => c.id === apt.consultationId);
      if (!con) return false;
      return con.createdAt.substring(0, 7) === month;
    });

    const total = monthFollowUps.length;
    const completed = monthFollowUps.filter((f) => f.actualVisitAt).length;
    const avgInterval =
      completed > 0
        ? monthFollowUps
            .filter((f) => f.intervalDays)
            .reduce((sum, f) => sum + (f.intervalDays ?? 0), 0) / completed
        : 0;

    return {
      month,
      followUpRate: total > 0 ? completed / total : 0,
      avgIntervalDays: Math.round(avgInterval),
    };
  });

  const intervalRanges = ['0-7天', '8-14天', '15-30天', '31-60天', '61-90天', '90天+'];
  const intervalDistribution = intervalRanges.map((range) => ({
    range,
    count: data.followUps.filter((f) => {
      if (!f.intervalDays) return false;
      const d = f.intervalDays;
      switch (range) {
        case '0-7天': return d <= 7;
        case '8-14天': return d >= 8 && d <= 14;
        case '15-30天': return d >= 15 && d <= 30;
        case '31-60天': return d >= 31 && d <= 60;
        case '61-90天': return d >= 61 && d <= 90;
        case '90天+': return d > 90;
        default: return false;
      }
    }).length,
  }));

  const categories = [...new Set(data.projects.map((p) => p.category))];
  const categoryBreakdown = categories.map((category) => {
    const categoryProjectIds = data.projects
      .filter((p) => p.category === category)
      .map((p) => p.id);
    const categoryFollowUps = data.followUps.filter((f) =>
      categoryProjectIds.includes(f.projectId),
    );
    const total = categoryFollowUps.length;
    const completed = categoryFollowUps.filter((f) => f.actualVisitAt).length;

    return {
      category,
      followUpRate: total > 0 ? completed / total : 0,
      patientCount: total,
    };
  });

  const result = { monthly, intervalDistribution, categoryBreakdown };
  cache.set(cacheKey, result, CACHE_TTL.followup);
  res.json(result);
});

router.get('/filter-options', (_req: Request, res: Response): void => {
  const cacheKey = 'filter_options:all';
  const cached = cache.get(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  const data = getDataSet();
  const result = {
    projects: data.projects.map((p) => ({
      id: p.id,
      name: p.isSensitive ? p.category : p.name,
    })),
    consultants: data.consultants.map((c) => ({ id: c.id, name: c.name })),
    channels: data.channels.map((ch) => ({ id: ch.id, name: ch.name })),
    stages: ['lead', 'consulted', 'appointed', 'visited', 'planned', 'paid', 'followed_up'],
    months: data.months,
  };

  cache.set(cacheKey, result, CACHE_TTL.filterOptions);
  res.json(result);
});

export default router;
