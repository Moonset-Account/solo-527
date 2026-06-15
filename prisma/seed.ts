import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('开始植入种子数据...');

  const hashedAdmin = await bcrypt.hash('admin123', 10);
  const hashedLead = await bcrypt.hash('lead123', 10);
  const hashedUser1 = await bcrypt.hash('user123', 10);
  const hashedUser2 = await bcrypt.hash('user123', 10);
  const hashedUser3 = await bcrypt.hash('user123', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: hashedAdmin,
      name: '系统管理员',
      email: 'admin@company.com',
      department: '信息技术部',
      role: 'ADMIN',
      active: true,
    },
  });

  const lead = await prisma.user.upsert({
    where: { username: 'lead' },
    update: {},
    create: {
      username: 'lead',
      passwordHash: hashedLead,
      name: '行政主管-李明',
      email: 'liming@company.com',
      department: '行政管理部',
      role: 'ADMIN_LEAD',
      active: true,
    },
  });

  const zhangsan = await prisma.user.upsert({
    where: { username: 'zhangsan' },
    update: {},
    create: {
      username: 'zhangsan',
      passwordHash: hashedUser1,
      name: '张三',
      email: 'zhangsan@company.com',
      department: '产品研发部',
      role: 'USER',
      active: true,
    },
  });

  const lisi = await prisma.user.upsert({
    where: { username: 'lisi' },
    update: {},
    create: {
      username: 'lisi',
      passwordHash: hashedUser2,
      name: '李四',
      email: 'lisi@company.com',
      department: '市场运营部',
      role: 'USER',
      active: true,
    },
  });

  const wangwu = await prisma.user.upsert({
    where: { username: 'wangwu' },
    update: {},
    create: {
      username: 'wangwu',
      passwordHash: hashedUser3,
      name: '王五',
      email: 'wangwu@company.com',
      department: '人力资源部',
      role: 'USER',
      active: true,
    },
  });

  console.log('用户创建完成');

  const minutes = await prisma.meetingMinutes.create({
    data: {
      title: '2025年第24周周会纪要',
      meetingDate: new Date('2025-06-09'),
      content: `一、上周工作回顾
1. 产品研发：Q2 功能迭代完成 80%，用户反馈系统上线
2. 市场运营：618 活动预热启动，触达用户 12 万
3. 人力资源：社招面试完成 15 人，发放 offer 5 人

二、本周重点工作
1. 完成 Q2 功能剩余模块的测试与上线
2. 618 活动首日 GMV 目标 500 万
3. 完成新员工入职培训

三、决议事项
...`,
      creatorId: admin.id,
    },
  });

  console.log('会议纪要创建完成');

  const tasksData = [
    {
      title: '完成 Q2 产品功能迭代的测试验收',
      description: '涉及用户中心、订单模块、报表中心三个子系统的回归测试，需在 6 月 18 日前完成并出具验收报告。',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      progress: 65,
      assigneeId: zhangsan.id,
      dueDate: new Date('2025-06-18T18:00:00'),
      remindCount: 1,
    },
    {
      title: '提交 618 活动首日运营数据复盘报告',
      description: '统计 GMV、UV、转化率、客单价等核心指标，与去年同期对比分析，形成 10 页以内 PPT。',
      status: 'PENDING_CLAIM',
      priority: 'HIGH',
      progress: 0,
      dueDate: new Date('2025-06-20T12:00:00'),
    },
    {
      title: '组织新员工入职培训（6月第3批）',
      description: '涵盖公司文化、规章制度、信息安全、OA 使用等模块，参训人员约 8 人。',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      progress: 30,
      assigneeId: wangwu.id,
      dueDate: new Date('2025-06-17T17:00:00'),
    },
    {
      title: '更新产品用户协议与隐私政策文档',
      description: '配合合规要求，更新用户协议第 3、7、9 条款，法务审核后于官网更新上线。',
      status: 'DELAYED',
      priority: 'HIGH',
      progress: 40,
      assigneeId: lisi.id,
      dueDate: new Date('2025-06-10T18:00:00'),
    },
    {
      title: '完成服务器机房季度安全巡检',
      description: '检查防火墙规则、入侵检测日志、UPS 电池状态、机房温湿度，形成巡检报告。',
      status: 'COMPLETED',
      priority: 'MEDIUM',
      progress: 100,
      assigneeId: zhangsan.id,
      dueDate: new Date('2025-06-08T18:00:00'),
      completedAt: new Date('2025-06-07T15:30:00'),
    },
    {
      title: '制定下半年培训计划预算方案',
      description: '汇总各部门培训需求，按技术类、管理类、通用类分类，预算控制在 80 万以内。',
      status: 'PENDING_CLAIM',
      priority: 'LOW',
      progress: 0,
      dueDate: new Date('2025-06-28T18:00:00'),
    },
    {
      title: '完成客户满意度调研问卷发放与回收',
      description: '覆盖 VIP 客户 200 家，目标回收率 ≥ 40%，输出调研结论与改进建议。',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      progress: 50,
      assigneeId: lisi.id,
      dueDate: new Date('2025-06-25T18:00:00'),
    },
    {
      title: '整理并归档上季度财务凭证',
      description: '财务凭证按月份、凭证类型编号整理，扫描电子档备份，纸质资料入库。',
      status: 'COMPLETED',
      priority: 'LOW',
      progress: 100,
      assigneeId: wangwu.id,
      dueDate: new Date('2025-06-05T18:00:00'),
      completedAt: new Date('2025-06-04T11:00:00'),
    },
  ];

  for (const t of tasksData) {
    const task = await prisma.task.create({
      data: {
        ...t,
        creatorId: lead.id,
        meetingMinutesId: minutes.id,
      },
    });

    await prisma.processNode.create({
      data: {
        taskId: task.id,
        nodeName: '事项创建',
        toStatus: t.status === 'PENDING_CLAIM' ? 'PENDING_CLAIM' : t.status,
        remark: t.assigneeId ? `已派发至用户` : '进入待认领池',
        operatorId: lead.id,
      },
    });

    if (task.progress > 0 && task.status === 'IN_PROGRESS') {
      await prisma.taskProgress.create({
        data: {
          taskId: task.id,
          userId: task.assigneeId!,
          progress: task.progress,
          remark: task.id === tasksData[0].assigneeId ? '已完成用户中心和订单模块的测试，报表中心进行中' : '培训场地已预定，课件制作中',
        },
      });
    }

    if (task.status === 'DELAYED') {
      await prisma.delayReason.create({
        data: {
          taskId: task.id,
          userId: task.assigneeId!,
          reason: '法务审核流程较预期慢，法务团队目前在处理另一项紧急合规项目，预计本周五前完成审核。',
          expectedDate: new Date('2025-06-20T18:00:00'),
        },
      });
      await prisma.processNode.create({
        data: {
          taskId: task.id,
          nodeName: '状态变更-延期',
          fromStatus: 'IN_PROGRESS',
          toStatus: 'DELAYED',
          remark: '截止日期已过，自动标记为延期',
          operatorId: admin.id,
        },
      });
    }

    if (task.status === 'COMPLETED') {
      await prisma.processNode.create({
        data: {
          taskId: task.id,
          nodeName: '状态变更-完成',
          fromStatus: 'IN_PROGRESS',
          toStatus: 'COMPLETED',
          remark: '责任人提交完成',
          operatorId: task.assigneeId!,
        },
      });
      await prisma.taskProgress.create({
        data: {
          taskId: task.id,
          userId: task.assigneeId!,
          progress: 100,
          remark: '工作已全部完成，验收报告已上传',
        },
      });
    }
  }

  const delayedTask = await prisma.task.findFirst({ where: { status: 'DELAYED' } });
  if (delayedTask) {
    await prisma.reminder.create({
      data: {
        taskId: delayedTask.id,
        senderId: lead.id,
        type: 'MANUAL',
        channel: 'IN_APP',
        content: '该事项已延期，请尽快补充进度并录入延期原因说明。',
      },
    });
    await prisma.taskLog.create({
      data: {
        action: 'REMINDER_SENT',
        taskId: delayedTask.id,
        operatorId: lead.id,
        newValue: { type: 'MANUAL', channel: 'IN_APP' },
      },
    });
  }

  const inProgressTasks = await prisma.task.findMany({ where: { status: 'IN_PROGRESS' }, take: 1 });
  if (inProgressTasks.length > 0) {
    await prisma.taskLog.create({
      data: {
        action: 'ASSIGNEE_CHANGED',
        taskId: inProgressTasks[0].id,
        operatorId: admin.id,
        oldValue: { assigneeId: 'pre-user' },
        newValue: { assigneeId: inProgressTasks[0].assigneeId },
        ipAddress: '192.168.1.100',
      },
    });
  }

  console.log('种子数据植入完成！');
  console.log('账号：admin / admin123 （系统管理员）');
  console.log('账号：lead / lead123 （行政负责人）');
  console.log('账号：zhangsan / user123 （普通用户-张三）');
  console.log('账号：lisi / user123 （普通用户-李四）');
  console.log('账号：wangwu / user123 （普通用户-王五）');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
