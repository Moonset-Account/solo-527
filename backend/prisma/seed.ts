import { PrismaClient } from '@prisma/client';
import { Role, MemberLevel, MemberStatus, CampStatus, CourseType, CheckInStatus, TodoStatus, TodoPriority, TodoType, ConversionChannel, OperationAction } from '../src/types/enums';
import bcrypt from 'bcryptjs';
import dayjs from 'dayjs';

const prisma = new PrismaClient();

async function main() {
  console.log('开始填充种子数据...');

  const hashedPassword = await bcrypt.hash('123456', 10);

  await prisma.user.deleteMany();
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      password: hashedPassword,
      name: '系统管理员',
      role: Role.ADMIN,
      phone: '13800000000',
      email: 'admin@example.com',
    },
  });

  const teacher1 = await prisma.user.create({
    data: {
      username: 'teacher1',
      password: hashedPassword,
      name: '李老师',
      role: Role.TEACHER,
      phone: '13800000001',
    },
  });

  const teacher2 = await prisma.user.create({
    data: {
      username: 'teacher2',
      password: hashedPassword,
      name: '王老师',
      role: Role.TEACHER,
      phone: '13800000002',
    },
  });

  const operator1 = await prisma.user.create({
    data: {
      username: 'operator1',
      password: hashedPassword,
      name: '张运营',
      role: Role.OPERATOR,
      phone: '13800000003',
    },
  });

  await prisma.conversionSource.deleteMany();
  const sources = await Promise.all([
    prisma.conversionSource.create({ data: { name: '微信群推广', channel: ConversionChannel.WECHAT_GROUP, description: '日常社群运营转化' } }),
    prisma.conversionSource.create({ data: { name: '朋友圈广告', channel: ConversionChannel.MOMENTS, description: '朋友圈付费推广' } }),
    prisma.conversionSource.create({ data: { name: '老用户推荐', channel: ConversionChannel.FRIEND_REFERRAL, description: '会员转介绍' } }),
    prisma.conversionSource.create({ data: { name: '线下活动', channel: ConversionChannel.OFFLINE_EVENT, description: '亲子体验活动' } }),
    prisma.conversionSource.create({ data: { name: '直播带货', channel: ConversionChannel.LIVE_STREAM, description: '视频号直播' } }),
    prisma.conversionSource.create({ data: { name: '自然流量', channel: ConversionChannel.ORGANIC, description: '小程序/官网自注册' } }),
  ]);

  await prisma.camp.deleteMany();
  const now = dayjs();
  const camp1 = await prisma.camp.create({
    data: {
      name: '21天亲子阅读训练营（春季班）',
      description: '专为4-8岁儿童设计的亲子阅读启蒙营，21天养成阅读习惯',
      status: CampStatus.ONGOING,
      startDate: now.subtract(7, 'day').toDate(),
      endDate: now.add(14, 'day').toDate(),
      totalDays: 21,
      checkInRule: '每天阅读15分钟以上，上传亲子共读照片或视频',
      maxMembers: 100,
      teacherId: teacher1.id,
      tags: '阅读,启蒙,春季',
    },
  });

  const camp2 = await prisma.camp.create({
    data: {
      name: '7天专注力体验营',
      description: '7天体验课程，感受专注力训练方法',
      status: CampStatus.ONGOING,
      startDate: now.subtract(3, 'day').toDate(),
      endDate: now.add(4, 'day').toDate(),
      totalDays: 7,
      checkInRule: '每天完成专注力训练游戏打卡',
      maxMembers: 50,
      teacherId: teacher2.id,
      tags: '专注力,体验,短期',
    },
  });

  const camp3 = await prisma.camp.create({
    data: {
      name: '30天幼小衔接营',
      description: '帮助孩子从幼儿园平稳过渡到小学',
      status: CampStatus.UPCOMING,
      startDate: now.add(7, 'day').toDate(),
      endDate: now.add(37, 'day').toDate(),
      totalDays: 30,
      checkInRule: '每天完成语数英各一项练习',
      maxMembers: 80,
      teacherId: teacher1.id,
      tags: '幼小衔接,长期,全面',
    },
  });

  await prisma.course.deleteMany();
  const courseData: any[] = [];
  for (let i = 1; i <= camp1.totalDays; i++) {
    courseData.push({
      campId: camp1.id,
      title: `第${i}天：${['我爱阅读', '亲子时光', '故事城堡', '绘本世界', '朗读乐园', '书香满屋', '童话王国'][i % 7]}`,
      type: i % 3 === 0 ? CourseType.HOMEWORK : i % 3 === 1 ? CourseType.VIDEO : CourseType.PDF,
      description: `今天我们一起学习有趣的内容，第${i}天的主题是培养孩子的阅读兴趣。`,
      dayIndex: i,
      duration: 20 + (i % 5) * 5,
      resourceUrl: `https://example.com/videos/camp1/day${i}.mp4`,
      hasTrial: i <= 3,
      trialUrl: i <= 3 ? `https://example.com/trial/camp1/day${i}.mp4` : undefined,
      trialDuration: i <= 3 ? 180 : undefined,
      materialUrl: `https://example.com/materials/camp1/day${i}.pdf`,
      homeworkUrl: i % 2 === 0 ? `https://example.com/homework/camp1/day${i}.pdf` : undefined,
      sortOrder: i,
    });
  }
  for (let i = 1; i <= camp2.totalDays; i++) {
    courseData.push({
      campId: camp2.id,
      title: `第${i}天：专注力训练${i}`,
      type: CourseType.VIDEO,
      description: `专注力训练第${i}天，今天练习舒尔特方格和数字追踪。`,
      dayIndex: i,
      duration: 15,
      resourceUrl: `https://example.com/videos/camp2/day${i}.mp4`,
      hasTrial: true,
      trialUrl: `https://example.com/trial/camp2/day${i}.mp4`,
      trialDuration: 120,
      sortOrder: i,
    });
  }
  for (let i = 1; i <= 10; i++) {
    courseData.push({
      campId: camp3.id,
      title: `第${i}天：幼小衔接预备${i}`,
      type: i % 2 === 0 ? CourseType.LIVE : CourseType.VIDEO,
      description: `幼小衔接第${i}天内容，包含拼音、数学思维、英语启蒙。`,
      dayIndex: i,
      duration: 30,
      resourceUrl: `https://example.com/videos/camp3/day${i}.mp4`,
      hasTrial: i <= 2,
      trialUrl: i <= 2 ? `https://example.com/trial/camp3/day${i}.mp4` : undefined,
      trialDuration: i <= 2 ? 300 : undefined,
      materialUrl: `https://example.com/materials/camp3/day${i}.pdf`,
      sortOrder: i,
    });
  }
  await prisma.course.createMany({ data: courseData });

  await prisma.member.deleteMany();
  const memberNames = [
    { name: '刘晓妈妈', child: '刘小诺', age: 5 },
    { name: '王梓爸爸', child: '王子轩', age: 6 },
    { name: '陈悦妈妈', child: '陈乐乐', age: 4 },
    { name: '赵雅妈妈', child: '赵小雅', age: 7 },
    { name: '孙浩爸爸', child: '孙小浩', age: 5 },
    { name: '周婷妈妈', child: '周婷婷', age: 6 },
    { name: '吴磊爸爸', child: '吴小磊', age: 8 },
    { name: '郑雪妈妈', child: '郑小雪', age: 5 },
    { name: '冯佳妈妈', child: '冯佳佳', age: 4 },
    { name: '何强爸爸', child: '何小强', age: 7 },
    { name: '许晴妈妈', child: '许小晴', age: 6 },
    { name: '蔡明爸爸', child: '蔡小明', age: 5 },
  ];

  const members = [];
  for (let i = 0; i < memberNames.length; i++) {
    const m = memberNames[i];
    const levelIdx = i % 4;
    const level = [MemberLevel.TRIAL, MemberLevel.BASIC, MemberLevel.PREMIUM, MemberLevel.VIP][levelIdx];
    const isLagging = i % 5 === 2;
    const laggingDays = isLagging ? (i % 3) + 1 : 0;
    const status = i % 11 === 0 ? MemberStatus.EXPIRED : MemberStatus.ACTIVE;
    const member = await prisma.member.create({
      data: {
        name: m.name,
        phone: `1390000${String(i + 1).padStart(4, '0')}`,
        childName: m.child,
        childAge: m.age,
        level: level,
        status: status,
        conversionSourceId: sources[i % sources.length].id,
        sourceDetail: i % 3 === 0 ? '团长推荐' : null,
        subscribedAt: now.subtract(i + 10, 'day').toDate(),
        expiresAt: status === MemberStatus.EXPIRED
          ? now.subtract(2, 'day').toDate()
          : now.add(30 - i * 2, 'day').toDate(),
        totalCheckInDays: Math.max(0, 8 - i + (i % 3)),
        continuousDays: Math.max(0, 6 - i),
        lastCheckInAt: isLagging ? now.subtract(laggingDays, 'day').toDate() : now.subtract(i % 2, 'day').toDate(),
        isLagging: isLagging,
        laggingDays: laggingDays,
        remark: isLagging ? '近期打卡不积极，需要跟进' : null,
        tags: i % 2 === 0 ? '高意向,续费' : '新用户',
      },
    });
    members.push(member);

    await prisma.memberBenefit.createMany({
      data: [
        { memberId: member.id, benefitType: 'COURSE', name: '正式课程权限', description: '营期内全部课程观看', totalCount: null, usedCount: 0, validFrom: now.subtract(10, 'day').toDate(), validUntil: member.expiresAt },
        { memberId: member.id, benefitType: 'LIVE', name: '直播答疑次数', description: '专家直播答疑课', totalCount: 5, usedCount: i % 3, validFrom: now.subtract(10, 'day').toDate(), validUntil: member.expiresAt },
        { memberId: member.id, benefitType: 'MATERIAL', name: '学习资料下载', description: '配套PDF学习资料', totalCount: 20, usedCount: i, validFrom: now.subtract(10, 'day').toDate(), validUntil: member.expiresAt },
        { memberId: member.id, benefitType: 'COUNSELING', name: '1对1咨询服务', description: '专属教育顾问咨询', totalCount: 3, usedCount: i % 2, validFrom: now.subtract(10, 'day').toDate(), validUntil: member.expiresAt },
      ],
    });
  }

  await prisma.memberCamp.deleteMany();
  await prisma.checkIn.deleteMany();
  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    const campIdx = i % 3;
    const camp = [camp1, camp2, camp3][campIdx];
    if (camp.status === CampStatus.UPCOMING) {
      await prisma.memberCamp.create({
        data: { memberId: member.id, campId: camp.id, teacherId: camp.teacherId },
      });
      continue;
    }
    const memberCamp = await prisma.memberCamp.create({
      data: {
        memberId: member.id,
        campId: camp.id,
        teacherId: camp.teacherId,
        completedDays: Math.min(member.totalCheckInDays, dayjs().diff(camp.startDate, 'day') + 1),
      },
    });

    const totalPastDays = Math.min(dayjs().diff(camp.startDate, 'day') + 1, camp.totalDays);
    const missStartDay = member.isLagging ? totalPastDays - member.laggingDays + 1 : totalPastDays + 1;
    for (let d = 1; d <= totalPastDays; d++) {
      let status: CheckInStatus;
      if (d >= missStartDay) {
        status = CheckInStatus.MISSED;
      } else if (d > memberCamp.completedDays) {
        status = CheckInStatus.PENDING;
      } else if (d % 7 === 0) {
        status = CheckInStatus.LATE;
      } else {
        status = CheckInStatus.COMPLETED;
      }
      await prisma.checkIn.create({
        data: {
          memberCampId: memberCamp.id,
          memberId: member.id,
          campId: camp.id,
          dayIndex: d,
          checkInDate: dayjs(camp.startDate).add(d - 1, 'day').toDate(),
          status: status,
          completedAt: status !== CheckInStatus.PENDING && status !== CheckInStatus.MISSED
            ? dayjs(camp.startDate).add(d - 1, 'day').hour(19 + (i % 4)).minute((i * 7) % 60).toDate()
            : null,
          remark: status === CheckInStatus.LATE ? '今日提交较晚' : (status === CheckInStatus.MISSED ? '未打卡' : null),
          score: status === CheckInStatus.COMPLETED ? 90 + (i % 11) : (status === CheckInStatus.LATE ? 75 + (i % 6) : null),
          operatorId: status === CheckInStatus.COMPLETED ? [admin.id, teacher1.id, teacher2.id, operator1.id][i % 4] : null,
        },
      });
    }
  }

  await prisma.fallingBehind.deleteMany();
  const laggingMembers = members.filter(m => m.isLagging);
  for (const member of laggingMembers) {
    await prisma.fallingBehind.create({
      data: {
        memberId: member.id,
        campId: camp1.id,
        reason: member.laggingDays >= 3 ? '连续多日未打卡，可能失去兴趣' : '周末放假未打卡',
        lagDays: member.laggingDays,
        lastCheckInAt: member.lastCheckInAt,
        followUpStatus: member.laggingDays >= 3 ? 'FOLLOWING' : 'PENDING',
        followUpRemark: member.laggingDays >= 3 ? '已私信家长询问情况' : '等待周一自动恢复',
        operatorId: operator1.id,
      },
    });
  }

  await prisma.todo.deleteMany();
  await prisma.todo.createMany({
    data: [
      {
        type: TodoType.LAGGING_STUDENT,
        title: `跟进掉队学员：${laggingMembers[0]?.name || '张小明妈妈'}`,
        description: '连续3天未打卡，需电话沟通了解情况，提供学习支持',
        status: TodoStatus.PENDING,
        priority: TodoPriority.HIGH,
        dueDate: now.add(1, 'day').hour(12).toDate(),
        assigneeId: operator1.id,
        creatorId: admin.id,
        memberId: laggingMembers[0]?.id || members[2].id,
      },
      {
        type: TodoType.COURSE_EXPIRE,
        title: `课程即将到期提醒：${members[0]?.name || '李雷妈妈'}`,
        description: '会员权益还有3天到期，请提醒续费，提供续费优惠方案',
        status: TodoStatus.PENDING,
        priority: TodoPriority.URGENT,
        dueDate: now.add(1, 'day').hour(10).toDate(),
        assigneeId: operator1.id,
        creatorId: admin.id,
        memberId: members[0]?.id || members[0].id,
      },
      {
        type: TodoType.FOLLOW_UP,
        title: '回访新入营学员',
        description: '本周新入营的3名学员，了解适应情况，解答疑问',
        status: TodoStatus.IN_PROGRESS,
        priority: TodoPriority.MEDIUM,
        dueDate: now.add(2, 'day').hour(18).toDate(),
        assigneeId: teacher1.id,
        creatorId: admin.id,
      },
      {
        type: TodoType.MEMBER_WARNING,
        title: '会员体验期即将结束',
        description: '5名体验会员将在3天后到期，安排转化跟进电话',
        status: TodoStatus.PENDING,
        priority: TodoPriority.HIGH,
        dueDate: now.add(2, 'day').hour(9).toDate(),
        assigneeId: operator1.id,
        creatorId: admin.id,
      },
      {
        type: TodoType.CUSTOM,
        title: '准备周末直播课物料',
        description: '准备本周六专注力训练直播课的PPT和互动游戏',
        status: TodoStatus.PENDING,
        priority: TodoPriority.MEDIUM,
        dueDate: now.add(3, 'day').hour(17).toDate(),
        assigneeId: teacher2.id,
        creatorId: teacher2.id,
      },
    ],
  });

  await prisma.conversionLog.deleteMany();
  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    const source = sources[i % sources.length];
    await prisma.conversionLog.create({
      data: {
        memberId: member.id,
        sourceId: source.id,
        operatorId: operator1.id,
        stage: i < members.length / 2 ? 'CONVERTED' : 'FOLLOWING',
        detail: `${source.name}来源，${i % 2 === 0 ? '首次接触' : '二次跟进'}`,
        result: i < members.length / 2 ? '成功转化' : '持续跟进中',
        convertedAt: i < members.length / 2 ? member.subscribedAt : null,
      },
    });
  }

  await prisma.operationLog.deleteMany();
  const actions = [OperationAction.CREATE, OperationAction.UPDATE, OperationAction.CHECK_IN, OperationAction.ASSIGN, OperationAction.COMPLETE, OperationAction.REMIND];
  const targetTypes = ['Member', 'Camp', 'CheckIn', 'Todo', 'Course'];
  for (let i = 0; i < 50; i++) {
    const member = members[i % members.length];
    await prisma.operationLog.create({
      data: {
        operatorId: [admin.id, teacher1.id, teacher2.id, operator1.id][i % 4],
        memberId: i % 3 === 0 ? member.id : null,
        action: actions[i % actions.length],
        targetType: targetTypes[i % targetTypes.length],
        targetId: (i % 20) + 1,
        targetName: i % 3 === 0 ? member.name : `目标${i + 1}`,
        detail: `执行了${actions[i % actions.length]}操作，${i % 2 === 0 ? '成功' : '需要关注'}`,
        ipAddress: `192.168.1.${i % 255}`,
        createdAt: now.subtract(i * 3, 'hour').toDate(),
      },
    });
  }

  await prisma.subscriptionRetention.deleteMany();
  for (let i = 6; i >= 0; i--) {
    const date = now.subtract(i, 'day');
    await prisma.subscriptionRetention.create({
      data: {
        reportDate: date.startOf('day').toDate(),
        newMembers: 3 + (i % 4),
        activeMembers: 45 + (i % 6),
        expiredMembers: i === 0 ? 2 : (i % 3),
        renewedMembers: i === 0 ? 1 : Math.max(0, (i % 3) - 1),
        churnRate: parseFloat((1.5 + i * 0.3).toFixed(2)),
        retentionRate: parseFloat((95 - i * 0.8).toFixed(2)),
        expiredToTodo: i === 0 ? 2 : Math.max(1, i % 3),
        totalRevenue: 8800 + i * 520,
      },
    });
  }

  console.log('种子数据填充完成！');
  console.log(`管理员账号: admin / 123456`);
  console.log(`老师账号: teacher1 / 123456, teacher2 / 123456`);
  console.log(`运营账号: operator1 / 123456`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
