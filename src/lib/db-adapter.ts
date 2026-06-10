import { PrismaClient } from '@prisma/client';
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
  InvoiceItem,
  Seat,
  Refund,
  ChangeLog,
  Trial,
  UsageThreshold,
  User,
  BillingRule,
} from '@/types';

let prisma: PrismaClient | null = null;
let useMock = true;

const inMemoryStore: {
  plans: Plan[];
  subscriptions: Subscription[];
  invoices: Invoice[];
  invoiceItems: InvoiceItem[];
  seats: Seat[];
  refunds: Refund[];
  changeLogs: ChangeLog[];
  trials: Trial[];
  usageThresholds: UsageThreshold[];
  users: User[];
  billingRules: BillingRule[];
  invoiceCounter: number;
} = {
  plans: JSON.parse(JSON.stringify(mockPlans)),
  subscriptions: JSON.parse(JSON.stringify(mockSubscriptions)),
  invoices: JSON.parse(JSON.stringify(mockInvoices)),
  invoiceItems: JSON.parse(JSON.stringify(mockInvoiceItems)),
  seats: JSON.parse(JSON.stringify(mockSeats)),
  refunds: JSON.parse(JSON.stringify(mockRefunds)),
  changeLogs: JSON.parse(JSON.stringify(mockChangeLogs)),
  trials: JSON.parse(JSON.stringify(mockTrials)),
  usageThresholds: JSON.parse(JSON.stringify(mockUsageThresholds)),
  users: JSON.parse(JSON.stringify(mockUsers)),
  billingRules: JSON.parse(JSON.stringify(mockBillingRules)),
  invoiceCounter: 100,
};

async function initPrisma() {
  if (prisma) return;
  try {
    if (!process.env.DATABASE_URL) {
      useMock = true;
      return;
    }
    prisma = new PrismaClient();
    await prisma.$connect();
    useMock = false;
  } catch (e) {
    console.warn('[db-adapter] DB unavailable, falling back to mock store:', (e as Error).message);
    useMock = true;
    prisma = null;
  }
}

initPrisma();

export function isUsingMock() {
  return useMock;
}

const generateId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

const isoNow = () => new Date().toISOString();

export const DEFAULT_USER_ID = 'user_002';

function getNextInvoiceNumber() {
  inMemoryStore.invoiceCounter += 1;
  const year = new Date().getFullYear();
  return `INV-${year}-${String(inMemoryStore.invoiceCounter).padStart(6, '0')}`;
}

function decimalToNumber(v: any): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return v;
  if (typeof v.toNumber === 'function') return v.toNumber();
  if (typeof v.toString === 'function') return parseFloat(v.toString());
  return Number(v);
}

export const db = {
  // ========== Plans ==========
  async findPlans(status?: string): Promise<Plan[]> {
    if (useMock) {
      let plans = [...inMemoryStore.plans];
      if (status) plans = plans.filter((p) => p.status === status);
      return plans.sort((a, b) => a.sortOrder - b.sortOrder);
    }
    const rows = await prisma!.plan.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map((r) => ({ ...r, price: decimalToNumber(r.price) })) as unknown as Plan[];
  },

  async findPlanById(id: string): Promise<Plan | null> {
    if (useMock) {
      return inMemoryStore.plans.find((p) => p.id === id) || null;
    }
    const row = await prisma!.plan.findUnique({ where: { id } });
    if (!row) return null;
    return { ...row, price: decimalToNumber(row.price) } as unknown as Plan;
  },

  // ========== Subscriptions ==========
  async findSubscriptionByUser(userId: string): Promise<(Subscription & { plan?: Plan }) | null> {
    if (useMock) {
      const sub = inMemoryStore.subscriptions.find((s) => s.userId === userId);
      if (!sub) return null;
      const plan = inMemoryStore.plans.find((p) => p.id === sub.planId);
      return { ...sub, plan };
    }
    const row = await prisma!.subscription.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { plan: true },
    });
    if (!row) return null;
    return {
      ...row,
      plan: row.plan ? { ...row.plan, price: decimalToNumber(row.plan.price) } : undefined,
    } as unknown as Subscription & { plan?: Plan };
  },

  async findSubscriptionById(id: string): Promise<Subscription | null> {
    if (useMock) {
      return inMemoryStore.subscriptions.find((s) => s.id === id) || null;
    }
    const row = await prisma!.subscription.findUnique({ where: { id } });
    return row as unknown as Subscription | null;
  },

  async createSubscription(data: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<Subscription> {
    const now = isoNow();
    if (useMock) {
      const sub: Subscription = {
        id: generateId('sub'),
        ...data,
        createdAt: now,
        updatedAt: now,
      };
      inMemoryStore.subscriptions.push(sub);
      return sub;
    }
    const row = await prisma!.subscription.create({ data: data as any });
    return row as unknown as Subscription;
  },

  async updateSubscription(id: string, data: Partial<Subscription>): Promise<Subscription> {
    const now = isoNow();
    if (useMock) {
      const idx = inMemoryStore.subscriptions.findIndex((s) => s.id === id);
      if (idx === -1) throw new Error('Subscription not found');
      inMemoryStore.subscriptions[idx] = {
        ...inMemoryStore.subscriptions[idx],
        ...data,
        updatedAt: now,
      };
      return inMemoryStore.subscriptions[idx];
    }
    const row = await prisma!.subscription.update({ where: { id }, data: data as any });
    return row as unknown as Subscription;
  },

  // ========== Invoices ==========
  async findInvoicesByUser(
    userId: string,
    options?: { page?: number; pageSize?: number; status?: string }
  ): Promise<{ invoices: Invoice[]; total: number }> {
    if (useMock) {
      let invoices = inMemoryStore.invoices.filter((i) => i.userId === userId);
      if (options?.status) invoices = invoices.filter((i) => i.status === options.status);
      invoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const total = invoices.length;
      const page = options?.page || 1;
      const pageSize = options?.pageSize || 10;
      const start = (page - 1) * pageSize;
      return { invoices: invoices.slice(start, start + pageSize), total };
    }
    const where: any = { userId };
    if (options?.status) where.status = options.status;
    const [rows, total] = await Promise.all([
      prisma!.invoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: ((options?.page || 1) - 1) * (options?.pageSize || 10),
        take: options?.pageSize || 10,
      }),
      prisma!.invoice.count({ where }),
    ]);
    return {
      invoices: rows.map((r) => ({
        ...r,
        amount: decimalToNumber(r.amount),
        paidAmount: decimalToNumber(r.paidAmount),
      })) as unknown as Invoice[],
      total,
    };
  },

  async findInvoiceById(id: string): Promise<{ invoice: Invoice; items: InvoiceItem[] } | null> {
    if (useMock) {
      const invoice = inMemoryStore.invoices.find((i) => i.id === id);
      if (!invoice) return null;
      const items = inMemoryStore.invoiceItems.filter((it) => it.invoiceId === id);
      return { invoice, items };
    }
    const row = await prisma!.invoice.findUnique({ where: { id }, include: { items: true } });
    if (!row) return null;
    return {
      invoice: {
        ...row,
        amount: decimalToNumber(row.amount),
        paidAmount: decimalToNumber(row.paidAmount),
      } as unknown as Invoice,
      items: (row.items || []).map((it) => ({
        ...it,
        amount: decimalToNumber(it.amount),
        unitPrice: it.unitPrice ? decimalToNumber(it.unitPrice) : null,
      })) as unknown as InvoiceItem[],
    };
  },

  async createInvoice(data: {
    userId: string;
    subscriptionId?: string;
    amount: number;
    paidAmount?: number;
    status?: string;
    dueDate?: string | null;
    billingPeriod?: string;
    description?: string;
    items?: Array<{
      description: string;
      amount: number;
      quantity?: number;
      type?: string;
      unitPrice?: number;
    }>;
  }): Promise<{ invoice: Invoice; items: InvoiceItem[] }> {
    const now = isoNow();
    const invoiceNumber = getNextInvoiceNumber();

    if (useMock) {
      const invId = generateId('inv');
      const invoice: Invoice = {
        id: invId,
        userId: data.userId,
        subscriptionId: data.subscriptionId || null,
        amount: data.amount,
        paidAmount: data.paidAmount ?? 0,
        status: (data.status as any) || 'DRAFT',
        dueDate: data.dueDate || null,
        paidAt: null,
        billingPeriod: data.billingPeriod || null,
        invoiceNumber,
        currency: 'CNY',
        description: data.description || null,
        createdAt: now,
        updatedAt: now,
      };
      inMemoryStore.invoices.push(invoice);
      const items: InvoiceItem[] = (data.items || []).map((it) => {
        const item: InvoiceItem = {
          id: generateId('item'),
          invoiceId: invId,
          description: it.description,
          amount: it.amount,
          quantity: it.quantity || 1,
          type: (it.type as any) || 'SUBSCRIPTION',
          unitPrice: it.unitPrice ?? null,
          createdAt: now,
        };
        inMemoryStore.invoiceItems.push(item);
        return item;
      });
      return { invoice, items };
    }
    const row = await prisma!.invoice.create({
      data: {
        userId: data.userId,
        subscriptionId: data.subscriptionId,
        amount: data.amount,
        paidAmount: data.paidAmount ?? 0,
        status: (data.status as any) || 'DRAFT',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        billingPeriod: data.billingPeriod,
        invoiceNumber,
        currency: 'CNY',
        description: data.description,
        items: data.items
          ? {
              create: data.items.map((it) => ({
                description: it.description,
                amount: it.amount,
                quantity: it.quantity || 1,
                type: (it.type as any) || 'SUBSCRIPTION',
                unitPrice: it.unitPrice ?? undefined,
              })),
            }
          : undefined,
      } as any,
      include: { items: true },
    });
    return {
      invoice: {
        ...row,
        amount: decimalToNumber(row.amount),
        paidAmount: decimalToNumber(row.paidAmount),
      } as unknown as Invoice,
      items: (row.items || []).map((it) => ({
        ...it,
        amount: decimalToNumber(it.amount),
        unitPrice: it.unitPrice ? decimalToNumber(it.unitPrice) : null,
      })) as unknown as InvoiceItem[],
    };
  },

  // ========== ChangeLog ==========
  async findChangeLogs(subscriptionId?: string): Promise<ChangeLog[]> {
    if (useMock) {
      let logs = [...inMemoryStore.changeLogs];
      if (subscriptionId) logs = logs.filter((l) => l.subscriptionId === subscriptionId);
      return logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    const rows = await prisma!.changeLog.findMany({
      where: subscriptionId ? { subscriptionId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    return rows as unknown as ChangeLog[];
  },

  async createChangeLog(data: Omit<ChangeLog, 'id' | 'createdAt'>): Promise<ChangeLog> {
    const now = isoNow();
    if (useMock) {
      const log: ChangeLog = { id: generateId('log'), ...data, createdAt: now };
      inMemoryStore.changeLogs.unshift(log);
      return log;
    }
    const row = await prisma!.changeLog.create({ data: data as any });
    return row as unknown as ChangeLog;
  },

  // ========== Seats ==========
  async findSeatsBySubscription(subscriptionId: string) {
    if (useMock) {
      const seats = inMemoryStore.seats.filter((s) => s.subscriptionId === subscriptionId);
      const used = seats.filter((s) => s.status === 'active').length;
      return { seats, total: seats.length, used };
    }
    const rows = await prisma!.seat.findMany({ where: { subscriptionId } });
    const seats = rows as unknown as Seat[];
    const used = seats.filter((s) => s.status === 'active').length;
    return { seats, total: seats.length, used };
  },

  // ========== Users ==========
  async findUsers(role?: string): Promise<User[]> {
    if (useMock) {
      let users = [...inMemoryStore.users];
      if (role) users = users.filter((u) => u.role === role);
      return users;
    }
    const rows = await prisma!.user.findMany({ where: role ? ({ role: role as any } as any) : undefined });
    return rows as unknown as User[];
  },
};

export type DbAdapter = typeof db;
