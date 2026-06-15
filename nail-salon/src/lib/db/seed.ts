import { db } from './index';
import { customers, technicians, services, appointments, cashierRecords, treatmentCards, works, comments, reminderRules, reminders, operationHistory } from './schema';

export async function seed() {
  const techRows = await db.insert(technicians).values([
    { name: '小美', specialty: '日式美甲', level: 'senior', bio: '5年日式美甲经验，擅长细腻手绘', isActive: true },
    { name: '佳佳', specialty: '光疗延长', level: 'senior', bio: '光疗延长专家，自然持久', isActive: true },
    { name: '小花', specialty: '立体雕花', level: 'master', bio: '8年美甲经验，立体雕花技艺精湛', isActive: true },
    { name: '晓晓', specialty: '韩式渐变', level: 'junior', bio: '韩式渐变风格新秀', isActive: true },
    { name: '美玲', specialty: '法式美甲', level: 'senior', bio: '经典法式风格，优雅永不过时', isActive: true },
  ]).returning();

  const custRows = await db.insert(customers).values([
    { name: '王芳', phone: '13800138001', gender: '女', birthday: '1992-03-15', source: '小红书' },
    { name: '李婷', phone: '13800138002', gender: '女', birthday: '1988-07-22', source: '朋友推荐' },
    { name: '张丽', phone: '13800138003', gender: '女', birthday: '1995-11-08', source: '美团' },
    { name: '刘雪', phone: '13800138004', gender: '女', birthday: '1990-01-30', source: '抖音' },
    { name: '陈静', phone: '13800138005', gender: '女', birthday: '1993-06-12', source: '路过' },
    { name: '赵敏', phone: '13800138006', gender: '女', birthday: '1987-09-25', source: '小红书' },
    { name: '孙燕', phone: '13800138007', gender: '女', birthday: '1996-04-18', source: '朋友推荐' },
    { name: '周琳', phone: '13800138008', gender: '女', birthday: '1991-12-05', source: '美团' },
  ]).returning();

  const svcRows = await db.insert(services).values([
    { name: '日式手绘美甲', category: '美甲', duration: 90, price: '298.00', description: '精致日式手绘图案' },
    { name: '光疗延长甲', category: '美甲', duration: 120, price: '398.00', description: '持久光疗延长' },
    { name: '立体雕花美甲', category: '美甲', duration: 100, price: '358.00', description: '精致立体雕花' },
    { name: '韩式渐变美甲', category: '美甲', duration: 80, price: '268.00', description: '温柔韩式渐变' },
    { name: '法式经典美甲', category: '美甲', duration: 70, price: '238.00', description: '优雅法式经典' },
    { name: '足部护理', category: '美足', duration: 60, price: '198.00', description: '深层足部护理' },
    { name: '足部美甲', category: '美足', duration: 80, price: '258.00', description: '足部美甲彩绘' },
    { name: '睫毛嫁接', category: '美睫', duration: 60, price: '188.00', description: '自然浓密睫毛' },
  ]).returning();

  await db.insert(reminderRules).values([
    { name: '疗程即将过期', type: 'treatment_expire', conditionDays: 7, urgencyLevel: 'urgent', messageTemplate: '您的{serviceName}疗程将于{expireDate}到期，还剩{remaining}次未使用，请尽快预约。' },
    { name: '疗程即将过期', type: 'treatment_expire', conditionDays: 30, urgencyLevel: 'warning', messageTemplate: '您的{serviceName}疗程将于{expireDate}到期，还剩{remaining}次未使用。' },
    { name: '疗程即将过期', type: 'treatment_expire', conditionDays: 60, urgencyLevel: 'info', messageTemplate: '温馨提醒：您的{serviceName}疗程还有{remaining}次未使用。' },
    { name: '久未到店', type: 'no_visit', conditionDays: 30, urgencyLevel: 'warning', messageTemplate: '亲爱的{name}，很久没见到您了，期待您的再次光临！' },
    { name: '久未到店', type: 'no_visit', conditionDays: 60, urgencyLevel: 'urgent', messageTemplate: '亲爱的{name}，我们很想念您！现在有专属优惠等您来。' },
  ]);

  const now = new Date();
  const dateOffset = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  };
  const timestampOffset = (days: number, hours = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    d.setHours(d.getHours() - hours);
    return d;
  };

  const workRows = await db.insert(works).values([
    {
      technicianId: techRows[0].id,
      title: '樱花少女日式手绘',
      images: [],
      description: '精致樱花图案手绘，搭配粉色渐变，少女心满满',
      tags: ['日式', '手绘', '樱花', '粉色'],
      isPublished: true,
      publishedAt: timestampOffset(7),
      createdAt: timestampOffset(10)
    },
    {
      technicianId: techRows[1].id,
      title: '裸色光疗延长自然款',
      images: [],
      description: '自然裸色光疗延长，日常百搭，持久30天+',
      tags: ['光疗', '延长', '裸色', '自然'],
      isPublished: true,
      publishedAt: timestampOffset(14),
      createdAt: timestampOffset(20)
    },
    {
      technicianId: techRows[2].id,
      title: '玫瑰立体雕花新娘甲',
      images: [],
      description: '精致玫瑰立体雕花，婚礼首选，典雅高贵',
      tags: ['雕花', '新娘', '玫瑰', '立体'],
      isPublished: true,
      publishedAt: timestampOffset(3),
      createdAt: timestampOffset(5)
    },
    {
      technicianId: techRows[3].id,
      title: '韩式豆沙渐变',
      images: [],
      description: '温柔豆沙色渐变，通勤必备，气质满分',
      tags: ['韩式', '渐变', '豆沙色', '通勤'],
      isPublished: true,
      publishedAt: timestampOffset(21),
      createdAt: timestampOffset(30)
    },
    {
      technicianId: techRows[4].id,
      title: '经典法式V型微笑线',
      images: [],
      description: '永不过时的经典法式，优雅知性的代名词',
      tags: ['法式', '经典', 'V型', '优雅'],
      isPublished: true,
      publishedAt: timestampOffset(2),
      createdAt: timestampOffset(4)
    },
    {
      technicianId: techRows[0].id,
      title: '豹纹酷飒手绘',
      images: [],
      description: '个性豹纹图案，又A又飒，气场全开',
      tags: ['手绘', '豹纹', '酷飒', '个性'],
      isPublished: false,
      createdAt: timestampOffset(1)
    },
    {
      technicianId: techRows[2].id,
      title: '蝴蝶结少女立体款',
      images: [],
      description: '立体蝴蝶结装饰，可爱满分，甜度爆表',
      tags: ['雕花', '蝴蝶结', '少女', '可爱'],
      isPublished: true,
      publishedAt: timestampOffset(28),
      createdAt: timestampOffset(35)
    },
    {
      technicianId: techRows[1].id,
      title: '黑色渐变酷飒延长',
      images: [],
      description: '黑色渐变延长甲，神秘酷飒，气场女王',
      tags: ['光疗', '延长', '黑色', '渐变'],
      isPublished: true,
      publishedAt: timestampOffset(10),
      createdAt: timestampOffset(15)
    }
  ]).returning();

  await db.insert(comments).values([
    {
      workId: workRows[0].id,
      customerId: custRows[0].id,
      content: '太美了！小美技师的手艺真的很棒，樱花图案画得栩栩如生，朋友们都说好看！',
      rating: 5,
      status: 'approved',
      createdAt: timestampOffset(5, 3),
      reviewedAt: timestampOffset(5, 2)
    },
    {
      workId: workRows[0].id,
      authorName: '小美',
      content: '粉色系真的很温柔，下次还来！',
      rating: 5,
      status: 'approved',
      createdAt: timestampOffset(4, 5),
      reviewedAt: timestampOffset(4, 4)
    },
    {
      workId: workRows[1].id,
      customerId: custRows[1].id,
      content: '光疗延长做的很自然，完全看不出是接的，保持了一个多月都没掉，推荐佳佳技师！',
      rating: 5,
      status: 'approved',
      createdAt: timestampOffset(12, 2),
      reviewedAt: timestampOffset(12, 1)
    },
    {
      workId: workRows[2].id,
      customerId: custRows[2].id,
      content: '结婚当天做的新娘甲，玫瑰雕花太精致了，拍照超级出片，感谢小花大师！',
      rating: 5,
      status: 'approved',
      createdAt: timestampOffset(2, 8),
      reviewedAt: timestampOffset(2, 5)
    },
    {
      workId: workRows[3].id,
      customerId: custRows[3].id,
      content: '豆沙色很显白，上班涂完全没问题，低调又好看～',
      rating: 4,
      status: 'approved',
      createdAt: timestampOffset(25, 4),
      reviewedAt: timestampOffset(25, 3)
    },
    {
      workId: workRows[4].id,
      customerId: custRows[4].id,
      content: '法式永远的神！美玲技师的微笑线画的太漂亮了，每一根都很整齐。',
      rating: 5,
      status: 'approved',
      createdAt: timestampOffset(1, 10),
      reviewedAt: timestampOffset(1, 8)
    },
    {
      workId: workRows[6].id,
      authorName: '小可爱',
      content: '蝴蝶结好精致啊！少女心爆棚！',
      rating: 5,
      status: 'approved',
      createdAt: timestampOffset(20, 6),
      reviewedAt: timestampOffset(20, 5)
    },
    {
      workId: workRows[0].id,
      authorName: '匿名游客',
      content: '这家店的作品真的都好好看，准备下周去预约！',
      rating: 5,
      status: 'pending',
      createdAt: timestampOffset(0, 5)
    },
    {
      workId: workRows[2].id,
      customerId: custRows[5].id,
      content: '款式不错但是价格有点贵...',
      rating: 3,
      status: 'pending',
      createdAt: timestampOffset(0, 2)
    }
  ]);

  const cardRows = await db.insert(treatmentCards).values([
    { customerId: custRows[0].id, serviceName: '日式美甲10次卡', totalSessions: 10, usedSessions: 6, price: '2580.00', startDate: dateOffset(60), expireDate: dateOffset(-30), status: 'active' },
    { customerId: custRows[1].id, serviceName: '光疗延长8次卡', totalSessions: 8, usedSessions: 7, price: '2980.00', startDate: dateOffset(45), expireDate: dateOffset(-10), status: 'active' },
    { customerId: custRows[2].id, serviceName: '新娘甲定制3次卡', totalSessions: 3, usedSessions: 1, price: '1580.00', startDate: dateOffset(100), expireDate: dateOffset(-100), status: 'active' },
    { customerId: custRows[3].id, serviceName: '美睫年卡不限次', totalSessions: 999, usedSessions: 12, price: '3980.00', startDate: dateOffset(180), expireDate: dateOffset(-200), status: 'active' },
    { customerId: custRows[4].id, serviceName: '足部护理5次卡', totalSessions: 5, usedSessions: 5, price: '880.00', startDate: dateOffset(90), expireDate: dateOffset(0), status: 'completed' },
    { customerId: custRows[5].id, serviceName: '法式美甲6次卡', totalSessions: 6, usedSessions: 2, price: '1280.00', startDate: dateOffset(200), expireDate: dateOffset(40), status: 'active' },
  ]).returning();

  await db.insert(appointments).values([
    { customerId: custRows[0].id, technicianId: techRows[0].id, serviceId: svcRows[0].id, appointmentDate: dateOffset(0), appointmentTime: '14:00', status: 'pending', remark: '要画樱花图案', createdAt: timestampOffset(1) },
    { customerId: custRows[1].id, technicianId: techRows[1].id, serviceId: svcRows[1].id, appointmentDate: dateOffset(0), appointmentTime: '15:30', status: 'confirmed', createdAt: timestampOffset(2) },
    { customerId: custRows[2].id, technicianId: techRows[2].id, serviceId: svcRows[2].id, appointmentDate: dateOffset(0), appointmentTime: '11:00', status: 'completed', createdAt: timestampOffset(5) },
    { customerId: custRows[3].id, technicianId: techRows[3].id, serviceId: svcRows[3].id, appointmentDate: dateOffset(1), appointmentTime: '10:00', status: 'completed', createdAt: timestampOffset(6) },
    { customerId: custRows[4].id, technicianId: techRows[4].id, serviceId: svcRows[4].id, appointmentDate: dateOffset(2), appointmentTime: '16:00', status: 'completed', createdAt: timestampOffset(7) },
    { customerId: custRows[5].id, technicianId: techRows[0].id, serviceId: svcRows[0].id, appointmentDate: dateOffset(3), appointmentTime: '13:00', status: 'completed', createdAt: timestampOffset(10) },
    { customerId: custRows[6].id, technicianId: techRows[1].id, serviceId: svcRows[7].id, appointmentDate: dateOffset(5), appointmentTime: '14:30', status: 'cancelled', remark: '客户临时有事', createdAt: timestampOffset(12) },
    { customerId: custRows[7].id, technicianId: techRows[2].id, serviceId: svcRows[2].id, appointmentDate: dateOffset(7), appointmentTime: '15:00', status: 'completed', createdAt: timestampOffset(15) },
  ]);

  await db.insert(cashierRecords).values([
    { customerId: custRows[0].id, technicianId: techRows[0].id, serviceId: svcRows[0].id, amount: '298.00', paymentMethod: 'wechat', type: 'service', createdAt: timestampOffset(3) },
    { customerId: custRows[1].id, technicianId: techRows[1].id, serviceId: svcRows[1].id, amount: '398.00', paymentMethod: 'alipay', type: 'service', createdAt: timestampOffset(4) },
    { customerId: custRows[2].id, technicianId: techRows[2].id, serviceId: svcRows[2].id, treatmentCardId: cardRows[2].id, amount: '0.00', paymentMethod: 'treatment_card', type: 'treatment', remark: '使用新娘甲卡', createdAt: timestampOffset(5, 2) },
    { customerId: custRows[0].id, technicianId: techRows[0].id, treatmentCardId: cardRows[0].id, amount: '2580.00', paymentMethod: 'bank', type: 'treatment', remark: '购买日式美甲10次卡', createdAt: timestampOffset(60, 2) },
    { customerId: custRows[1].id, technicianId: techRows[1].id, treatmentCardId: cardRows[1].id, amount: '2980.00', paymentMethod: 'wechat', type: 'treatment', remark: '购买光疗延长8次卡', createdAt: timestampOffset(45, 3) },
    { customerId: custRows[3].id, technicianId: techRows[3].id, serviceId: svcRows[3].id, amount: '268.00', paymentMethod: 'cash', type: 'service', createdAt: timestampOffset(26, 5) },
    { customerId: custRows[4].id, technicianId: techRows[4].id, serviceId: svcRows[4].id, amount: '238.00', paymentMethod: 'wechat', type: 'service', createdAt: timestampOffset(2, 4) },
    { customerId: custRows[5].id, technicianId: techRows[0].id, treatmentCardId: cardRows[5].id, amount: '1280.00', paymentMethod: 'alipay', type: 'treatment', remark: '购买法式美甲6次卡', createdAt: timestampOffset(200, 5) },
    { customerId: custRows[7].id, technicianId: techRows[2].id, serviceId: svcRows[2].id, amount: '358.00', paymentMethod: 'wechat', type: 'service', createdAt: timestampOffset(7, 3) },
    { customerId: custRows[3].id, technicianId: null, treatmentCardId: cardRows[3].id, amount: '3980.00', paymentMethod: 'bank', type: 'treatment', remark: '购买美睫年卡', createdAt: timestampOffset(180, 6) },
  ]);

  await db.insert(operationHistory).values([
    { operatorName: '店长', action: '创建', targetType: 'customer', targetId: custRows[0].id, detail: '添加新客户：王芳', metadata: { source: '小红书', phone: '13800138001' }, createdAt: timestampOffset(100, 1) },
    { operatorName: '店长', action: '创建', targetType: 'customer', targetId: custRows[1].id, detail: '添加新客户：李婷', metadata: { source: '朋友推荐' }, createdAt: timestampOffset(90, 2) },
    { operatorName: '小美', action: '创建', targetType: 'work', targetId: workRows[0].id, detail: '上传新作品：樱花少女日式手绘', metadata: { technician: '小美' }, createdAt: timestampOffset(10, 2) },
    { operatorName: '店长', action: '更新', targetType: 'work', targetId: workRows[0].id, detail: '发布作品：樱花少女日式手绘', metadata: { action: 'publish' }, createdAt: timestampOffset(7, 3) },
    { operatorName: '佳佳', action: '创建', targetType: 'work', targetId: workRows[1].id, detail: '上传新作品：裸色光疗延长自然款', createdAt: timestampOffset(20, 1) },
    { operatorName: '店长', action: '审核通过', targetType: 'comment', targetId: null, detail: '审核通过客户：王芳的评论', metadata: { rating: 5 }, createdAt: timestampOffset(5, 2) },
    { operatorName: '店长', action: '创建', targetType: 'treatment_card', targetId: cardRows[0].id, detail: '为王芳创建日式美甲10次卡', metadata: { price: '2580.00', totalSessions: 10 }, createdAt: timestampOffset(60, 2) },
    { operatorName: '前台', action: '核销', targetType: 'treatment_card', targetId: cardRows[0].id, detail: '王芳使用疗程卡核销1次', metadata: { remaining: 4 }, createdAt: timestampOffset(3, 2) },
    { operatorName: '前台', action: '创建', targetType: 'cashier', detail: '收银：王芳 ¥298.00 微信支付', metadata: { amount: '298.00', method: 'wechat' }, createdAt: timestampOffset(3, 3) },
    { operatorName: '前台', action: '创建', targetType: 'appointment', detail: '预约：李婷 15:30 佳佳技师', metadata: { service: '光疗延长甲' }, createdAt: timestampOffset(2, 3) },
    { operatorName: '系统', action: '生成', targetType: 'reminder', detail: '自动生成疗程过期提醒：李婷', metadata: { urgencyLevel: 'warning', rule: '疗程即将过期30天' }, createdAt: timestampOffset(1, 1) },
  ]);

  console.log('Seed data inserted successfully');
}
