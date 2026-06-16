import { db } from './index.js';
import {
  users,
  membershipPlans,
  subscriptions,
  orders,
  orderNodes,
  orderNodeLogs,
  materials,
  materialLicenses,
  podcastContents,
  revenues,
  costs,
  exceptionPool,
  exceptionLogs,
  ruleVersions,
  featureToggles,
} from './schema.js';

const seed = async () => {
  console.log('Seeding database...');

  await db.delete(exceptionLogs);
  await db.delete(exceptionPool);
  await db.delete(orderNodeLogs);
  await db.delete(materialLicenses);
  await db.delete(revenues);
  await db.delete(costs);
  await db.delete(orders);
  await db.delete(subscriptions);
  await db.delete(materials);
  await db.delete(podcastContents);
  await db.delete(orderNodes);
  await db.delete(membershipPlans);
  await db.delete(ruleVersions);
  await db.delete(featureToggles);
  await db.delete(users);

  const [adminUser, member1, member2, member3, member4, member5] = await db.insert(users).values([
    { name: '管理员', email: 'admin@podcast.com', role: 'admin' },
    { name: '张三', email: 'zhangsan@example.com', role: 'member' },
    { name: '李四', email: 'lisi@example.com', role: 'member' },
    { name: '王五', email: 'wangwu@example.com', role: 'member' },
    { name: '赵六', email: 'zhaoliu@example.com', role: 'member' },
    { name: '钱七', email: 'qianqi@example.com', role: 'member' },
  ]).returning();

  const [basicPlan, proPlan, premiumPlan] = await db.insert(membershipPlans).values([
    {
      name: '基础会员',
      description: '享受基础会员内容，每月更新2期',
      price: '29.00',
      durationDays: 30,
      features: { features: ['基础内容', '每月2期更新', '普通音质'] },
      sortOrder: 1,
    },
    {
      name: '高级会员',
      description: '享受全部会员内容，每周更新',
      price: '99.00',
      durationDays: 30,
      features: { features: ['全部内容', '每周更新', '高清音质', '专属社群'] },
      sortOrder: 2,
    },
    {
      name: '年度会员',
      description: '一次性付费，享受一整年高级会员权益',
      price: '999.00',
      durationDays: 365,
      features: { features: ['全部内容', '每周更新', '高清音质', '专属社群', '优先答疑'] },
      sortOrder: 3,
    },
  ]).returning();

  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysLater = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const yearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
  const twentyDaysAgo = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);
  const fortyDaysAgo = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000);

  const subs = await db.insert(subscriptions).values([
    { userId: member1.id, planId: proPlan.id, startDate: tenDaysAgo, endDate: thirtyDaysLater, status: 'active', owner: '小王', renewCount: 1 },
    { userId: member2.id, planId: basicPlan.id, startDate: twentyDaysAgo, endDate: tenDaysAgo, status: 'expired', owner: '小李', renewCount: 0 },
    { userId: member3.id, planId: premiumPlan.id, startDate: now, endDate: yearLater, status: 'active', owner: '小王', renewCount: 0 },
    { userId: member4.id, planId: proPlan.id, startDate: fortyDaysAgo, endDate: tenDaysAgo, status: 'canceled', owner: '小张', renewCount: 1, canceledAt: tenDaysAgo, cancelReason: '内容更新太慢' },
    { userId: member5.id, planId: basicPlan.id, startDate: now, endDate: thirtyDaysLater, status: 'active', owner: '小李', renewCount: 0 },
  ]).returning();

  const orderNodesList = await db.insert(orderNodes).values([
    { name: '订单创建', code: 'created', description: '订单已创建，等待支付', sortOrder: 1 },
    { name: '支付完成', code: 'paid', description: '用户已完成支付', sortOrder: 2 },
    { name: '内容授权', code: 'authorized', description: '已授权会员内容', sortOrder: 3 },
    { name: '订单完成', code: 'completed', description: '订单已完成', sortOrder: 4 },
    { name: '订单取消', code: 'cancelled', description: '订单已取消', sortOrder: 5 },
  ]).returning();

  const ordersList = await db.insert(orders).values([
    { orderNo: 'ORD202401001', userId: member1.id, subscriptionId: subs[0].id, amount: '99.00', status: 'completed', paidAt: tenDaysAgo, owner: '小王' },
    { orderNo: 'ORD202401002', userId: member2.id, subscriptionId: subs[1].id, amount: '29.00', status: 'completed', paidAt: twentyDaysAgo, owner: '小李' },
    { orderNo: 'ORD202401003', userId: member3.id, subscriptionId: subs[2].id, amount: '999.00', status: 'pending', owner: '小王' },
    { orderNo: 'ORD202401004', userId: member4.id, subscriptionId: subs[3].id, amount: '99.00', status: 'completed', paidAt: fortyDaysAgo, owner: '小张' },
    { orderNo: 'ORD202401005', userId: member5.id, subscriptionId: subs[4].id, amount: '29.00', status: 'paid', paidAt: now, owner: '小李' },
  ]).returning();

  await db.insert(orderNodeLogs).values([
    { orderId: ordersList[0].id, nodeId: orderNodesList[0].id, status: 'completed', operator: 'system', executedAt: tenDaysAgo },
    { orderId: ordersList[0].id, nodeId: orderNodesList[1].id, status: 'completed', operator: 'system', executedAt: tenDaysAgo },
    { orderId: ordersList[0].id, nodeId: orderNodesList[2].id, status: 'completed', operator: '小王', executedAt: tenDaysAgo },
    { orderId: ordersList[0].id, nodeId: orderNodesList[3].id, status: 'completed', operator: 'system', executedAt: tenDaysAgo },
  ]);

  const mats = await db.insert(materials).values([
    { name: '背景音乐合集1', type: 'audio', licenseType: 'standard', fee: '99.00', owner: '小王', isActive: true },
    { name: '背景音乐合集2', type: 'audio', licenseType: 'extended', fee: '299.00', owner: '小李', isActive: true },
    { name: '播客封面模板', type: 'image', licenseType: 'standard', fee: '49.00', owner: '小王', isActive: true },
    { name: '音效素材包', type: 'audio', licenseType: 'standard', fee: '149.00', owner: '小张', isActive: false },
  ]).returning();

  await db.insert(materialLicenses).values([
    { materialId: mats[0].id, userId: member1.id, orderId: ordersList[0].id, startDate: tenDaysAgo, endDate: thirtyDaysLater, status: 'active' },
    { materialId: mats[1].id, userId: member3.id, startDate: now, endDate: yearLater, status: 'active' },
  ]);

  await db.insert(podcastContents).values([
    { title: '第001期：为什么开始做播客', description: '聊聊我们为什么开始做这个播客节目', audioUrl: '/audio/ep001.mp3', isMemberOnly: false, publishDate: fortyDaysAgo },
    { title: '第002期：独立创作者的日常', description: '分享独立创作者的工作日常', audioUrl: '/audio/ep002.mp3', isMemberOnly: false, publishDate: twentyDaysAgo },
    { title: '第003期：会员专享-变现经验分享', description: '付费会员专享内容，分享变现经验', audioUrl: '/audio/ep003.mp3', isMemberOnly: true, publishDate: tenDaysAgo },
    { title: '第004期：会员专享-工具推荐', description: '付费会员专享内容，推荐实用工具', audioUrl: '/audio/ep004.mp3', isMemberOnly: true, publishDate: now },
  ]);

  const dates = [];
  for (let i = 29; i >= 0; i--) {
    dates.push(new Date(now.getTime() - i * 24 * 60 * 60 * 1000));
  }

  const revenueTypes = ['subscription', 'material', 'donation', 'sponsor'];
  const costTypes = ['material', 'equipment', 'marketing', 'hosting'];
  const owners = ['小王', '小李', '小张'];

  for (const date of dates) {
    const dateStr = date.toISOString().split('T')[0];
    const dailyRevenueCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < dailyRevenueCount; i++) {
      const type = revenueTypes[Math.floor(Math.random() * revenueTypes.length)];
      const amount = type === 'sponsor' ? (Math.random() * 500 + 100).toFixed(2) : (Math.random() * 100 + 20).toFixed(2);
      const owner = owners[Math.floor(Math.random() * owners.length)];
      await db.insert(revenues).values({
        date: dateStr,
        type,
        amount,
        owner,
        remark: `${type} revenue`,
      });
    }
    if (Math.random() > 0.3) {
      const type = costTypes[Math.floor(Math.random() * costTypes.length)];
      const amount = (Math.random() * 80 + 10).toFixed(2);
      const owner = owners[Math.floor(Math.random() * owners.length)];
      await db.insert(costs).values({
        date: dateStr,
        type,
        amount,
        owner,
        remark: `${type} cost`,
      });
    }
  }

  const exceptions = await db.insert(exceptionPool).values([
    {
      category: 'delivery_delay',
      title: '第005期节目延期交付',
      description: '原定于本周更新的第005期节目因录制问题延期',
      delayDays: 3,
      priority: 'high',
      status: 'open',
      assignee: '小王',
    },
    {
      category: 'delivery_delay',
      title: '素材授权流程阻塞',
      description: '会员素材授权流程出现问题，需要人工处理',
      delayDays: 1,
      priority: 'medium',
      status: 'in_progress',
      assignee: '小李',
    },
    {
      category: 'quality_issue',
      title: '音频质量问题反馈',
      description: '有会员反馈第003期音频有杂音',
      delayDays: 0,
      priority: 'high',
      status: 'resolved',
      assignee: '小张',
      closer: '小张',
      closeReason: '已重新上传修复后的音频文件',
      resultSummary: '问题已修复，用户满意',
      resultNote: '第003期节目已重新录制并上传',
      closedAt: tenDaysAgo,
    },
    {
      category: 'delivery_delay',
      title: '年度会员权益发放延迟',
      description: '新购买年度会员的用户权益未及时发放',
      delayDays: 2,
      priority: 'urgent',
      status: 'open',
      assignee: '小王',
    },
  ]).returning();

  for (const exc of exceptions) {
    await db.insert(exceptionLogs).values([
      { exceptionId: exc.id, action: 'created', operator: 'system', detail: { message: '异常已创建' } },
    ]);
  }

  await db.insert(ruleVersions).values([
    {
      name: '分成比例规则',
      category: 'revenue_share',
      version: 'v1.0',
      content: { hostShare: 0.6, platformShare: 0.3, taxShare: 0.1 },
      description: '初始版本分成比例',
      isActive: false,
      createdBy: 'admin',
    },
    {
      name: '分成比例规则',
      category: 'revenue_share',
      version: 'v1.1',
      content: { hostShare: 0.65, platformShare: 0.25, taxShare: 0.1 },
      description: '提高主播分成比例',
      isActive: true,
      createdBy: 'admin',
      activatedAt: now,
    },
    {
      name: '会员等级规则',
      category: 'membership',
      version: 'v1.0',
      content: { levels: ['basic', 'pro', 'premium'], benefits: { basic: 2, pro: 8, premium: 12 } },
      description: '会员等级规则初始版本',
      isActive: true,
      createdBy: 'admin',
      activatedAt: now,
    },
  ]);

  await db.insert(featureToggles).values([
    { featureKey: 'member_subscription', name: '会员订阅', description: '启用会员订阅功能', isEnabled: true },
    { featureKey: 'material_license', name: '素材授权', description: '启用素材授权功能', isEnabled: true },
    { featureKey: 'order_nodes', name: '订单节点', description: '启用订单节点管理', isEnabled: true },
    { featureKey: 'exception_pool', name: '异常池', description: '启用异常池管理功能', isEnabled: true },
    { featureKey: 'newbie_discount', name: '新用户折扣', description: '新用户首单折扣活动', isEnabled: false },
    { featureKey: 'referral_program', name: '推荐计划', description: '会员推荐奖励计划', isEnabled: false },
  ]);

  console.log('Seed data inserted successfully!');
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
