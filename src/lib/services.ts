import {
  mockPlans,
  mockSubscriptions,
  mockInvoices,
  mockInvoiceItems,
  mockSeats,
  mockRefunds,
  mockChangeLogs,
  mockTrials,
  mockUsageThresholds,
  mockUsers,
  mockBillingRules,
} from '@/lib/mock-data';
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

export async function getPlans(status?: string): Promise<Plan[]> {
  await new Promise((r) => setTimeout(r, 100));
  let plans = [...mockPlans];
  if (status) {
    plans = plans.filter((p) => p.status === status);
  }
  return plans.sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getPlanById(id: string): Promise<Plan | null> {
  await new Promise((r) => setTimeout(r, 50));
  return mockPlans.find((p) => p.id === id) || null;
}

export async function getSubscriptionByUser(userId: string): Promise<Subscription | null> {
  await new Promise((r) => setTimeout(r, 100));
  const sub = mockSubscriptions.find((s) => s.userId === userId);
  if (sub) {
    const plan = mockPlans.find((p) => p.id === sub.planId);
    return { ...sub, plan };
  }
  return null;
}

export async function getInvoicesByUser(
  userId: string,
  options?: { page?: number; pageSize?: number; status?: string }
): Promise<{ invoices: Invoice[]; total: number }> {
  await new Promise((r) => setTimeout(r, 150));
  let invoices = mockInvoices.filter((i) => i.userId === userId);
  if (options?.status) {
    invoices = invoices.filter((i) => i.status === options.status);
  }
  invoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  const total = invoices.length;
  const page = options?.page || 1;
  const pageSize = options?.pageSize || 10;
  const start = (page - 1) * pageSize;
  invoices = invoices.slice(start, start + pageSize);
  
  return { invoices, total };
}

export async function getInvoiceById(id: string): Promise<{ invoice: Invoice; items: InvoiceItem[] } | null> {
  await new Promise((r) => setTimeout(r, 100));
  const invoice = mockInvoices.find((i) => i.id === id);
  if (!invoice) return null;
  const items = mockInvoiceItems.filter((item) => item.invoiceId === id);
  return { invoice, items };
}

export async function getSeatsBySubscription(subscriptionId: string): Promise<{ seats: Seat[]; total: number; used: number }> {
  await new Promise((r) => setTimeout(r, 100));
  const seats = mockSeats.filter((s) => s.subscriptionId === subscriptionId);
  const used = seats.filter((s) => s.status === 'active').length;
  return { seats, total: seats.length, used };
}

export async function getRefundsByUser(userId: string): Promise<Refund[]> {
  await new Promise((r) => setTimeout(r, 100));
  return mockRefunds.filter((r) => r.userId === userId);
}

export async function getAllRefunds(options?: { status?: string; reasonCode?: string }): Promise<{ refunds: Refund[]; total: number }> {
  await new Promise((r) => setTimeout(r, 150));
  let refunds = [...mockRefunds];
  if (options?.status) {
    refunds = refunds.filter((r) => r.status === options.status);
  }
  if (options?.reasonCode) {
    refunds = refunds.filter((r) => r.reasonCode === options.reasonCode);
  }
  refunds.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return { refunds, total: refunds.length };
}

export async function getChangeLogs(subscriptionId?: string): Promise<ChangeLog[]> {
  await new Promise((r) => setTimeout(r, 100));
  let logs = [...mockChangeLogs];
  if (subscriptionId) {
    logs = logs.filter((l) => l.subscriptionId === subscriptionId);
  }
  return logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getTrials(status?: string): Promise<Trial[]> {
  await new Promise((r) => setTimeout(r, 100));
  let trials = [...mockTrials];
  if (status) {
    trials = trials.filter((t) => t.status === status);
  }
  return trials.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getUsageThresholds(planId?: string): Promise<UsageThreshold[]> {
  await new Promise((r) => setTimeout(r, 50));
  let thresholds = [...mockUsageThresholds];
  if (planId) {
    thresholds = thresholds.filter((t) => t.planId === planId);
  }
  return thresholds;
}

export async function getAllUsers(role?: string): Promise<User[]> {
  await new Promise((r) => setTimeout(r, 100));
  let users = [...mockUsers];
  if (role) {
    users = users.filter((u) => u.role === role);
  }
  return users;
}

export async function getBillingRules(): Promise<BillingRule[]> {
  await new Promise((r) => setTimeout(r, 50));
  return [...mockBillingRules];
}

export async function getRefundStats() {
  await new Promise((r) => setTimeout(r, 200));
  
  const byReason = [
    { reason: '价格太贵', count: 12, amount: 3588 },
    { reason: '缺少功能', count: 8, amount: 2392 },
    { reason: '太复杂', count: 5, amount: 1495 },
    { reason: '服务问题', count: 3, amount: 897 },
    { reason: '其他', count: 4, amount: 1196 },
  ];
  
  const monthlyTrend = [
    { month: '1月', count: 5, amount: 1495 },
    { month: '2月', count: 4, amount: 1196 },
    { month: '3月', count: 7, amount: 2093 },
    { month: '4月', count: 3, amount: 897 },
    { month: '5月', count: 6, amount: 1794 },
    { month: '6月', count: 8, amount: 2392 },
  ];
  
  return {
    totalRefunds: 32,
    totalAmount: 9568,
    refundRate: 3.2,
    approvalRate: 78.5,
    byReason,
    monthlyTrend,
  };
}

export async function getAdminDashboardStats() {
  await new Promise((r) => setTimeout(r, 200));
  
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
