import { PrismaClient, UserRole, BillingCycle, ApplicationStatus, LicenseType, LicenseStatus, TrialHandleResult } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化数据...');

  const hashedPassword = await bcrypt.hash('123456', 10);

  const users = await prisma.user.createMany({
    data: [
      { username: 'admin', passwordHash: hashedPassword, name: '系统管理员', email: 'admin@example.com', department: '技术部', role: UserRole.SYS_ADMIN },
      { username: 'op_admin', passwordHash: hashedPassword, name: '运营管理员', email: 'op@example.com', department: '运营部', role: UserRole.OP_ADMIN },
      { username: 'fin_admin', passwordHash: hashedPassword, name: '财务管理员', email: 'fin@example.com', department: '财务部', role: UserRole.FIN_ADMIN },
      { username: 'zhangsan', passwordHash: hashedPassword, name: '张三', email: 'zhangsan@example.com', department: '产品部', role: UserRole.USER },
      { username: 'lisi', passwordHash: hashedPassword, name: '李四', email: 'lisi@example.com', department: '市场部', role: UserRole.USER },
      { username: 'wangwu', passwordHash: hashedPassword, name: '王五', email: 'wangwu@example.com', department: '研发部', role: UserRole.USER },
    ],
    skipDuplicates: true,
  });
  console.log(`创建用户: ${users.count} 个`);

  const plugins = await prisma.plugin.createMany({
    data: [
      { name: '数据分析插件', code: 'data-analysis', description: '强大的数据分析和可视化工具，支持多维度数据探查', icon: 'BarChartOutlined', category: '数据工具' },
      { name: '协作办公套件', code: 'collab-suite', description: '团队协作与文档管理，提升办公效率', icon: 'TeamOutlined', category: '办公工具' },
      { name: '客户关系管理', code: 'crm-pro', description: '全流程客户管理，销售漏斗跟踪', icon: 'UserSwitchOutlined', category: '业务系统' },
      { name: '项目管理平台', code: 'pm-platform', description: '敏捷项目管理，任务看板与甘特图', icon: 'ProjectOutlined', category: '项目管理' },
      { name: '设计资源库', code: 'design-assets', description: '海量设计素材和模板，一键下载使用', icon: 'PictureOutlined', category: '设计工具' },
      { name: 'AI 智能助手', code: 'ai-assistant', description: '基于大模型的智能写作、代码辅助', icon: 'RobotOutlined', category: 'AI 工具' },
    ],
    skipDuplicates: true,
  });
  console.log(`创建插件: ${plugins.count} 个`);

  const pluginList = await prisma.plugin.findMany();
  
  const plansData = [];
  pluginList.forEach(plugin => {
    plansData.push(
      { pluginId: plugin.id, name: '基础版', code: `${plugin.code}-basic`, description: '适合个人和小团队使用', seatCount: 5, features: JSON.stringify(['基础功能', '5个席位', '标准支持']), billingCycle: BillingCycle.MONTHLY, price: 99 },
      { pluginId: plugin.id, name: '专业版', code: `${plugin.code}-pro`, description: '适合成长型团队，功能更全面', seatCount: 20, features: JSON.stringify(['全部功能', '20个席位', '优先支持', '高级报表']), billingCycle: BillingCycle.MONTHLY, price: 299 },
      { pluginId: plugin.id, name: '企业版', code: `${plugin.code}-enterprise`, description: '适合大型企业，定制化服务', seatCount: 100, features: JSON.stringify(['全部功能', '100个席位', '专属客服', '定制开发', 'SLA保障']), billingCycle: BillingCycle.YEARLY, price: 2999 },
    );
  });

  const plans = await prisma.pricingPlan.createMany({
    data: plansData,
    skipDuplicates: true,
  });
  console.log(`创建套餐: ${plans.count} 个`);

  const userZhangsan = await prisma.user.findUnique({ where: { username: 'zhangsan' } });
  const userLisi = await prisma.user.findUnique({ where: { username: 'lisi' } });
  const adminUser = await prisma.user.findUnique({ where: { username: 'admin' } });
  const planBasic = await prisma.pricingPlan.findFirst({ where: { name: '基础版' } });
  const planPro = await prisma.pricingPlan.findFirst({ where: { name: '专业版' } });
  const pluginDA = await prisma.plugin.findUnique({ where: { code: 'data-analysis' } });
  const pluginCRM = await prisma.plugin.findUnique({ where: { code: 'crm-pro' } });
  const pluginAI = await prisma.plugin.findUnique({ where: { code: 'ai-assistant' } });

  const today = new Date();
  const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
  const tenDaysLater = new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000);

  if (userZhangsan && userLisi && adminUser && planBasic && planPro && pluginDA && pluginCRM && pluginAI) {
    const app1 = await prisma.application.create({
      data: {
        pluginId: pluginDA.id,
        planId: planPro.id,
        userId: userZhangsan.id,
        applicantName: userZhangsan.name,
        department: userZhangsan.department,
        reason: '团队需要进行销售数据分析，提升决策效率',
        status: ApplicationStatus.PENDING,
        seatCount: 10,
        trialDays: 7,
      },
    });

    const app2 = await prisma.application.create({
      data: {
        pluginId: pluginCRM.id,
        planId: planBasic.id,
        userId: userLisi.id,
        applicantName: userLisi.name,
        department: userLisi.department,
        reason: '市场团队客户管理需求',
        status: ApplicationStatus.PROCESSING,
        seatCount: 5,
        trialDays: 0,
        processingNote: '正在核实部门预算，请稍候',
      },
    });

    const app3 = await prisma.application.create({
      data: {
        pluginId: pluginAI.id,
        planId: planPro.id,
        userId: userZhangsan.id,
        applicantName: userZhangsan.name,
        department: userZhangsan.department,
        reason: '提升产品文档和代码编写效率',
        status: ApplicationStatus.COMPLETED,
        seatCount: 15,
        trialDays: 14,
        approvedBy: adminUser.id,
        approvedAt: threeDaysAgo,
      },
    });

    await prisma.license.create({
      data: {
        pluginId: pluginAI.id,
        userId: userZhangsan.id,
        applicationId: app3.id,
        planId: planPro.id,
        type: LicenseType.TRIAL,
        status: LicenseStatus.ACTIVE,
        seatCount: 15,
        usedSeats: 8,
        startDate: threeDaysAgo,
        endDate: tenDaysLater,
        trialEndDate: tenDaysLater,
        remarks: '产品部试用中，到期评估是否转正',
      },
    });

    const app4 = await prisma.application.create({
      data: {
        pluginId: pluginDA.id,
        planId: planBasic.id,
        userId: userLisi.id,
        applicantName: userLisi.name,
        department: userLisi.department,
        reason: '市场活动效果分析',
        status: ApplicationStatus.CLOSED_ABNORMAL,
        seatCount: 3,
        trialDays: 0,
        closeReason: '插件暂时不支持市场活动数据接入，需求不匹配',
        approvedBy: adminUser.id,
        approvedAt: threeDaysAgo,
      },
    });

    const app5 = await prisma.application.create({
      data: {
        pluginId: pluginCRM.id,
        planId: planPro.id,
        userId: userZhangsan.id,
        applicantName: userZhangsan.name,
        department: userZhangsan.department,
        reason: '产品部客户反馈管理',
        status: ApplicationStatus.COMPLETED,
        seatCount: 8,
        trialDays: 0,
        approvedBy: adminUser.id,
        approvedAt: threeDaysAgo,
      },
    });

    await prisma.license.create({
      data: {
        pluginId: pluginCRM.id,
        userId: userZhangsan.id,
        applicationId: app5.id,
        planId: planPro.id,
        type: LicenseType.PAID,
        status: LicenseStatus.ACTIVE,
        seatCount: 20,
        usedSeats: 12,
        startDate: threeDaysAgo,
        endDate: thirtyDaysLater,
      },
    });

    const usageRecords = [];
    const licensePaid = await prisma.license.findFirst({ where: { type: LicenseType.PAID } });
    const licenseTrial = await prisma.license.findFirst({ where: { type: LicenseType.TRIAL } });
    
    if (licensePaid) {
      for (let i = 0; i < 30; i++) {
        const date = new Date(today.getTime() - (30 - i) * 24 * 60 * 60 * 1000);
        usageRecords.push({
          licenseId: licensePaid.id,
          pluginId: licensePaid.pluginId,
          date: date,
          usageCount: Math.floor(Math.random() * 500) + 100,
          activeUsers: Math.floor(Math.random() * 15) + 5,
        });
      }
    }

    if (licenseTrial) {
      for (let i = 0; i < 3; i++) {
        const date = new Date(today.getTime() - (3 - i) * 24 * 60 * 60 * 1000);
        usageRecords.push({
          licenseId: licenseTrial.id,
          pluginId: licenseTrial.pluginId,
          date: date,
          usageCount: Math.floor(Math.random() * 200) + 50,
          activeUsers: Math.floor(Math.random() * 8) + 2,
        });
      }
    }

    if (usageRecords.length > 0) {
      await prisma.usageRecord.createMany({ data: usageRecords });
      console.log(`创建使用记录: ${usageRecords.length} 条`);
    }

    console.log(`创建申请单: 5 个`);
    console.log(`创建授权: 2 个`);
  }

  console.log('数据初始化完成!');
  console.log('测试账号: admin / 123456 (系统管理员)');
  console.log('测试账号: op_admin / 123456 (运营管理员)');
  console.log('测试账号: fin_admin / 123456 (财务管理员)');
  console.log('测试账号: zhangsan / 123456 (普通用户)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
