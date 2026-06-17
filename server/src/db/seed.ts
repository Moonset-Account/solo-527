import { db } from './index';
import { memberLevels, products, members, adminUsers, exchangeOrders, pointTransactions, reachTasks, reachLogs } from './schema';
import { hashPassword } from '../utils/password';
import { generateOrderNo, generateRedeemCode } from '../utils/generator';
import { eq, sql } from 'drizzle-orm';

async function seed() {
  console.log('🌱 开始填充种子数据...');

  console.log('📊 创建会员等级...');
  const levels = await db.insert(memberLevels).values([
    { name: '普通会员', minGrowth: 0, sortOrder: 1, benefits: '基础积分兑换权益' },
    { name: '银卡会员', minGrowth: 500, sortOrder: 2, benefits: '专属商品95折，生日双倍积分' },
    { name: '金卡会员', minGrowth: 2000, sortOrder: 3, benefits: '专属商品9折，专属客服，优先发货' },
    { name: '钻石会员', minGrowth: 5000, sortOrder: 4, benefits: '专属商品85折，专属礼盒，免费退换' },
  ]).returning();
  console.log(`✅ 创建了 ${levels.length} 个会员等级`);

  console.log('👤 创建管理员账号...');
  const admin1 = await db.insert(adminUsers).values([
    { username: 'admin', passwordHash: await hashPassword('admin123'), role: 'admin', status: 'active' },
    { username: 'ecommerce', passwordHash: await hashPassword('ecom123'), role: 'ecommerce', status: 'active' },
  ]).returning();
  console.log(`✅ 创建了 ${admin1.length} 个管理员账号 (admin/admin123, ecommerce/ecom123)`);

  console.log('👶 创建会员...');
  const sampleMembers = [];
  const phonePrefixes = ['138', '139', '158', '159', '186', '187', '136', '137'];
  for (let i = 0; i < 30; i++) {
    const phone = phonePrefixes[i % phonePrefixes.length] + String(10000000 + i * 137).slice(0, 8);
    const levelIndex = i % levels.length;
    const growth = levels[levelIndex].minGrowth + Math.floor(Math.random() * 1000);
    sampleMembers.push({
      phone,
      nickname: `会员${i + 1}`,
      points: Math.floor(Math.random() * 5000) + 100,
      levelId: levels[levelIndex].id,
      growthValue: growth,
    });
  }
  const newMembers = await db.insert(members).values(sampleMembers).returning();
  console.log(`✅ 创建了 ${newMembers.length} 个会员`);

  console.log('🛍️ 创建商品...');
  const productData = [
    { name: '婴儿柔纸巾（3包装）', description: '超柔亲肤，适合宝宝娇嫩肌肤', pointsPrice: 200, stock: 500, category: '日用品', imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop' },
    { name: '宝宝洗发沐浴二合一', description: '温和无泪配方，清洁又滋润', pointsPrice: 500, stock: 200, category: '洗护', imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop' },
    { name: '纯棉婴儿连体衣', description: '100%纯棉，舒适透气', pointsPrice: 800, stock: 150, category: '服饰', imageUrl: 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=400&h=400&fit=crop' },
    { name: '益智早教玩具套装', description: '安全材质，启蒙认知', pointsPrice: 1200, stock: 100, category: '玩具', imageUrl: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=400&fit=crop' },
    { name: '婴儿推车挂钩', description: '多功能挂钩，方便实用', pointsPrice: 150, stock: 300, category: '配件', imageUrl: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400&h=400&fit=crop' },
    { name: '宝宝辅食研磨碗', description: '手动研磨，制作辅食更方便', pointsPrice: 300, stock: 250, category: '喂养', imageUrl: 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=400&h=400&fit=crop' },
    { name: '硅胶软勺套装', description: '柔软硅胶，保护宝宝牙龈', pointsPrice: 180, stock: 400, category: '喂养', imageUrl: 'https://images.unsplash.com/photo-1526401485004-46910ecc8e51?w=400&h=400&fit=crop' },
    { name: '儿童保温水杯', description: '316不锈钢，长效保温', pointsPrice: 600, stock: 180, category: '用品', requiredLevelId: levels[1]?.id, imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=400&fit=crop' },
    { name: '婴儿睡袋', description: '恒温设计，安睡一整晚', pointsPrice: 1000, stock: 120, category: '服饰', requiredLevelId: levels[2]?.id, imageUrl: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400&h=400&fit=crop' },
    { name: '高端益智积木', description: '进口实木，安全环保', pointsPrice: 2000, stock: 50, category: '玩具', requiredLevelId: levels[3]?.id, imageUrl: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&h=400&fit=crop' },
    { name: '宝宝洗衣液（1L）', description: '酵素配方，温和去渍', pointsPrice: 350, stock: 300, category: '洗护', imageUrl: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=400&h=400&fit=crop' },
    { name: '婴儿口腔清洁器', description: '硅胶刷头，清洁口腔', pointsPrice: 250, stock: 200, category: '护理', imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=400&fit=crop' },
  ];

  const newProducts = await db.insert(products).values(productData).returning();
  console.log(`✅ 创建了 ${newProducts.length} 个商品`);

  console.log('📦 创建兑换订单...');
  const orders = [];
  for (let i = 0; i < 20; i++) {
    const member = newMembers[Math.floor(Math.random() * newMembers.length)];
    const product = newProducts[Math.floor(Math.random() * newProducts.length)];
    const quantity = Math.floor(Math.random() * 3) + 1;
    const totalPoints = product.pointsPrice * quantity;
    const statuses = ['pending', 'redeemed', 'pending', 'redeemed', 'redeemed'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const daysAgo = Math.floor(Math.random() * 30);
    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    orders.push({
      orderNo: generateOrderNo(),
      memberId: member.id,
      productId: product.id,
      quantity,
      totalPoints,
      status,
      redeemCode: generateRedeemCode(),
      redeemedAt: status === 'redeemed' ? new Date(createdAt.getTime() + Math.random() * 3 * 24 * 60 * 60 * 1000) : null,
      createdAt,
    });
  }
  const newOrders = await db.insert(exchangeOrders).values(orders).returning();
  console.log(`✅ 创建了 ${newOrders.length} 个兑换订单`);

  console.log('📝 创建积分流水...');
  const transactions = [];
  for (const member of newMembers.slice(0, 10)) {
    for (let j = 0; j < 3; j++) {
      const isEarn = Math.random() > 0.3;
      const points = Math.floor(Math.random() * 200) + 50;
      transactions.push({
        memberId: member.id,
        points: isEarn ? points : -points,
        type: isEarn ? 'earn' : 'spend',
        reason: isEarn ? '消费赠送积分' : '积分兑换商品',
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      });
    }
  }
  await db.insert(pointTransactions).values(transactions);
  console.log(`✅ 创建了 ${transactions.length} 条积分流水`);

  console.log('📢 创建触达任务...');
  const tasks = [
    { name: '618会员专属活动通知', type: 'sms', status: 'completed', totalCount: 50, successCount: 45, failedCount: 5, createdBy: admin1[0].id },
    { name: '新品上市推送', type: 'sms', status: 'completed', totalCount: 30, successCount: 28, failedCount: 2, createdBy: admin1[1].id },
    { name: '生日祝福短信', type: 'sms', status: 'draft', totalCount: 0, successCount: 0, failedCount: 0, createdBy: admin1[0].id },
    { name: '积分即将过期提醒', type: 'sms', status: 'verified', totalCount: 25, successCount: 0, failedCount: 0, createdBy: admin1[1].id },
  ];
  const newTasks = await db.insert(reachTasks).values(tasks).returning();
  console.log(`✅ 创建了 ${newTasks.length} 个触达任务`);

  console.log('📨 创建触达日志...');
  const logs = [];
  for (const task of newTasks.slice(0, 2)) {
    for (let i = 0; i < 5; i++) {
      const member = newMembers[Math.floor(Math.random() * newMembers.length)];
      const isSuccess = Math.random() > 0.2;
      logs.push({
        taskId: task.id,
        memberId: member.id,
        memberPhone: member.phone,
        status: isSuccess ? 'success' : 'failed',
        errorMessage: isSuccess ? null : '发送失败：号码状态异常',
        retryCount: isSuccess ? 0 : 1,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      });
    }
  }
  await db.insert(reachLogs).values(logs);
  console.log(`✅ 创建了 ${logs.length} 条触达日志`);

  console.log('\n🎉 种子数据填充完成！');
  console.log('');
  console.log('📋 管理员登录账号：');
  console.log('   管理员：admin / admin123');
  console.log('   电商负责人：ecommerce / ecom123');
  console.log('');
  console.log('👶 会员登录：');
  console.log('   任意手机号 + 验证码 123456（开发模式）');
  console.log('   示例手机号：' + newMembers[0]?.phone);
  console.log('');

  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ 种子数据填充失败:', err);
  process.exit(1);
});
