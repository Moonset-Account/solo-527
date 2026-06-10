import { db, DEFAULT_USER_ID, isUsingMock } from '@/lib/db-adapter';
import type {
  Plan,
  Subscription,
  Invoice,
  Seat,
  Refund,
  ChangeLog,
  Trial,
  UsageThreshold,
  User,
  BillingRule,
  InvoiceItem,
} from '@/types';
import {
  mockRefunds,
  mockTrials,
  mockUsageThresholds,
  mockBillingRules,
} from '@/lib/mock-data';

export { isUsingMock, DEFAULT_USER_ID };

export async function getPlans(status?: string): Promise<Plan[]> {
  return db.findPlans(status);
}

export async function getPlanById(id: string): Promise<Plan | null> {
  return db.findPlanById(id);
}

export async function getSubscriptionByUser(userId: string = DEFAULT_USER_ID): Promise<(Subscription & { plan?: Plan }) | null> {
  return db.findSubscriptionByUser(userId);
}

export async function getCurrentSubscription(userId: string = DEFAULT_USER_ID) {
  const sub = await getSubscriptionByUser(userId);
  if (!sub) return null;

  const [seatData, changeLogs] = await Promise.all([
    getSeatsBySubscription(sub.id),
    getChangeLogs(sub.id),
  ]);

  return {
    ...sub,
    seats: seatData,
    changeLogs,
  };
}

export async function getInvoicesByUser(
  userId: string = DEFAULT_USER_ID,
  options?: { page?: number; pageSize?: number; status?: string }
): Promise<{ invoices: Invoice[]; total: number }> {
  return db.findInvoicesByUser(userId, options);
}

export async function getInvoiceById(id: string): Promise<{ invoice: Invoice; items: InvoiceItem[] } | null> {
  return db.findInvoiceById(id);
}

export async function getSeatsBySubscription(subscriptionId: string): Promise<{ seats: Seat[]; total: number; used: number }> {
  return db.findSeatsBySubscription(subscriptionId);
}

export async function getRefundsByUser(userId: string = DEFAULT_USER_ID): Promise<Refund[]> {
  await new Promise((r) => setTimeout(r, 80));
  return mockRefunds.filter((r) => r.userId === userId);
}

export async function getAllRefunds(options?: { status?: string; reasonCode?: string }): Promise<{ refunds: Refund[]; total: number }> {
  await new Promise((r) => setTimeout(r, 100));
  let refunds = [...mockRefunds];
  if (options?.status) refunds = refunds.filter((r) => r.status === options.status);
  if (options?.reasonCode) refunds = refunds.filter((r) => r.reasonCode === options.reasonCode);
  refunds.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return { refunds, total: refunds.length };
}

export async function getChangeLogs(subscriptionId?: string): Promise<ChangeLog[]> {
  return db.findChangeLogs(subscriptionId);
}

export async function getTrials(status?: string): Promise<Trial[]> {
  await new Promise((r) => setTimeout(r, 80));
  let trials = [...mockTrials];
  if (status) trials = trials.filter((t) => t.status === status);
  return trials.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getUsageThresholds(planId?: string): Promise<UsageThreshold[]> {
  await new Promise((r) => setTimeout(r, 50));
  let thresholds = [...mockUsageThresholds];
  if (planId) thresholds = thresholds.filter((t) => t.planId === planId);
  return thresholds;
}

export async function getAllUsers(role?: string): Promise<User[]> {
  return db.findUsers(role);
}

export async function getBillingRules(): Promise<BillingRule[]> {
  await new Promise((r) => setTimeout(r, 50));
  return [...mockBillingRules];
}

export async function getRefundStats() {
  await new Promise((r) => setTimeout(r, 150));
  return {
    totalRefunds: 32,
    totalAmount: 9568,
    refundRate: 3.2,
    approvalRate: 78.5,
    byReason: [
      { reason: '价格太贵', count: 12, amount: 3588 },
      { reason: '缺少功能', count: 8, amount: 2392 },
      { reason: '太复杂', count: 5, amount: 1495 },
      { reason: '服务问题', count: 3, amount: 897 },
      { reason: '其他', count: 4, amount: 1196 },
    ],
    monthlyTrend: [
      { month: '1月', count: 5, amount: 1495 },
      { month: '2月', count: 4, amount: 1196 },
      { month: '3月', count: 7, amount: 2093 },
      { month: '4月', count: 3, amount: 897 },
      { month: '5月', count: 6, amount: 1794 },
      { month: '6月', count: 8, amount: 2392 },
    ],
  };
}

export async function getAdminDashboardStats() {
  await new Promise((r) => setTimeout(r, 150));
  return {
    totalUsers: 1256,
    activeSubscriptions: 892,
    monthlyRevenue: 267600,
    trialUsers: 156,
    conversionRate: 62.5,
    churnRate: 2.3,
    pendingRefunds: 8,
    totalSeats: 3421,
  };
}

export async function getHomePageData(userId: string = DEFAULT_USER_ID) {
  const [subResult, invoiceData, plans] = await Promise.all([
    getCurrentSubscription(userId),
    getInvoicesByUser(userId, { page: 1, pageSize: 10 }),
    getPlans('ACTIVE'),
  ]);
  const subscription = subResult;
  const changeLogs = subscription ? await getChangeLogs(subscription.id) : [];

  const currentPlan = subscription?.plan || plans[0];
  const recentInvoices = invoiceData.invoices.slice(0, 5);
  const nextInvoice = invoiceData.invoices.find((i) => i.status === 'DRAFT' || i.status === 'OPEN');
  const totalPaid = invoiceData.invoices
    .filter((i) => i.status === 'PAID')
    .reduce((sum, i) => sum + i.amount, 0);

  const notifications = buildNotifications({
    subscription,
    invoices: invoiceData.invoices,
    changeLogs,
  });

  const usageProgress = computeUsageProgress(subscription);

  return {
    subscription,
    currentPlan,
    recentInvoices,
    nextInvoice,
    totalPaid,
    plans,
    changeLogs: changeLogs.slice(0, 5),
    notifications,
    usageProgress,
    totalInvoices: invoiceData.total,
  };
}

function buildNotifications(ctx: {
  subscription: any;
  invoices: Invoice[];
  changeLogs: ChangeLog[];
}) {
  const { subscription, invoices } = ctx;
  const notifs: Array<{ id: number; type: string; title: string; message: string; time: string }> = [];
  let id = 1;

  if (subscription && subscription.status === 'TRIALING') {
    const trialEnd = subscription.trialEnd ? new Date(subscription.trialEnd) : null;
    if (trialEnd) {
      const daysLeft = Math.ceil((trialEnd.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
      if (daysLeft <= 7) {
        notifs.push({
          id: id++,
          type: 'trial',
          title: `试用即将结束（剩 ${daysLeft} 天）`,
          message: `${subscription.plan?.name || '当前套餐'}试用将于 ${formatShortDate(trialEnd)} 结束，完成付费可继续使用所有功能`,
          time: daysLeft <= 2 ? '紧急' : '3天内',
        });
      }
    }
  }

  const draftInv = invoices.find((i) => i.status === 'DRAFT' || i.status === 'OPEN');
  if (draftInv) {
    notifs.push({
      id: id++,
      type: 'billing',
      title: '下期账单已生成',
      message: `${draftInv.billingPeriod || '新账期'}账单 ${formatCurrency(draftInv.amount)} 已生成${draftInv.dueDate ? `，请于 ${formatShortDate(new Date(draftInv.dueDate))} 前完成支付` : ''}`,
      time: '1天内',
    });
  }

  if (subscription) {
    const used = subscription.seats?.used ?? 0;
    const total = subscription.plan?.seatLimit ?? subscription.seatsIncluded ?? 0;
    const usageRate = total > 0 ? used / total : 0;
    if (usageRate >= 0.8) {
      notifs.push({
        id: id++,
        type: 'usage',
        title: '席位使用率较高',
        message: `当前已使用 ${used}/${total} 个席位（${Math.round(usageRate * 100)}%），如需扩容可升级套餐`,
        time: '2小时前',
      });
    } else {
      notifs.push({
        id: id++,
        type: 'usage',
        title: `用量进度 ${Math.round(computeUsageProgress(subscription))}%`,
        message: '本周期资源消耗良好，关注用量阈值告警以避免服务中断',
        time: '今天',
      });
    }
  }

  if (notifs.length === 0) {
    notifs.push({
      id: id++,
      type: 'info',
      title: '欢迎使用计费台',
      message: '您的订阅状态良好，可随时前往「套餐中心」升级或查看账单',
      time: '刚刚',
    });
  }

  return notifs;
}

function computeUsageProgress(subscription: any): number {
  if (!subscription) return 0;
  const start = subscription.currentPeriodStart ? new Date(subscription.currentPeriodStart).getTime() : Date.now();
  const end = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).getTime() : Date.now();
  const total = end - start;
  if (total <= 0) return 100;
  const elapsed = Date.now() - start;
  return Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
}

function formatShortDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatCurrency(n: number): string {
  return `¥${n.toFixed(2)}`;
}

export async function getBillingPageData(userId: string = DEFAULT_USER_ID) {
  const [invoiceData, subscription, plans] = await Promise.all([
    getInvoicesByUser(userId, { page: 1, pageSize: 50 }),
    getSubscriptionByUser(userId),
    getPlans(),
  ]);

  const invoices = invoiceData.invoices;
  const totalPaid = invoices
    .filter((i) => i.status === 'PAID')
    .reduce((sum, i) => sum + i.amount, 0);
  const paidCount = invoices.filter((i) => i.status === 'PAID').length;

  const currentDraft = invoices.find((i) => i.status === 'DRAFT' || i.status === 'OPEN');
  const pendingAmount = currentDraft ? currentDraft.amount : 0;

  const refundedTotal = invoices
    .filter((i) => i.status === 'REFUNDED' || i.status === 'PARTIALLY_REFUNDED')
    .reduce((sum, i) => sum + i.amount, 0);
  const refundedCount = invoices.filter(
    (i) => i.status === 'REFUNDED' || i.status === 'PARTIALLY_REFUNDED'
  ).length;

  const planMap = new Map(plans.map((p) => [p.id, p]));
  const enrichedInvoices = invoices.map((inv) => {
    const plan = subscription?.planId ? planMap.get(subscription.planId) : null;
    const periodLabel = inv.billingPeriod || buildPeriodLabel(inv.createdAt);
    return {
      ...inv,
      period: periodLabel,
      type: inv.description || (plan ? `${plan.name}${inv.amount === 0 ? '试用' : '订阅'}` : '订阅费用'),
    };
  });

  return {
    invoices: enrichedInvoices,
    totalInvoices: invoiceData.total,
    subscription,
    stats: {
      totalPaid,
      paidCount,
      pendingAmount,
      refundedTotal,
      refundedCount,
    },
  };
}

function buildPeriodLabel(createdAt: string): string {
  const d = new Date(createdAt);
  return `${d.getFullYear()}年${d.getMonth() + 1}月`;
}
