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

const now = new Date();
const iso = (d: Date) => d.toISOString();

const daysAgo = (days: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  return iso(d);
};

const daysLater = (days: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  return iso(d);
};

export const mockPlans: Plan[] = [
  {
    id: 'plan_free',
    name: '免费版',
    description: '适合个人开发者试用，包含基础功能',
    price: 0,
    interval: 'MONTHLY',
    seatLimit: 1,
    trialDays: 0,
    status: 'ACTIVE',
    features: ['1 个席位', '基础 API 调用', '社区支持', '5GB 存储空间'],
    sortOrder: 1,
    isPopular: false,
    createdAt: daysAgo(365),
    updatedAt: daysAgo(30),
  },
  {
    id: 'plan_starter',
    name: '入门版',
    description: '适合小团队快速启动，性价比之选',
    price: 99,
    interval: 'MONTHLY',
    seatLimit: 5,
    trialDays: 14,
    status: 'ACTIVE',
    features: ['5 个席位', '高级 API 调用', '邮件支持', '50GB 存储空间', '基础数据分析'],
    sortOrder: 2,
    isPopular: false,
    createdAt: daysAgo(365),
    updatedAt: daysAgo(15),
  },
  {
    id: 'plan_pro',
    name: '专业版',
    description: '适合成长型团队，功能全面覆盖',
    price: 299,
    interval: 'MONTHLY',
    seatLimit: 20,
    trialDays: 14,
    status: 'ACTIVE',
    features: ['20 个席位', '无限 API 调用', '优先技术支持', '500GB 存储空间', '高级数据分析', '自定义报表', '团队协作功能'],
    sortOrder: 3,
    isPopular: true,
    createdAt: daysAgo(365),
    updatedAt: daysAgo(7),
  },
  {
    id: 'plan_enterprise',
    name: '企业版',
    description: '适合大型企业，定制化服务',
    price: 999,
    interval: 'MONTHLY',
    seatLimit: 100,
    trialDays: 30,
    status: 'ACTIVE',
    features: ['100 个席位', '无限 API 调用', '专属客户经理', '无限存储空间', '企业级安全', 'SLA 保障', '私有化部署', '定制开发'],
    sortOrder: 4,
    isPopular: false,
    createdAt: daysAgo(300),
    updatedAt: daysAgo(3),
  },
];

export const mockUsers: User[] = [
  {
    id: 'user_001',
    email: 'admin@example.com',
    name: '系统管理员',
    role: 'ADMIN',
    avatarUrl: null,
    createdAt: daysAgo(365),
    updatedAt: daysAgo(1),
  },
  {
    id: 'user_002',
    email: 'zhang@example.com',
    name: '张三',
    role: 'USER',
    avatarUrl: null,
    createdAt: daysAgo(90),
    updatedAt: daysAgo(1),
  },
  {
    id: 'user_003',
    email: 'li@example.com',
    name: '李四',
    role: 'USER',
    avatarUrl: null,
    createdAt: daysAgo(60),
    updatedAt: daysAgo(5),
  },
];

export const mockSubscriptions: Subscription[] = [
  {
    id: 'sub_001',
    userId: 'user_002',
    planId: 'plan_pro',
    status: 'ACTIVE',
    currentPeriodStart: daysAgo(15),
    currentPeriodEnd: daysLater(15),
    trialStart: null,
    trialEnd: null,
    trialUsed: true,
    seatsIncluded: 20,
    cancelAtPeriodEnd: false,
    canceledAt: null,
    createdAt: daysAgo(75),
    updatedAt: daysAgo(15),
  },
  {
    id: 'sub_002',
    userId: 'user_003',
    planId: 'plan_starter',
    status: 'TRIALING',
    currentPeriodStart: daysAgo(7),
    currentPeriodEnd: daysLater(7),
    trialStart: daysAgo(7),
    trialEnd: daysLater(7),
    trialUsed: false,
    seatsIncluded: 5,
    cancelAtPeriodEnd: false,
    canceledAt: null,
    createdAt: daysAgo(7),
    updatedAt: daysAgo(7),
  },
];

export const mockInvoices: Invoice[] = [
  {
    id: 'inv_001',
    userId: 'user_002',
    subscriptionId: 'sub_001',
    amount: 299,
    paidAmount: 299,
    status: 'PAID',
    dueDate: daysAgo(15),
    paidAt: daysAgo(15),
    billingPeriod: '2024年6月',
    invoiceNumber: 'INV-2024-000001',
    currency: 'CNY',
    description: '专业版月度订阅',
    createdAt: daysAgo(45),
    updatedAt: daysAgo(15),
  },
  {
    id: 'inv_002',
    userId: 'user_002',
    subscriptionId: 'sub_001',
    amount: 299,
    paidAmount: 299,
    status: 'PAID',
    dueDate: daysAgo(15),
    paidAt: daysAgo(14),
    billingPeriod: '2024年7月',
    invoiceNumber: 'INV-2024-000002',
    currency: 'CNY',
    description: '专业版月度订阅',
    createdAt: daysAgo(15),
    updatedAt: daysAgo(14),
  },
  {
    id: 'inv_003',
    userId: 'user_002',
    subscriptionId: 'sub_001',
    amount: 299,
    paidAmount: 0,
    status: 'DRAFT',
    dueDate: daysLater(15),
    paidAt: null,
    billingPeriod: '2024年8月',
    invoiceNumber: 'INV-2024-000003',
    currency: 'CNY',
    description: '专业版月度订阅',
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
  {
    id: 'inv_004',
    userId: 'user_003',
    subscriptionId: 'sub_002',
    amount: 0,
    paidAmount: 0,
    status: 'PAID',
    dueDate: daysAgo(7),
    paidAt: daysAgo(7),
    billingPeriod: '试用期',
    invoiceNumber: 'INV-2024-000004',
    currency: 'CNY',
    description: '入门版 14 天试用',
    createdAt: daysAgo(7),
    updatedAt: daysAgo(7),
  },
];

export const mockInvoiceItems: InvoiceItem[] = [
  { id: 'item_001', invoiceId: 'inv_001', description: '专业版订阅 - 月度', amount: 299, quantity: 1, type: 'SUBSCRIPTION', unitPrice: 299, createdAt: daysAgo(45) },
  { id: 'item_002', invoiceId: 'inv_002', description: '专业版订阅 - 月度', amount: 299, quantity: 1, type: 'SUBSCRIPTION', unitPrice: 299, createdAt: daysAgo(15) },
  { id: 'item_003', invoiceId: 'inv_003', description: '专业版订阅 - 月度', amount: 299, quantity: 1, type: 'SUBSCRIPTION', unitPrice: 299, createdAt: daysAgo(1) },
  { id: 'item_004', invoiceId: 'inv_004', description: '入门版试用 - 14天', amount: 0, quantity: 1, type: 'SUBSCRIPTION', unitPrice: 0, createdAt: daysAgo(7) },
];

export const mockSeats: Seat[] = [
  { id: 'seat_001', userId: 'user_002', subscriptionId: 'sub_001', email: 'zhang@example.com', name: '张三', role: 'owner', status: 'active', invitedAt: daysAgo(75), activatedAt: daysAgo(75), lastActiveAt: daysAgo(1) },
  { id: 'seat_002', userId: 'user_002', subscriptionId: 'sub_001', email: 'wang@example.com', name: '王五', role: 'admin', status: 'active', invitedAt: daysAgo(60), activatedAt: daysAgo(59), lastActiveAt: daysAgo(2) },
  { id: 'seat_003', userId: 'user_002', subscriptionId: 'sub_001', email: 'zhao@example.com', name: '赵六', role: 'member', status: 'active', invitedAt: daysAgo(30), activatedAt: daysAgo(29), lastActiveAt: daysAgo(5) },
  { id: 'seat_004', userId: 'user_002', subscriptionId: 'sub_001', email: 'chen@example.com', name: null, role: 'member', status: 'invited', invitedAt: daysAgo(3), activatedAt: null, lastActiveAt: null },
  { id: 'seat_005', userId: 'user_003', subscriptionId: 'sub_002', email: 'li@example.com', name: '李四', role: 'owner', status: 'active', invitedAt: daysAgo(7), activatedAt: daysAgo(7), lastActiveAt: daysAgo(5) },
];

export const mockRefunds: Refund[] = [
  { id: 'ref_001', invoiceId: 'inv_001', userId: 'user_002', amount: 100, reasonCode: 'MISSING_FEATURES', reason: '缺少团队协作功能', note: '用户反馈需要更多团队功能', status: 'PROCESSED', reviewNote: '情况属实，予以部分退款', reviewedAt: daysAgo(40), reviewedById: 'user_001', processedAt: daysAgo(39), createdAt: daysAgo(42), updatedAt: daysAgo(39) },
  { id: 'ref_002', invoiceId: 'inv_002', userId: 'user_002', amount: 299, reasonCode: 'PRICE_TOO_HIGH', reason: '价格太贵，预算不足', note: '', status: 'PENDING', reviewNote: null, reviewedAt: null, reviewedById: null, processedAt: null, createdAt: daysAgo(3), updatedAt: daysAgo(3) },
  { id: 'ref_003', invoiceId: 'inv_004', userId: 'user_003', amount: 0, reasonCode: 'TOO_COMPLEX', reason: '产品太复杂，不会用', note: '', status: 'REJECTED', reviewNote: '试用期退款不受理', reviewedAt: daysAgo(5), reviewedById: 'user_001', processedAt: null, createdAt: daysAgo(6), updatedAt: daysAgo(5) },
];

export const mockChangeLogs: ChangeLog[] = [
  { id: 'log_001', subscriptionId: 'sub_001', type: 'UPGRADE', oldPlanId: 'plan_starter', newPlanId: 'plan_pro', oldValue: '入门版', newValue: '专业版', note: '用户主动升级', result: 'success', changedBy: 'user_002', createdAt: daysAgo(45) },
  { id: 'log_002', subscriptionId: 'sub_001', type: 'SEAT_CHANGE', oldPlanId: null, newPlanId: null, oldValue: '5', newValue: '20', note: '套餐升级自动增加席位', result: 'success', changedBy: 'system', createdAt: daysAgo(45) },
  { id: 'log_003', subscriptionId: 'sub_001', type: 'REACTIVATE', oldPlanId: null, newPlanId: null, oldValue: 'paused', newValue: 'active', note: '续费成功，恢复服务', result: 'success', changedBy: 'system', createdAt: daysAgo(15) },
  { id: 'log_004', subscriptionId: 'sub_002', type: 'TRIAL_CONVERT', oldPlanId: null, newPlanId: 'plan_starter', oldValue: 'trial', newValue: 'pending', note: '试用即将结束，等待用户付费转化', result: 'pending', changedBy: 'system', createdAt: daysAgo(1) },
];

export const mockTrials: Trial[] = [
  { id: 'trial_001', userId: 'user_002', planId: 'plan_starter', startDate: daysAgo(100), endDate: daysAgo(86), status: 'CONVERTED', converted: true, convertedAt: daysAgo(88), reminderSent: true, createdAt: daysAgo(100), updatedAt: daysAgo(88) },
  { id: 'trial_002', userId: 'user_003', planId: 'plan_starter', startDate: daysAgo(7), endDate: daysLater(7), status: 'ACTIVE', converted: false, convertedAt: null, reminderSent: false, createdAt: daysAgo(7), updatedAt: daysAgo(7) },
];

export const mockUsageThresholds: UsageThreshold[] = [
  { id: 'thresh_001', planId: 'plan_starter', metric: 'api_calls', threshold: 10000, warningPercent: 80, notificationType: 'IN_APP', isEnabled: true, createdAt: daysAgo(300), updatedAt: daysAgo(30) },
  { id: 'thresh_002', planId: 'plan_starter', metric: 'storage_gb', threshold: 50, warningPercent: 80, notificationType: 'EMAIL', isEnabled: true, createdAt: daysAgo(300), updatedAt: daysAgo(30) },
  { id: 'thresh_003', planId: 'plan_pro', metric: 'api_calls', threshold: 100000, warningPercent: 80, notificationType: 'BOTH', isEnabled: true, createdAt: daysAgo(300), updatedAt: daysAgo(15) },
  { id: 'thresh_004', planId: 'plan_pro', metric: 'storage_gb', threshold: 500, warningPercent: 80, notificationType: 'IN_APP', isEnabled: true, createdAt: daysAgo(300), updatedAt: daysAgo(15) },
];

export const mockBillingRules: BillingRule[] = [
  { id: 'rule_001', key: 'trial_days_default', value: '14', type: 'system', isEnabled: true, note: '默认试用天数', updatedAt: daysAgo(60), createdAt: daysAgo(365) },
  { id: 'rule_002', key: 'grace_period_days', value: '3', type: 'system', isEnabled: true, note: '宽限期（天）', updatedAt: daysAgo(30), createdAt: daysAgo(300) },
  { id: 'rule_003', key: 'auto_renew_enabled', value: 'true', type: 'feature', isEnabled: true, note: '自动续费开关', updatedAt: daysAgo(15), createdAt: daysAgo(200) },
  { id: 'rule_004', key: 'invoice_due_days', value: '15', type: 'billing', isEnabled: true, note: '账单到期天数', updatedAt: daysAgo(10), createdAt: daysAgo(150) },
  { id: 'rule_005', key: 'refund_max_days', value: '30', type: 'billing', isEnabled: true, note: '退款申请最大天数', updatedAt: daysAgo(5), createdAt: daysAgo(100) },
];
