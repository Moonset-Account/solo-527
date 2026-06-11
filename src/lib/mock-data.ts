import type {
  User,
  Brand,
  Member,
  MemberSubscription,
  TodoItem,
  ExceptionRecord,
  Order,
  RetentionAlert,
  ApiLog
} from './types';

const FIXED_UUIDS = {
  users: {
    host1: '550e8400-e29b-41d4-a716-446655440001',
    host2: '550e8400-e29b-41d4-a716-446655440002',
    op1: '550e8400-e29b-41d4-a716-446655440003'
  },
  brands: {
    b1: '660e8400-e29b-41d4-a716-446655440001',
    b2: '660e8400-e29b-41d4-a716-446655440002',
    b3: '660e8400-e29b-41d4-a716-446655440003'
  },
  members: {
    m1: '770e8400-e29b-41d4-a716-446655440001',
    m2: '770e8400-e29b-41d4-a716-446655440002',
    m3: '770e8400-e29b-41d4-a716-446655440003',
    m4: '770e8400-e29b-41d4-a716-446655440004',
    m5: '770e8400-e29b-41d4-a716-446655440005'
  },
  subscriptions: {
    s1: '880e8400-e29b-41d4-a716-446655440001',
    s2: '880e8400-e29b-41d4-a716-446655440002',
    s3: '880e8400-e29b-41d4-a716-446655440003',
    s4: '880e8400-e29b-41d4-a716-446655440004',
    s5: '880e8400-e29b-41d4-a716-446655440005'
  },
  todos: {
    t1: '990e8400-e29b-41d4-a716-446655440001',
    t2: '990e8400-e29b-41d4-a716-446655440002',
    t3: '990e8400-e29b-41d4-a716-446655440003',
    t4: '990e8400-e29b-41d4-a716-446655440004',
    t5: '990e8400-e29b-41d4-a716-446655440005'
  },
  exceptions: {
    e1: 'aa0e8400-e29b-41d4-a716-446655440001',
    e2: 'aa0e8400-e29b-41d4-a716-446655440002',
    e3: 'aa0e8400-e29b-41d4-a716-446655440003',
    e4: 'aa0e8400-e29b-41d4-a716-446655440004'
  },
  orders: {
    o1: 'bb0e8400-e29b-41d4-a716-446655440001',
    o2: 'bb0e8400-e29b-41d4-a716-446655440002',
    o3: 'bb0e8400-e29b-41d4-a716-446655440003',
    o4: 'bb0e8400-e29b-41d4-a716-446655440004'
  },
  deliveryNodes: {
    o1n1: 'cc0e8400-e29b-41d4-a716-446655440001',
    o1n2: 'cc0e8400-e29b-41d4-a716-446655440002',
    o1n3: 'cc0e8400-e29b-41d4-a716-446655440003',
    o1n4: 'cc0e8400-e29b-41d4-a716-446655440004',
    o1n5: 'cc0e8400-e29b-41d4-a716-446655440005',
    o2n1: 'cc0e8400-e29b-41d4-a716-446655440006',
    o2n2: 'cc0e8400-e29b-41d4-a716-446655440007',
    o2n3: 'cc0e8400-e29b-41d4-a716-446655440008',
    o3n1: 'cc0e8400-e29b-41d4-a716-446655440009',
    o3n2: 'cc0e8400-e29b-41d4-a716-446655440010',
    o3n3: 'cc0e8400-e29b-41d4-a716-446655440011',
    o4n1: 'cc0e8400-e29b-41d4-a716-446655440012'
  },
  retentionAlerts: {
    ra1: 'dd0e8400-e29b-41d4-a716-446655440001',
    ra2: 'dd0e8400-e29b-41d4-a716-446655440002',
    ra3: 'dd0e8400-e29b-41d4-a716-446655440003'
  },
  apiLogs: {
    al1: 'ee0e8400-e29b-41d4-a716-446655440001',
    al2: 'ee0e8400-e29b-41d4-a716-446655440002',
    al3: 'ee0e8400-e29b-41d4-a716-446655440003',
    al4: 'ee0e8400-e29b-41d4-a716-446655440004'
  }
};

const now = () => new Date().toISOString();
const daysLater = (d: number) => {
  const date = new Date();
  date.setDate(date.getDate() + d);
  return date.toISOString();
};
const daysEarlier = (d: number) => {
  const date = new Date();
  date.setDate(date.getDate() - d);
  return date.toISOString().slice(0, 10);
};

export const mockUsers: User[] = [
  {
    id: FIXED_UUIDS.users.host1,
    email: 'lisa@soundwave.fm',
    name: '李晓雨',
    role: 'host',
    avatarUrl: null,
    createdAt: daysEarlier(120)
  },
  {
    id: FIXED_UUIDS.users.host2,
    email: 'chen@midnighttalks.com',
    name: '陈思源',
    role: 'host',
    avatarUrl: null,
    createdAt: daysEarlier(90)
  },
  {
    id: FIXED_UUIDS.users.op1,
    email: 'admin@podcastops.cn',
    name: '王运营',
    role: 'operator',
    avatarUrl: null,
    createdAt: daysEarlier(200)
  }
];

export const mockBrands: Brand[] = [
  {
    id: FIXED_UUIDS.brands.b1,
    name: '声波实验室',
    hostId: FIXED_UUIDS.users.host1,
    createdAt: daysEarlier(180)
  },
  {
    id: FIXED_UUIDS.brands.b2,
    name: '午夜漫谈',
    hostId: FIXED_UUIDS.users.host2,
    createdAt: daysEarlier(150)
  },
  {
    id: FIXED_UUIDS.brands.b3,
    name: '创业者说',
    hostId: FIXED_UUIDS.users.host1,
    createdAt: daysEarlier(60)
  }
];

export const mockMembers: Member[] = [
  {
    id: FIXED_UUIDS.members.m1,
    name: '赵一鸣',
    email: 'zhaoyiming@example.com',
    phone: '13800000001',
    createdAt: daysEarlier(90)
  },
  {
    id: FIXED_UUIDS.members.m2,
    name: '钱小溪',
    email: 'qianxiaoxi@example.com',
    phone: '13800000002',
    createdAt: daysEarlier(75)
  },
  {
    id: FIXED_UUIDS.members.m3,
    name: '孙博文',
    email: 'sunbowen@example.com',
    phone: '13800000003',
    createdAt: daysEarlier(60)
  },
  {
    id: FIXED_UUIDS.members.m4,
    name: '李慕晴',
    email: 'limuqing@example.com',
    phone: '13800000004',
    createdAt: daysEarlier(45)
  },
  {
    id: FIXED_UUIDS.members.m5,
    name: '周子墨',
    email: 'zhouzimo@example.com',
    phone: '13800000005',
    createdAt: daysEarlier(30)
  }
];

export const mockSubscriptions: MemberSubscription[] = [
  {
    id: FIXED_UUIDS.subscriptions.s1,
    memberId: FIXED_UUIDS.members.m1,
    memberName: '赵一鸣',
    brandId: FIXED_UUIDS.brands.b1,
    brandName: '声波实验室',
    planType: 'yearly',
    materialAuthStatus: 'approved',
    invoiceCycle: 'yearly',
    subscriptionStatus: 'active',
    startDate: daysEarlier(90),
    endDate: daysEarlier(90).slice(0, 4) + '-12-31',
    createdAt: daysEarlier(90)
  },
  {
    id: FIXED_UUIDS.subscriptions.s2,
    memberId: FIXED_UUIDS.members.m2,
    memberName: '钱小溪',
    brandId: FIXED_UUIDS.brands.b1,
    brandName: '声波实验室',
    planType: 'monthly',
    materialAuthStatus: 'pending',
    invoiceCycle: 'monthly',
    subscriptionStatus: 'expiring',
    startDate: daysEarlier(25),
    endDate: daysLater(5).slice(0, 10),
    createdAt: daysEarlier(75)
  },
  {
    id: FIXED_UUIDS.subscriptions.s3,
    memberId: FIXED_UUIDS.members.m3,
    memberName: '孙博文',
    brandId: FIXED_UUIDS.brands.b2,
    brandName: '午夜漫谈',
    planType: 'quarterly',
    materialAuthStatus: 'approved',
    invoiceCycle: 'quarterly',
    subscriptionStatus: 'active',
    startDate: daysEarlier(60),
    endDate: daysLater(30).slice(0, 10),
    createdAt: daysEarlier(60)
  },
  {
    id: FIXED_UUIDS.subscriptions.s4,
    memberId: FIXED_UUIDS.members.m4,
    memberName: '李慕晴',
    brandId: FIXED_UUIDS.brands.b2,
    brandName: '午夜漫谈',
    planType: 'monthly',
    materialAuthStatus: 'rejected',
    invoiceCycle: 'monthly',
    subscriptionStatus: 'cancelled',
    startDate: daysEarlier(45),
    endDate: daysEarlier(3).slice(0, 10),
    createdAt: daysEarlier(45)
  },
  {
    id: FIXED_UUIDS.subscriptions.s5,
    memberId: FIXED_UUIDS.members.m5,
    memberName: '周子墨',
    brandId: FIXED_UUIDS.brands.b3,
    brandName: '创业者说',
    planType: 'yearly',
    materialAuthStatus: 'pending',
    invoiceCycle: 'quarterly',
    subscriptionStatus: 'active',
    startDate: daysEarlier(30),
    endDate: daysEarlier(30).slice(0, 4) + '-12-31',
    createdAt: daysEarlier(30)
  }
];

export const mockTodos: TodoItem[] = [
  {
    id: FIXED_UUIDS.todos.t1,
    title: '审核钱小溪的素材授权申请',
    type: 'material_auth',
    priority: 'high',
    materialAuthStatus: 'pending',
    relatedBrandId: FIXED_UUIDS.brands.b1,
    relatedBrandName: '声波实验室',
    relatedMemberId: FIXED_UUIDS.members.m2,
    relatedMemberName: '钱小溪',
    dueDate: daysLater(1),
    status: 'pending',
    assigneeId: FIXED_UUIDS.users.host1,
    createdAt: daysEarlier(2)
  },
  {
    id: FIXED_UUIDS.todos.t2,
    title: '确认周子墨季度开票周期',
    type: 'invoice_cycle',
    priority: 'medium',
    invoiceCycle: 'quarterly',
    relatedBrandId: FIXED_UUIDS.brands.b3,
    relatedBrandName: '创业者说',
    relatedMemberId: FIXED_UUIDS.members.m5,
    relatedMemberName: '周子墨',
    dueDate: daysLater(3),
    status: 'processing',
    assigneeId: FIXED_UUIDS.users.host1,
    createdAt: daysEarlier(1)
  },
  {
    id: FIXED_UUIDS.todos.t3,
    title: '跟进钱小溪会员续费',
    type: 'subscription',
    priority: 'high',
    subscriptionStatus: 'expiring',
    relatedBrandId: FIXED_UUIDS.brands.b1,
    relatedBrandName: '声波实验室',
    relatedMemberId: FIXED_UUIDS.members.m2,
    relatedMemberName: '钱小溪',
    dueDate: daysLater(2),
    status: 'pending',
    assigneeId: FIXED_UUIDS.users.host1,
    createdAt: daysEarlier(1)
  },
  {
    id: FIXED_UUIDS.todos.t4,
    title: '审核午夜漫谈新增会员素材',
    type: 'material_auth',
    priority: 'medium',
    materialAuthStatus: 'pending',
    relatedBrandId: FIXED_UUIDS.brands.b2,
    relatedBrandName: '午夜漫谈',
    dueDate: daysLater(4),
    status: 'pending',
    assigneeId: FIXED_UUIDS.users.host2,
    createdAt: now()
  },
  {
    id: FIXED_UUIDS.todos.t5,
    title: '孙博文年度订阅续订跟进',
    type: 'subscription',
    priority: 'low',
    subscriptionStatus: 'active',
    relatedBrandId: FIXED_UUIDS.brands.b2,
    relatedBrandName: '午夜漫谈',
    relatedMemberId: FIXED_UUIDS.members.m3,
    relatedMemberName: '孙博文',
    dueDate: daysLater(15),
    status: 'pending',
    assigneeId: FIXED_UUIDS.users.host2,
    createdAt: now()
  }
];

export const mockExceptions: ExceptionRecord[] = [
  {
    id: FIXED_UUIDS.exceptions.e1,
    brandId: FIXED_UUIDS.brands.b1,
    brandName: '声波实验室',
    title: '第23期节目素材未按时交付',
    description: '原计划上周五交付的访谈素材，合作方仍未确认内容授权。',
    category: '素材延迟',
    status: 'unconfirmed',
    result: null,
    remark: null,
    hostId: null,
    hostName: null,
    resolvedAt: null,
    createdAt: daysEarlier(3)
  },
  {
    id: FIXED_UUIDS.exceptions.e2,
    brandId: FIXED_UUIDS.brands.b1,
    brandName: '声波实验室',
    title: '会员专属音频文件损坏',
    description: '赵一鸣反馈本月会员节目在第15分钟处出现音频失真。',
    category: '内容质量',
    status: 'unconfirmed',
    result: null,
    remark: null,
    hostId: null,
    hostName: null,
    resolvedAt: null,
    createdAt: daysEarlier(1)
  },
  {
    id: FIXED_UUIDS.exceptions.e3,
    brandId: FIXED_UUIDS.brands.b2,
    brandName: '午夜漫谈',
    title: '发票抬头信息不一致',
    description: '孙博文提供的发票抬头与合同签约主体不符。',
    category: '财务问题',
    status: 'confirmed',
    result: null,
    remark: null,
    hostId: FIXED_UUIDS.users.host2,
    hostName: '陈思源',
    resolvedAt: null,
    createdAt: daysEarlier(5)
  },
  {
    id: FIXED_UUIDS.exceptions.e4,
    brandId: FIXED_UUIDS.brands.b3,
    brandName: '创业者说',
    title: '嘉宾授权书缺失签字',
    description: '首期节目嘉宾肖像授权书缺少手写签字页。',
    category: '合规风险',
    status: 'unconfirmed',
    result: null,
    remark: null,
    hostId: null,
    hostName: null,
    resolvedAt: null,
    createdAt: daysEarlier(2)
  }
];

export const mockOrders: Order[] = [
  {
    id: FIXED_UUIDS.orders.o1,
    orderNo: 'PO-202412001',
    memberId: FIXED_UUIDS.members.m1,
    memberName: '赵一鸣',
    brandId: FIXED_UUIDS.brands.b1,
    brandName: '声波实验室',
    amount: '1288.00',
    status: 'delivering',
    paidAt: daysEarlier(30),
    createdAt: daysEarlier(32),
    deliveryNodes: [
      {
        id: FIXED_UUIDS.deliveryNodes.o1n1,
        orderId: FIXED_UUIDS.orders.o1,
        name: '确认订阅需求',
        status: 'completed',
        assigneeId: FIXED_UUIDS.users.op1,
        assigneeName: '王运营',
        completedAt: daysEarlier(30),
        deadline: daysEarlier(28),
        sortOrder: 1
      },
      {
        id: FIXED_UUIDS.deliveryNodes.o1n2,
        orderId: FIXED_UUIDS.orders.o1,
        name: '发送素材授权协议',
        status: 'completed',
        assigneeId: FIXED_UUIDS.users.op1,
        assigneeName: '王运营',
        completedAt: daysEarlier(27),
        deadline: daysEarlier(25),
        sortOrder: 2
      },
      {
        id: FIXED_UUIDS.deliveryNodes.o1n3,
        orderId: FIXED_UUIDS.orders.o1,
        name: '开通会员权限',
        status: 'completed',
        assigneeId: FIXED_UUIDS.users.host1,
        assigneeName: '李晓雨',
        completedAt: daysEarlier(25),
        deadline: daysEarlier(23),
        sortOrder: 3
      },
      {
        id: FIXED_UUIDS.deliveryNodes.o1n4,
        orderId: FIXED_UUIDS.orders.o1,
        name: '开具发票',
        status: 'in_progress',
        assigneeId: FIXED_UUIDS.users.op1,
        assigneeName: '王运营',
        completedAt: null,
        deadline: daysLater(2),
        sortOrder: 4
      },
      {
        id: FIXED_UUIDS.deliveryNodes.o1n5,
        orderId: FIXED_UUIDS.orders.o1,
        name: '首次回访',
        status: 'pending',
        assigneeId: FIXED_UUIDS.users.host1,
        assigneeName: '李晓雨',
        completedAt: null,
        deadline: daysLater(10),
        sortOrder: 5
      }
    ]
  },
  {
    id: FIXED_UUIDS.orders.o2,
    orderNo: 'PO-202412015',
    memberId: FIXED_UUIDS.members.m2,
    memberName: '钱小溪',
    brandId: FIXED_UUIDS.brands.b1,
    brandName: '声波实验室',
    amount: '128.00',
    status: 'paid',
    paidAt: daysEarlier(5),
    createdAt: daysEarlier(6),
    deliveryNodes: [
      {
        id: FIXED_UUIDS.deliveryNodes.o2n1,
        orderId: FIXED_UUIDS.orders.o2,
        name: '确认订阅需求',
        status: 'completed',
        assigneeId: FIXED_UUIDS.users.op1,
        assigneeName: '王运营',
        completedAt: daysEarlier(5),
        deadline: daysEarlier(3),
        sortOrder: 1
      },
      {
        id: FIXED_UUIDS.deliveryNodes.o2n2,
        orderId: FIXED_UUIDS.orders.o2,
        name: '素材授权审核',
        status: 'in_progress',
        assigneeId: FIXED_UUIDS.users.host1,
        assigneeName: '李晓雨',
        completedAt: null,
        deadline: daysLater(1),
        sortOrder: 2
      },
      {
        id: FIXED_UUIDS.deliveryNodes.o2n3,
        orderId: FIXED_UUIDS.orders.o2,
        name: '开通会员权限',
        status: 'pending',
        assigneeId: FIXED_UUIDS.users.host1,
        assigneeName: '李晓雨',
        completedAt: null,
        deadline: daysLater(3),
        sortOrder: 3
      }
    ]
  },
  {
    id: FIXED_UUIDS.orders.o3,
    orderNo: 'PO-202411088',
    memberId: FIXED_UUIDS.members.m3,
    memberName: '孙博文',
    brandId: FIXED_UUIDS.brands.b2,
    brandName: '午夜漫谈',
    amount: '688.00',
    status: 'completed',
    paidAt: daysEarlier(45),
    createdAt: daysEarlier(47),
    deliveryNodes: [
      {
        id: FIXED_UUIDS.deliveryNodes.o3n1,
        orderId: FIXED_UUIDS.orders.o3,
        name: '确认订阅需求',
        status: 'completed',
        assigneeId: FIXED_UUIDS.users.op1,
        assigneeName: '王运营',
        completedAt: daysEarlier(45),
        deadline: daysEarlier(44),
        sortOrder: 1
      },
      {
        id: FIXED_UUIDS.deliveryNodes.o3n2,
        orderId: FIXED_UUIDS.orders.o3,
        name: '开通会员权限',
        status: 'completed',
        assigneeId: FIXED_UUIDS.users.host2,
        assigneeName: '陈思源',
        completedAt: daysEarlier(44),
        deadline: daysEarlier(43),
        sortOrder: 2
      },
      {
        id: FIXED_UUIDS.deliveryNodes.o3n3,
        orderId: FIXED_UUIDS.orders.o3,
        name: '开具发票',
        status: 'completed',
        assigneeId: FIXED_UUIDS.users.op1,
        assigneeName: '王运营',
        completedAt: daysEarlier(42),
        deadline: daysEarlier(40),
        sortOrder: 3
      }
    ]
  },
  {
    id: FIXED_UUIDS.orders.o4,
    orderNo: 'PO-202412023',
    memberId: FIXED_UUIDS.members.m5,
    memberName: '周子墨',
    brandId: FIXED_UUIDS.brands.b3,
    brandName: '创业者说',
    amount: '1588.00',
    status: 'pending',
    paidAt: null,
    createdAt: daysEarlier(1),
    deliveryNodes: [
      {
        id: FIXED_UUIDS.deliveryNodes.o4n1,
        orderId: FIXED_UUIDS.orders.o4,
        name: '等待支付',
        status: 'pending',
        assigneeId: FIXED_UUIDS.users.op1,
        assigneeName: '王运营',
        completedAt: null,
        deadline: daysLater(2),
        sortOrder: 1
      }
    ]
  }
];

export const mockRetentionAlerts: RetentionAlert[] = [
  {
    id: FIXED_UUIDS.retentionAlerts.ra1,
    brandId: FIXED_UUIDS.brands.b1,
    brandName: '声波实验室',
    metric: '月续费率',
    currentValue: '52.3',
    threshold: '65.0',
    ownerId: FIXED_UUIDS.users.host1,
    ownerName: '李晓雨',
    notifiedAt: daysEarlier(1),
    status: 'active',
    createdAt: daysEarlier(1)
  },
  {
    id: FIXED_UUIDS.retentionAlerts.ra2,
    brandId: FIXED_UUIDS.brands.b2,
    brandName: '午夜漫谈',
    metric: '7日留存率',
    currentValue: '38.1',
    threshold: '50.0',
    ownerId: FIXED_UUIDS.users.host2,
    ownerName: '陈思源',
    notifiedAt: null,
    status: 'active',
    createdAt: now()
  },
  {
    id: FIXED_UUIDS.retentionAlerts.ra3,
    brandId: FIXED_UUIDS.brands.b3,
    brandName: '创业者说',
    metric: '付费转化率',
    currentValue: '2.1',
    threshold: '4.0',
    ownerId: FIXED_UUIDS.users.host1,
    ownerName: '李晓雨',
    notifiedAt: daysEarlier(3),
    status: 'acknowledged',
    createdAt: daysEarlier(3)
  }
];

export const mockApiLogs: ApiLog[] = [
  {
    id: FIXED_UUIDS.apiLogs.al1,
    endpoint: '/api/payment/notify',
    method: 'POST',
    success: false,
    errorMessage: '支付回调签名验证失败：expected=abc123 actual=xyz789',
    lastRetryAt: daysEarlier(0),
    retryCount: 3,
    requestedAt: daysEarlier(0)
  },
  {
    id: FIXED_UUIDS.apiLogs.al2,
    endpoint: '/api/wechat/send-template',
    method: 'POST',
    success: false,
    errorMessage: '接口调用频率超限，每分钟最多60次',
    lastRetryAt: daysEarlier(1),
    retryCount: 5,
    requestedAt: daysEarlier(1)
  },
  {
    id: FIXED_UUIDS.apiLogs.al3,
    endpoint: '/api/member/sync-status',
    method: 'PUT',
    success: false,
    errorMessage: '第三方会员服务超时：504 Gateway Timeout',
    lastRetryAt: daysEarlier(2),
    retryCount: 2,
    requestedAt: daysEarlier(2)
  },
  {
    id: FIXED_UUIDS.apiLogs.al4,
    endpoint: '/api/invoice/generate',
    method: 'POST',
    success: true,
    errorMessage: null,
    lastRetryAt: null,
    retryCount: 0,
    requestedAt: daysEarlier(0)
  }
];
