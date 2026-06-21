import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import User from './models/User.js';
import Volunteer from './models/Volunteer.js';
import Activity from './models/Activity.js';
import Schedule from './models/Schedule.js';
import CheckIn from './models/CheckIn.js';
import Feedback from './models/Feedback.js';
import Donation from './models/Donation.js';
import Absence from './models/Absence.js';
import Alert from './models/Alert.js';

const seedDatabase = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/volunteer_dashboard';
    await mongoose.connect(uri);
    console.log('✅ MongoDB connected');

    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      User.deleteMany(),
      Volunteer.deleteMany(),
      Activity.deleteMany(),
      Schedule.deleteMany(),
      CheckIn.deleteMany(),
      Feedback.deleteMany(),
      Donation.deleteMany(),
      Absence.deleteMany(),
      Alert.deleteMany()
    ]);

    console.log('🌱 Seeding users...');
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    const admin = new User({
      username: 'admin',
      password: hashedPassword,
      name: '系统管理员',
      role: 'admin',
      phone: '13800138000',
      email: 'admin@example.com',
      team: '总部'
    });

    const leader = new User({
      username: 'leader',
      password: hashedPassword,
      name: '张队长',
      role: 'leader',
      phone: '13800138001',
      email: 'leader@example.com',
      team: '第一支队'
    });

    const operator = new User({
      username: 'operator',
      password: hashedPassword,
      name: '李运营',
      role: 'operator',
      phone: '13800138002',
      email: 'operator@example.com',
      team: '运营部'
    });

    await Promise.all([admin.save(), leader.save(), operator.save()]);

    console.log('🌱 Seeding volunteers...');
    const volunteerData = [
      { name: '王小明', phone: '13900000001', gender: 'male', age: 25, team: '第一支队', skills: ['急救', '翻译'], totalHours: 48, totalActivities: 12 },
      { name: '李小红', phone: '13900000002', gender: 'female', age: 30, team: '第一支队', skills: ['陪护', '做饭'], totalHours: 36, totalActivities: 8 },
      { name: '张大海', phone: '13900000003', gender: 'male', age: 45, team: '第一支队', skills: ['驾驶', '维修'], totalHours: 72, totalActivities: 20 },
      { name: '刘芳', phone: '13900000004', gender: 'female', age: 28, team: '第二支队', skills: ['教学', '心理咨询'], totalHours: 60, totalActivities: 15 },
      { name: '陈伟', phone: '13900000005', gender: 'male', age: 35, team: '第二支队', skills: ['摄影', '设计'], totalHours: 24, totalActivities: 6 },
      { name: '赵敏', phone: '13900000006', gender: 'female', age: 22, team: '第二支队', skills: ['舞蹈', '主持'], totalHours: 18, totalActivities: 5 },
      { name: '孙强', phone: '13900000007', gender: 'male', age: 50, team: '第三支队', skills: ['医疗', '急救'], totalHours: 120, totalActivities: 35 },
      { name: '周婷', phone: '13900000008', gender: 'female', age: 32, team: '第三支队', skills: ['法律', '调解'], totalHours: 54, totalActivities: 14 }
    ];

    const volunteers = await Volunteer.insertMany(volunteerData.map(v => ({
      ...v,
      status: 'active',
      createdBy: admin._id
    })));

    console.log('🌱 Seeding activities...');
    const today = new Date();
    const activitiesData = [
      {
        title: '社区敬老服务月',
        description: '为社区孤寡老人提供陪护、家政、健康检查等服务',
        type: 'elderly',
        location: '阳光社区活动中心',
        address: '阳光路123号',
        startDate: new Date(today.getFullYear(), today.getMonth(), 1),
        endDate: new Date(today.getFullYear(), today.getMonth() + 1, 0),
        maxVolunteers: 50,
        minVolunteers: 10,
        status: 'ongoing',
        organizer: '阳光社区居委会',
        contactPerson: '王主任',
        contactPhone: '010-12345678',
        isPublic: true,
        createdBy: admin._id
      },
      {
        title: '环保知识进校园',
        description: '走进中小学开展环保知识宣讲和实践活动',
        type: 'environment',
        location: '多所中小学',
        address: '全市范围',
        startDate: new Date(today.getFullYear(), today.getMonth() - 1, 15),
        endDate: new Date(today.getFullYear(), today.getMonth() + 2, 15),
        maxVolunteers: 30,
        minVolunteers: 5,
        status: 'published',
        organizer: '市环保局',
        contactPerson: '李科长',
        contactPhone: '010-87654321',
        isPublic: true,
        createdBy: operator._id
      },
      {
        title: '图书馆志愿服务',
        description: '协助图书馆整理书籍、引导读者、开展阅读活动',
        type: 'education',
        location: '市图书馆',
        address: '文化路456号',
        startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7),
        endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30),
        maxVolunteers: 20,
        minVolunteers: 3,
        status: 'ongoing',
        organizer: '市图书馆',
        contactPerson: '刘馆长',
        contactPhone: '010-11112222',
        isPublic: true,
        createdBy: operator._id
      },
      {
        title: '义诊进社区',
        description: '组织医疗专家为社区居民提供免费健康检查和咨询',
        type: 'medical',
        location: '幸福社区卫生服务站',
        address: '幸福街789号',
        startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3),
        endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4),
        maxVolunteers: 15,
        minVolunteers: 8,
        status: 'published',
        organizer: '市人民医院',
        contactPerson: '张医生',
        contactPhone: '010-33334444',
        isPublic: false,
        createdBy: admin._id
      }
    ];

    const activities = await Activity.insertMany(activitiesData);

    console.log('🌱 Seeding schedules...');
    const schedulesData = [];
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i - 3);
      
      const activityIndex = i % activities.length;
      const activity = activities[activityIndex];
      
      schedulesData.push({
        activityId: activity._id,
        date,
        shiftName: i % 2 === 0 ? '上午班' : '下午班',
        startTime: i % 2 === 0 ? '08:00' : '14:00',
        endTime: i % 2 === 0 ? '12:00' : '18:00',
        location: activity.location,
        maxVolunteers: 8,
        minVolunteers: 2,
        teamLeader: i % 3 === 0 ? leader._id : admin._id,
        status: i < 3 ? 'completed' : (i < 7 ? 'active' : 'pending'),
        volunteers: volunteers.slice(0, 3 + (i % 4)).map((v, idx) => ({
          volunteerId: v._id,
          status: i < 3 ? 'checked_out' : (i < 5 ? 'checked_in' : (idx < 4 ? 'confirmed' : 'signed_up')),
          signedUpAt: new Date(date.getTime() - 86400000 * 2),
          confirmedAt: new Date(date.getTime() - 86400000),
          checkedInAt: i < 5 ? new Date(date.getTime() + 8 * 3600000) : undefined,
          checkedOutAt: i < 3 ? new Date(date.getTime() + 12 * 3600000) : undefined,
          hours: i < 3 ? 4 : 0
        })),
        remarks: i === 5 ? '需要额外准备物资' : ''
      });
    }

    const schedules = await Schedule.insertMany(schedulesData);

    console.log('🌱 Seeding check-ins...');
    const checkInsData = [];
    schedules.slice(0, 5).forEach(schedule => {
      schedule.volunteers.forEach(v => {
        if (v.status === 'checked_out' || v.status === 'checked_in') {
          checkInsData.push({
            scheduleId: schedule._id,
            activityId: schedule.activityId,
            volunteerId: v.volunteerId,
            checkInTime: v.checkedInAt,
            checkOutTime: v.checkedOutAt,
            status: v.status,
            hours: v.hours,
            checkedInBy: admin._id,
            checkedOutBy: v.checkedOutAt ? leader._id : undefined,
            remark: ''
          });
        }
      });
    });
    await CheckIn.insertMany(checkInsData);

    console.log('🌱 Seeding feedbacks...');
    const feedbacksData = [
      {
        activityId: activities[0]._id,
        volunteerId: volunteers[0]._id,
        type: 'suggestion',
        title: '建议增加活动时长',
        content: '老人们都很喜欢我们的服务，希望能延长每次服务的时间。',
        rating: 4,
        status: 'pending',
        priority: 'medium'
      },
      {
        activityId: activities[0]._id,
        volunteerId: volunteers[1]._id,
        type: 'praise',
        title: '活动组织得很好',
        content: '这次活动安排很周到，老人们都很开心。希望以后多组织这样的活动。',
        rating: 5,
        status: 'resolved',
        priority: 'low',
        reviewer: admin._id,
        reviewComment: '感谢认可，我们会继续努力！',
        reviewedAt: new Date(),
        closedBy: admin._id,
        closedAt: new Date()
      },
      {
        activityId: activities[1]._id,
        volunteerId: volunteers[3]._id,
        type: 'complaint',
        title: '物资准备不充分',
        content: '活动当天缺少宣传材料和教具，影响了活动效果。',
        rating: 2,
        status: 'reviewing',
        priority: 'high',
        reviewer: operator._id,
        reviewComment: '已收到反馈，正在协调补充物资',
        reviewedAt: new Date()
      },
      {
        volunteerId: volunteers[5]._id,
        type: 'other',
        title: '关于志愿者培训的建议',
        content: '建议定期组织志愿者培训，提升服务能力。',
        rating: 4,
        status: 'pending',
        priority: 'medium'
      },
      {
        activityId: activities[2]._id,
        volunteerId: volunteers[4]._id,
        type: 'suggestion',
        title: '优化排班系统',
        content: '希望排班系统能更灵活，方便志愿者调班。',
        rating: 3,
        status: 'reviewing',
        priority: 'medium',
        reviewer: operator._id,
        reviewComment: '建议合理，已提交运营评估',
        reviewedAt: new Date()
      }
    ];
    const feedbacks = await Feedback.insertMany(feedbacksData);

    console.log('\n📝 演示：通过处理流程将反馈状态更新为「处理中」...');
    const feedbackToHandle = feedbacks[4];
    console.log('   处理前 - ID:', feedbackToHandle._id);
    console.log('   处理前 - 状态:', feedbackToHandle.status);
    console.log('   处理前 - 标题:', feedbackToHandle.title);

    feedbackToHandle.status = 'handling';
    feedbackToHandle.handlePlan = '计划下个月升级排班系统，增加调班功能';
    feedbackToHandle.handler = admin._id;
    feedbackToHandle.handledAt = new Date();
    const handledFeedback = await feedbackToHandle.save();

    console.log('   ✅ 处理方案保存成功！');
    console.log('   处理后 - 状态:', handledFeedback.status);
    console.log('   处理后 - 处理方案:', handledFeedback.handlePlan);
    console.log('   处理后 - 处理人ID:', handledFeedback.handler);
    console.log('   处理后 - 处理时间:', handledFeedback.handledAt);

    const verifyFeedback = await Feedback.findById(handledFeedback._id)
      .populate('handler', 'name role');
    console.log('   🔍 重新读取验证 - 处理人姓名:', verifyFeedback.handler?.name);
    console.log('   🔍 重新读取验证 - 状态徽章: 处理中 (handling)\n');

    console.log('🌱 Seeding donations...');
    const donationsData = [
      {
        donorName: '爱心企业有限公司',
        donorType: 'enterprise',
        type: 'money',
        amount: 50000,
        description: '支持敬老服务项目',
        activityId: activities[0]._id,
        status: 'received',
        receiptNumber: '2024001',
        receiptIssued: true,
        receivedBy: admin._id,
        receivedAt: new Date(),
        isPublic: true,
        publicNote: '感谢爱心企业的大力支持！'
      },
      {
        donorName: '张三',
        donorType: 'individual',
        type: 'money',
        amount: 2000,
        description: '个人捐款',
        status: 'received',
        receiptNumber: '2024002',
        receiptIssued: true,
        receivedBy: operator._id,
        receivedAt: new Date(),
        isPublic: true
      },
      {
        donorName: '李四',
        donorPhone: '13800001111',
        donorType: 'individual',
        type: 'material',
        items: [
          { name: '冬季保暖衣物', quantity: 50, unit: '件', value: 5000 },
          { name: '保暖鞋', quantity: 30, unit: '双', value: 3000 }
        ],
        description: '为孤寡老人捐赠保暖物资',
        activityId: activities[0]._id,
        status: 'confirmed',
        isPublic: false
      },
      {
        donorName: '某律师事务所',
        donorType: 'enterprise',
        type: 'service',
        description: '提供免费法律咨询服务',
        status: 'pending',
        isPublic: false
      },
      {
        donorName: '王五',
        donorType: 'individual',
        type: 'money',
        amount: 500,
        description: '支持环保活动',
        activityId: activities[1]._id,
        status: 'received',
        receiptNumber: '2024003',
        receiptIssued: true,
        receivedBy: operator._id,
        receivedAt: new Date(),
        isPublic: true
      }
    ];
    await Donation.insertMany(donationsData);

    console.log('🌱 Seeding absences...');
    const absencesData = [
      {
        scheduleId: schedules[5]._id,
        activityId: activities[1]._id,
        volunteerId: volunteers[2]._id,
        type: 'no_show',
        reason: '临时有事无法参加，忘记请假',
        impactScope: '影响该班次服务质量，导致其他志愿者工作量增加',
        impactLevel: 'medium',
        responsiblePerson: leader._id,
        responsiblePersonName: '张队长',
        handlePlan: '1. 联系志愿者了解情况；2. 安排替补志愿者；3. 加强请假制度宣传',
        status: 'handling',
        priority: 'high',
        reportedBy: leader._id
      },
      {
        scheduleId: schedules[3]._id,
        activityId: activities[0]._id,
        volunteerId: volunteers[5]._id,
        type: 'late',
        reason: '地铁故障导致迟到30分钟',
        impactScope: '部分工作延误，但整体影响不大',
        impactLevel: 'low',
        responsiblePerson: leader._id,
        responsiblePersonName: '张队长',
        handlePlan: '记录在案，提醒志愿者预留充足时间',
        status: 'resolved',
        priority: 'low',
        reportedBy: leader._id,
        closedBy: admin._id,
        closedAt: new Date(),
        closeNote: '已沟通处理'
      },
      {
        scheduleId: schedules[6]._id,
        activityId: activities[2]._id,
        volunteerId: volunteers[0]._id,
        type: 'cancelled_late',
        reason: '家中突发急事',
        impactScope: '该班次人手紧张，需紧急协调',
        impactLevel: 'high',
        responsiblePerson: leader._id,
        responsiblePersonName: '张队长',
        handlePlan: '1. 紧急联系备用志愿者；2. 调整当日工作安排；3. 后续与志愿者沟通',
        status: 'reported',
        priority: 'urgent',
        reportedBy: admin._id
      }
    ];
    await Absence.insertMany(absencesData);

    console.log('🌱 Seeding alerts...');
    const alertsData = [
      {
        type: 'low_volunteers',
        title: '活动报名人数不足',
        message: '义诊进社区活动距离开始还有3天，但报名人数仅为最低要求的一半，请关注。',
        severity: 'warning',
        status: 'active',
        activityId: activities[3]._id,
        assignedTo: leader._id,
        metadata: { currentCount: 4, minCount: 8 }
      },
      {
        type: 'absence_high',
        title: '今日缺席人数较多',
        message: '今天有2名志愿者缺席，可能影响活动正常进行，请及时处理。',
        severity: 'danger',
        status: 'active',
        scheduleId: schedules[5]._id,
        assignedTo: leader._id
      },
      {
        type: 'feedback_urgent',
        title: '紧急反馈待处理',
        message: '收到1条高优先级投诉反馈，需要及时响应处理。',
        severity: 'warning',
        status: 'acknowledged',
        assignedTo: operator._id,
        acknowledgedBy: operator._id,
        acknowledgedAt: new Date()
      },
      {
        type: 'donation_pending',
        title: '捐赠物资待接收',
        message: '有一笔价值8000元的物资捐赠待确认接收。',
        severity: 'info',
        status: 'active',
        assignedTo: admin._id
      },
      {
        type: 'activity_starting',
        title: '活动即将开始',
        message: '图书馆志愿服务明天开始，请做好准备工作。',
        severity: 'info',
        status: 'resolved',
        activityId: activities[2]._id,
        assignedTo: leader._id,
        resolvedBy: leader._id,
        resolvedAt: new Date(),
        resolutionNote: '已确认准备工作就绪'
      }
    ];
    await Alert.insertMany(alertsData);

    console.log('✅ Seed data created successfully!');
    console.log('');
    console.log('📋 Demo accounts:');
    console.log('  Admin:    admin / 123456');
    console.log('  Leader:   leader / 123456');
    console.log('  Operator: operator / 123456');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedDatabase();
