import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Counselor } from './entities/counselor.entity';
import { Service } from './entities/service.entity';
import { Schedule } from './entities/schedule.entity';
import { Appointment } from './entities/appointment.entity';
import { WaitlistEntry } from './entities/waitlist-entry.entity';
import { WaitlistRule } from './entities/waitlist-rule.entity';
import { Refund } from './entities/refund.entity';
import { ProcessingRecord } from './entities/processing-record.entity';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'counseling_queue',
  entities: [User, Counselor, Service, Schedule, Appointment, WaitlistEntry, WaitlistRule, Refund, ProcessingRecord],
  synchronize: true,
});

async function seed() {
  await AppDataSource.initialize();
  console.log('开始初始化数据...');

  const userRepository = AppDataSource.getRepository(User);
  const counselorRepository = AppDataSource.getRepository(Counselor);
  const serviceRepository = AppDataSource.getRepository(Service);
  const scheduleRepository = AppDataSource.getRepository(Schedule);
  const waitlistRuleRepository = AppDataSource.getRepository(WaitlistRule);

  const hashedPassword = await bcrypt.hash('123456', 10);

  const adminUser = userRepository.create({
    username: 'admin',
    password: hashedPassword,
    name: '系统管理员',
    role: 'admin',
    email: 'admin@example.com',
  });
  await userRepository.save(adminUser);

  const dispatcherUser = userRepository.create({
    username: 'dispatcher',
    password: hashedPassword,
    name: '张调度',
    role: 'dispatcher',
    email: 'dispatcher@example.com',
  });
  await userRepository.save(dispatcherUser);

  const clientUser = userRepository.create({
    username: 'client',
    password: hashedPassword,
    name: '李小明',
    role: 'client',
    phone: '13800138000',
    email: 'client@example.com',
  });
  await userRepository.save(clientUser);

  const client2 = userRepository.create({
    username: 'client2',
    password: hashedPassword,
    name: '王小红',
    role: 'client',
    phone: '13900139000',
  });
  await userRepository.save(client2);

  const counselorUsers = [
    { username: 'counselor1', name: '陈医生', specialties: ['情绪管理', '焦虑抑郁', '人际关系'], experienceYears: 8, hourlyRate: 300, intro: '国家二级心理咨询师，从事心理咨询工作8年，擅长情绪调节和人际关系咨询。' },
    { username: 'counselor2', name: '李咨询师', specialties: ['婚姻家庭', '亲子关系', '情绪管理'], experienceYears: 12, hourlyRate: 500, intro: '资深心理咨询师，12年从业经验，专注婚姻家庭咨询领域。' },
    { username: 'counselor3', name: '张老师', specialties: ['职业发展', '青少年心理', '学业压力'], experienceYears: 6, hourlyRate: 250, intro: '心理学硕士，擅长青少年心理咨询和职业发展规划。' },
    { username: 'counselor4', name: '刘医生', specialties: ['焦虑抑郁', '创伤修复', '睡眠问题'], experienceYears: 15, hourlyRate: 600, intro: '精神科医师，15年临床经验，专注焦虑抑郁等情绪障碍治疗。' },
    { username: 'counselor5', name: '王老师', specialties: ['人际关系', '自我成长', '职场心理'], experienceYears: 10, hourlyRate: 400, intro: '注册心理师，擅长人际关系和个人成长咨询。' },
  ];

  const counselors = [];
  for (const cu of counselorUsers) {
    const user = userRepository.create({
      username: cu.username,
      password: hashedPassword,
      name: cu.name,
      role: 'counselor',
    });
    await userRepository.save(user);

    const counselor = counselorRepository.create({
      userId: user.id,
      name: cu.name,
      introduction: cu.intro,
      specialties: cu.specialties,
      certifications: ['国家二级心理咨询师', '注册心理师'],
      experienceYears: cu.experienceYears,
      hourlyRate: cu.hourlyRate,
      rating: 4.5 + Math.random() * 0.5,
      reviewCount: Math.floor(Math.random() * 100) + 10,
      appointmentCount: Math.floor(Math.random() * 200) + 50,
      status: 'active',
    });
    await counselorRepository.save(counselor);
    counselors.push(counselor);
  }

  for (const counselor of counselors) {
    const services = [
      { name: '个人成长咨询', duration: 50, price: counselor.hourlyRate, description: '一对一心理咨询，探索自我，促进个人成长。' },
      { name: '情绪调节咨询', duration: 50, price: counselor.hourlyRate, description: '帮助识别和管理情绪，提升情绪调节能力。' },
    ];

    for (const s of services) {
      const service = serviceRepository.create({
        ...s,
        counselorId: counselor.id,
        status: 'active',
      });
      await serviceRepository.save(service);
    }
  }

  const today = new Date();
  for (let i = 1; i <= 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    for (const counselor of counselors) {
      const slots = [
        { start: '09:00', end: '10:00' },
        { start: '10:30', end: '11:30' },
        { start: '14:00', end: '15:00' },
        { start: '15:30', end: '16:30' },
        { start: '19:00', end: '20:00' },
      ];

      for (let j = 0; j < slots.length; j++) {
        const isBooked = Math.random() > 0.7;
        const schedule = scheduleRepository.create({
          counselorId: counselor.id,
          date: dateStr,
          startTime: slots[j].start,
          endTime: slots[j].end,
          status: isBooked ? 'booked' : 'available',
        });
        await scheduleRepository.save(schedule);
      }
    }
  }

  const defaultRule = waitlistRuleRepository.create({
    ruleName: '默认候补规则',
    ruleType: 'time_window',
    description: '系统默认候补释放规则，提前30分钟通知，15分钟内确认',
    notificationWindowMinutes: 30,
    responseTimeoutMinutes: 15,
    maxQueueSize: 10,
    isActive: true,
    priority: 0,
  });
  await waitlistRuleRepository.save(defaultRule);

  console.log('数据初始化完成！');
  console.log('测试账号：');
  console.log('  调度员: dispatcher / 123456');
  console.log('  客户: client / 123456');
  console.log('  客户: client2 / 123456');
  console.log('  咨询师: counselor1 ~ counselor5 / 123456');
  console.log('  管理员: admin / 123456');

  await AppDataSource.destroy();
}

seed().catch((error) => {
  console.error('数据初始化失败:', error);
  process.exit(1);
});
