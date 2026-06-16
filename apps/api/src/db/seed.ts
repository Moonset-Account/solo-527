import { db } from './index';
import {
  users,
  trainingCamps,
  chapters,
  chapterMaterials,
  campMaterials,
  members,
  memberProgress,
  checkinRecords,
  refundRules,
  refundRequests,
  memberBenefits,
  todos,
} from './schema';
import { sql } from 'drizzle-orm';

const seed = async () => {
  console.log('🌱 开始初始化数据...');

  console.log('1. 创建用户...');
  const [admin, operator1, operator2, user1, user2, user3, user4, user5] = await db
    .insert(users)
    .values([
      { name: '系统管理员', email: 'admin@example.com', role: 'admin', phone: '13800000000' },
      { name: '李运营', email: 'liyingyun@example.com', role: 'operator', phone: '13800000001' },
      { name: '王助教', email: 'wangzhujiao@example.com', role: 'operator', phone: '13800000002' },
      { name: '张小明爸爸', email: 'zhangxm@example.com', role: 'member', phone: '13900000001' },
      { name: '李小美妈妈', email: 'lixm@example.com', role: 'member', phone: '13900000002' },
      { name: '王浩然爸爸', email: 'wanghr@example.com', role: 'member', phone: '13900000003' },
      { name: '陈思琪妈妈', email: 'chensq@example.com', role: 'member', phone: '13900000004' },
      { name: '刘子轩爸爸', email: 'liuzx@example.com', role: 'member', phone: '13900000005' },
    ])
    .returning();

  console.log('2. 创建训练营营期...');
  const now = new Date();
  const [camp1, camp2, camp3] = await db
    .insert(trainingCamps)
    .values([
      {
        name: '2026夏季·亲子阅读启蒙营',
        description: '21天系统培养孩子阅读习惯，精选绘本+亲子互动指导',
        coverImageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=warm%20parent%20child%20reading%20book%20illustration%20summer%20style&image_size=landscape_16_9',
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 20),
        status: 'ongoing',
        maxMembers: 50,
        currentMembers: 0,
        price: '2999.00',
        operatorId: operator1.id,
      },
      {
        name: '亲子英语启蒙营·基础班',
        description: '30天家庭英语启蒙方案，儿歌+绘本+游戏，零基础也能学',
        coverImageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=happy%20children%20learning%20english%20colorful%20books%20cartoon&image_size=landscape_16_9',
        startDate: new Date(now.getFullYear(), now.getMonth() + 1, 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 2, 10),
        status: 'upcoming',
        maxMembers: 40,
        currentMembers: 0,
        price: '3999.00',
        operatorId: operator2.id,
      },
      {
        name: '专注力训练营·春季班',
        description: '已完结营，专注力训练21天，提升学习效率',
        coverImageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=child%20focus%20study%20concentration%20peaceful%20learning&image_size=landscape_16_9',
        startDate: new Date(now.getFullYear(), now.getMonth() - 3, 1),
        endDate: new Date(now.getFullYear(), now.getMonth() - 2, 20),
        status: 'completed',
        maxMembers: 30,
        currentMembers: 0,
        price: '1999.00',
        operatorId: operator1.id,
      },
    ])
    .returning();

  console.log('3. 创建章节内容...');
  const camp1Chapters = await db
    .insert(chapters)
    .values([
      { campId: camp1.id, title: '第1天：为什么孩子不爱读书？', description: '分析孩子不爱阅读的常见原因，建立正确的阅读观念', videoUrl: 'https://example.com/video1.mp4', duration: 1800, sortOrder: 1, status: 'published', isPreview: true },
      { campId: camp1.id, title: '第2天：打造家庭阅读角', description: '如何在家中创造适合阅读的环境', videoUrl: 'https://example.com/video2.mp4', duration: 1500, sortOrder: 2, status: 'published', isPreview: true },
      { campId: camp1.id, title: '第3天：选书的5个黄金法则', description: '不同年龄段孩子的选书指南', videoUrl: 'https://example.com/video3.mp4', duration: 2100, sortOrder: 3, status: 'published', isPreview: false },
      { campId: camp1.id, title: '第4天：亲子共读的正确打开方式', description: '互动式阅读技巧，让孩子爱上听故事', videoUrl: 'https://example.com/video4.mp4', duration: 2400, sortOrder: 4, status: 'published', isPreview: false },
      { campId: camp1.id, title: '第5天：提问式阅读训练', description: '通过提问培养孩子的思考能力', videoUrl: 'https://example.com/video5.mp4', duration: 1900, sortOrder: 5, status: 'published', isPreview: false },
      { campId: camp1.id, title: '第6-7天：周末实践与答疑', description: '一周学习复盘，常见问题解答', videoUrl: 'https://example.com/video6.mp4', duration: 3600, sortOrder: 6, status: 'draft', isPreview: false },
    ])
    .returning();

  const camp2Chapters = await db
    .insert(chapters)
    .values([
      { campId: camp2.id, title: '第1讲：英语启蒙的黄金期', description: '0-6岁儿童语言发展规律解析', videoUrl: 'https://example.com/e1.mp4', duration: 2000, sortOrder: 1, status: 'published', isPreview: true },
      { campId: camp2.id, title: '第2讲：TPR全身反应法', description: '用动作帮助孩子理解英语', videoUrl: 'https://example.com/e2.mp4', duration: 1800, sortOrder: 2, status: 'published', isPreview: false },
      { campId: camp2.id, title: '第3讲：磨耳朵的正确方法', description: '儿歌、动画音频资源推荐', videoUrl: 'https://example.com/e3.mp4', duration: 1600, sortOrder: 3, status: 'draft', isPreview: false },
    ])
    .returning();

  console.log('4. 添加章节资料...');
  await db.insert(chapterMaterials).values([
    { chapterId: camp1Chapters[0].id, name: '第一章配套PPT.pdf', type: 'pdf', url: 'https://example.com/ch1-ppt.pdf', fileSize: 5242880 },
    { chapterId: camp1Chapters[0].id, name: '阅读评估量表.xlsx', type: 'other', url: 'https://example.com/eval.xlsx', fileSize: 1048576 },
    { chapterId: camp1Chapters[1].id, name: '家庭阅读角布置指南.pdf', type: 'pdf', url: 'https://example.com/corner.pdf', fileSize: 3145728 },
    { chapterId: camp1Chapters[2].id, name: '各年龄段推荐书单.pdf', type: 'pdf', url: 'https://example.com/booklist.pdf', fileSize: 2097152 },
  ]);

  console.log('5. 添加营期公共资料...');
  await db.insert(campMaterials).values([
    { campId: camp1.id, name: '2026阅读营学员手册.pdf', type: 'pdf', url: 'https://example.com/handbook.pdf', fileSize: 10485760 },
    { campId: camp1.id, name: '配套绘本资源包.zip', type: 'zip', url: 'https://example.com/picturebooks.zip', fileSize: 524288000 },
    { campId: camp2.id, name: '英语启蒙资源大礼包.zip', type: 'zip', url: 'https://example.com/english-res.zip', fileSize: 1073741824 },
  ]);

  console.log('6. 创建会员记录...');
  const sources = ['wechat_group', 'wechat_moments', 'douyin', 'xiaohongshu', 'zhihu', 'referral', 'offline', 'other'];
  const sourceLabels: Record<string, string> = {
    wechat_group: '微信群', wechat_moments: '朋友圈', douyin: '抖音',
    xiaohongshu: '小红书', zhihu: '知乎', referral: '转介绍',
    offline: '线下活动', other: '其他'
  };

  const allMembers = [];
  const userList = [user1, user2, user3, user4, user5];
  const campList = [camp1, camp1, camp1, camp2, camp3];

  for (let i = 0; i < 5; i++) {
    const u = userList[i % userList.length];
    const c = campList[i % campList.length];
    const source = sources[Math.floor(Math.random() * sources.length)];
    const member = await db
      .insert(members)
      .values({
        userId: u.id,
        campId: c.id,
        memberNo: `M-${c.id.split('-')[0].toUpperCase()}-${1000 + i}`,
        status: c.status === 'completed' ? 'expired' : 'active',
        joinDate: new Date(c.startDate.getTime() + Math.random() * 3 * 24 * 60 * 60 * 1000),
        conversionSource: source as any,
        conversionSourceDetail: `${sourceLabels[source]}推广，${['第3期活动', '老会员推荐', '暑期特惠', '讲座报名'][i % 4]}`,
        progress: String((Math.random() * 100).toFixed(2)),
        totalChapters: camp1Chapters.length,
        completedChapters: Math.floor(Math.random() * (camp1Chapters.length + 1)),
        isFallingBehind: Math.random() > 0.7,
        salesPerson: ['李运营', '王助教', '张主管'][i % 3],
      })
      .returning();
    allMembers.push(member[0]);
  }

  await db
    .update(trainingCamps)
    .set({ currentMembers: sql`${trainingCamps.currentMembers} + 1` })
    .where(sql`true`);

  console.log('7. 创建学习进度记录...');
  for (const m of allMembers.slice(0, 3)) {
    for (let i = 0; i < 4; i++) {
      await db.insert(memberProgress).values({
        memberId: m.id,
        chapterId: camp1Chapters[i].id,
        isCompleted: Math.random() > 0.3,
        watchDuration: Math.floor(Math.random() * camp1Chapters[i].duration),
        completedAt: Math.random() > 0.3 ? new Date() : null,
        lastWatchedAt: new Date(),
      });
    }
  }

  console.log('8. 创建打卡记录...');
  const checkinContents = [
    '今天和孩子一起读了《猜猜我有多爱你》，孩子很喜欢，讲了两遍还想听',
    '完成了第2天的视频学习，阅读角已布置完成！',
    '按照书单买了5本书，孩子最喜欢《好饿的毛毛虫》',
    '第一次尝试提问式阅读，孩子回答问题很积极',
    '周末带孩子去了图书馆，借了8本绘本回家',
  ];

  for (let i = 0; i < 10; i++) {
    const m = allMembers[i % allMembers.length];
    const chapter = camp1Chapters[i % camp1Chapters.length];
    const status = ['pending', 'approved', 'approved', 'approved', 'rejected'][i % 5];
    await db.insert(checkinRecords).values({
      memberId: m.id,
      chapterId: chapter.id,
      campId: camp1.id,
      content: checkinContents[i % checkinContents.length],
      status: status as any,
      checkedInAt: new Date(now.getTime() - (Math.random() * 7 * 24 * 60 * 60 * 1000)),
      reviewedBy: status !== 'pending' ? (i % 2 === 0 ? operator1.id : operator2.id) : null,
      reviewedAt: status !== 'pending' ? new Date() : null,
      reviewComment: status === 'rejected' ? '打卡内容过于简单，请补充详细的阅读心得' : '很棒，继续保持！',
    });
  }

  console.log('9. 创建退款规则...');
  const [rule1, rule2, rule3] = await db
    .insert(refundRules)
    .values([
      { campId: camp1.id, name: '7天无理由退款', description: '入营7天内，未完成超过2课时，可全额退款', daysFromJoin: 7, refundRate: '100.00' },
      { campId: camp1.id, name: '15天部分退款', description: '入营15天内，可退还50%费用', daysFromJoin: 15, refundRate: '50.00' },
      { campId: camp2.id, name: '10天无理由退款', description: '入营10天内全额退款', daysFromJoin: 10, refundRate: '100.00' },
    ])
    .returning();

  console.log('10. 创建退款申请...');
  await db.insert(refundRequests).values([
    {
      memberId: allMembers[3].id,
      ruleId: rule1.id,
      reason: '孩子时间冲突，无法继续学习',
      amount: '2999.00',
      status: 'pending',
      requestedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      memberId: allMembers[4].id,
      ruleId: rule2.id,
      reason: '课程内容不适合孩子年龄段',
      amount: '1499.50',
      status: 'approved',
      requestedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      processedBy: operator1.id,
      processedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      processComment: '符合退款条件，已通过',
    },
  ]);

  console.log('11. 创建会员权益...');
  await db.insert(memberBenefits).values([
    { memberId: allMembers[0].id, type: 'discount', name: '下期营9折优惠券', description: '可用于任意续报营期', value: '300.00', isUsed: false, expiresAt: new Date(now.getFullYear() + 1, 0, 1) },
    { memberId: allMembers[0].id, type: 'gift', name: '亲子阅读大礼包', description: '包含精选绘本5册', value: '299.00', isUsed: true, usedAt: new Date() },
    { memberId: allMembers[1].id, type: 'service', name: '1对1专业咨询1次', description: '资深阅读指导师30分钟咨询', value: '500.00', isUsed: false, expiresAt: new Date(now.getFullYear(), now.getMonth() + 3, 1) },
    { memberId: allMembers[2].id, type: 'discount', name: '好友推荐奖励券', value: '200.00', isUsed: false },
  ]);

  console.log('12. 创建待办事项...');
  await db.insert(todos).values([
    {
      title: `${user1.name} 在【${camp1.name}】中掉队预警`,
      description: '当前进度落后超过20%，请及时跟进提醒',
      type: 'fall_behind_warning',
      priority: 'high',
      status: 'pending',
      assigneeId: operator1.id,
      memberId: allMembers[0].id,
      campId: camp1.id,
      dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      createdBy: admin.id,
    },
    {
      title: '打卡审核：3条待处理',
      description: '请及时审核新提交的打卡记录',
      type: 'checkin_review',
      priority: 'medium',
      status: 'in_progress',
      assigneeId: operator2.id,
      campId: camp1.id,
      dueDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      createdBy: operator1.id,
    },
    {
      title: '退款申请处理：陈思琪妈妈',
      description: '申请7天无理由退款，金额2999元',
      type: 'refund_review',
      priority: 'urgent',
      status: 'pending',
      assigneeId: operator1.id,
      memberId: allMembers[3].id,
      campId: camp1.id,
      dueDate: new Date(now.getTime() + 0.5 * 24 * 60 * 60 * 1000),
      createdBy: admin.id,
    },
    {
      title: '6月学员回访电话',
      description: '本月需要完成10名学员的电话回访',
      type: 'custom',
      priority: 'medium',
      status: 'pending',
      assigneeId: operator2.id,
      campId: camp1.id,
      dueDate: new Date(now.getFullYear(), now.getMonth(), 30),
      createdBy: operator1.id,
    },
    {
      title: `${user2.name} 打卡内容审核`,
      description: '打卡内容质量高，可作为优秀案例推荐',
      type: 'checkin_review',
      priority: 'low',
      status: 'completed',
      assigneeId: operator1.id,
      memberId: allMembers[1].id,
      campId: camp1.id,
      completedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      completedBy: operator1.id,
      createdBy: operator2.id,
    },
  ]);

  console.log('✅ 数据初始化完成！');
  console.log('');
  console.log('📋 初始化数据概览：');
  console.log(`  - 用户：8 个（管理员1，运营2，学员5）`);
  console.log(`  - 营期：3 个（进行中1，待开营1，已完成1）`);
  console.log(`  - 章节：9 个（已发布7，草稿2）`);
  console.log(`  - 会员：5 个`);
  console.log(`  - 打卡记录：10 条`);
  console.log(`  - 退款规则：3 条`);
  console.log(`  - 退款申请：2 条`);
  console.log(`  - 会员权益：4 条`);
  console.log(`  - 待办事项：5 条`);
  console.log('');
  console.log('🔑 测试账号：');
  console.log(`  管理员：admin@example.com`);
  console.log(`  运营：liyingyun@example.com / wangzhujiao@example.com`);
  console.log(`  学员：zhangxm@example.com 等5个`);

  process.exit(0);
};

seed().catch((e) => {
  console.error('❌ 初始化失败：', e);
  process.exit(1);
});
