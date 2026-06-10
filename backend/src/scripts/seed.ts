import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../modules/users/users.service';
import { UserRole } from '../modules/users/user.schema';
import { ServicesService } from '../modules/services/services.service';
import { TechniciansService } from '../modules/technicians/technicians.service';
import { MembershipsService } from '../modules/memberships/memberships.service';
import { RemindersService } from '../modules/reminders/reminders.service';
import { DictionaryService } from '../modules/dictionary/dictionary.service';
import { ReminderType, ReminderLevel, ReminderCategory } from '../modules/reminders/reminder-rule.schema';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const usersService = app.get(UsersService);
  const servicesService = app.get(ServicesService);
  const techniciansService = app.get(TechniciansService);
  const membershipsService = app.get(MembershipsService);
  const remindersService = app.get(RemindersService);
  const dictionaryService = app.get(DictionaryService);

  console.log('开始初始化数据...');

  const adminExists = await usersService.findByUsername('admin');
  if (!adminExists) {
    await usersService.create({
      username: 'admin',
      password: 'admin123',
      name: '系统管理员',
      role: UserRole.SUPER_ADMIN,
      phone: '13800138000',
    });
    console.log('✓ 创建管理员账号: admin / admin123');
  } else {
    console.log('✓ 管理员账号已存在');
  }

  const services = await servicesService.findAll();
  if (services.length === 0) {
    const defaultServices = [
      { name: '基础美甲', description: '基础指甲护理和上色', price: 98, duration: 60, category: '美甲', sort: 1, status: 'active' },
      { name: '法式美甲', description: '经典法式美甲', price: 168, duration: 90, category: '美甲', sort: 2, status: 'active' },
      { name: '光疗甲', description: '持久光疗美甲', price: 268, duration: 120, category: '美甲', sort: 3, status: 'active' },
      { name: '美甲延长', description: '指甲延长服务', price: 368, duration: 150, category: '美甲', sort: 4, status: 'active' },
      { name: '美睫嫁接', description: '自然款美睫', price: 198, duration: 90, category: '美睫', sort: 1, status: 'active' },
      { name: '浓密美睫', description: '浓密款美睫', price: 298, duration: 120, category: '美睫', sort: 2, status: 'active' },
      { name: '手部护理', description: '深度手部护理', price: 128, duration: 60, category: '手足护理', sort: 1, status: 'active' },
      { name: '足部护理', description: '深度足部护理', price: 168, duration: 75, category: '手足护理', sort: 2, status: 'active' },
    ];
    
    for (const service of defaultServices) {
      await servicesService.create(service);
    }
    console.log('✓ 创建默认服务项目');
  } else {
    console.log('✓ 服务项目已存在');
  }

  const technicians = await techniciansService.findAll();
  if (technicians.length === 0) {
    const allServices = await servicesService.findAll();
    const serviceIds = allServices.map(s => s._id.toString());
    
    const defaultTechnicians = [
      {
        name: '小美',
        phone: '13800138001',
        position: '高级美甲师',
        description: '5年美甲经验，擅长各种款式',
        skills: ['美甲', '美睫', '手部护理'],
        serviceIds: serviceIds.slice(0, 4),
        workStartTime: '09:00',
        workEndTime: '18:00',
        workDays: [1, 2, 3, 4, 5, 6],
        status: 'active',
        sort: 1,
      },
      {
        name: '丽丽',
        phone: '13800138002',
        position: '资深美甲师',
        description: '8年美甲经验，专攻日式美甲',
        skills: ['美甲', '光疗甲', '美甲延长'],
        serviceIds: serviceIds.slice(1, 5),
        workStartTime: '10:00',
        workEndTime: '19:00',
        workDays: [1, 2, 3, 4, 5, 6, 0],
        status: 'active',
        sort: 2,
      },
      {
        name: '小芳',
        phone: '13800138003',
        position: '美睫师',
        description: '专业美睫师，3年经验',
        skills: ['美睫', '眼部护理'],
        serviceIds: serviceIds.slice(4, 6),
        workStartTime: '09:00',
        workEndTime: '18:00',
        workDays: [1, 2, 3, 4, 5],
        status: 'active',
        sort: 3,
      },
    ];
    
    for (const tech of defaultTechnicians) {
      await techniciansService.create(tech);
    }
    console.log('✓ 创建默认技师账号');
  } else {
    console.log('✓ 技师账号已存在');
  }

  const memberships = await membershipsService.findAll();
  if (memberships.length === 0) {
    const defaultMemberships = [
      {
        name: '美甲10次卡',
        type: 'times',
        price: 880,
        originalPrice: 980,
        totalTimes: 10,
        description: '基础美甲10次卡，有效期1年',
        status: 'active',
        sort: 1,
      },
      {
        name: '储值卡1000元',
        type: 'amount',
        price: 1000,
        originalPrice: 1000,
        totalAmount: 1200,
        description: '储值1000送200，全场通用',
        status: 'active',
        sort: 2,
      },
      {
        name: '季卡',
        type: 'duration',
        price: 1980,
        originalPrice: 2980,
        durationDays: 90,
        description: '季度卡，不限次数基础护理',
        status: 'active',
        sort: 3,
      },
    ];
    
    for (const m of defaultMemberships) {
      await membershipsService.create(m);
    }
    console.log('✓ 创建默认会员卡');
  } else {
    console.log('✓ 会员卡已存在');
  }

  const reminders = await remindersService.findAll();
  if (reminders.length === 0) {
    const defaultReminders = [
      {
        name: '预约提前提醒',
        type: ReminderType.APPOINTMENT_REMIND,
        level: ReminderLevel.INFO,
        category: ReminderCategory.DAILY,
        description: '预约开始前30分钟提醒',
        threshold: 30,
        thresholdUnit: '分钟',
        enabled: true,
        sort: 1,
      },
      {
        name: '预约冲突检测',
        type: ReminderType.APPOINTMENT_CONFLICT,
        level: ReminderLevel.BLOCKING,
        category: ReminderCategory.ALERT,
        description: '同一技师同一时间段只能有一个预约',
        enabled: true,
        sort: 2,
      },
      {
        name: '会员卡到期提醒',
        type: ReminderType.MEMBERSHIP_EXPIRE,
        level: ReminderLevel.WARNING,
        category: ReminderCategory.DAILY,
        description: '会员卡到期前30天提醒',
        threshold: 30,
        thresholdUnit: '天',
        enabled: true,
        sort: 3,
      },
      {
        name: '每日营业报表',
        type: ReminderType.DAILY_REPORT,
        level: ReminderLevel.INFO,
        category: ReminderCategory.DAILY,
        description: '每日22:00推送当日营业报表',
        enabled: true,
        sort: 4,
      },
    ];
    
    for (const reminder of defaultReminders) {
      await remindersService.create(reminder, 'system');
    }
    console.log('✓ 创建默认提醒规则');
  } else {
    console.log('✓ 提醒规则已存在');
  }

  const dictItems = await dictionaryService.findAll();
  if (dictItems.length === 0) {
    const defaultDict = [
      { dictType: 'service_category', dictLabel: '美甲', dictValue: '美甲', sort: 1, enabled: true },
      { dictType: 'service_category', dictLabel: '美睫', dictValue: '美睫', sort: 2, enabled: true },
      { dictType: 'service_category', dictLabel: '手足护理', dictValue: '手足护理', sort: 3, enabled: true },
      { dictType: 'service_category', dictLabel: '其他', dictValue: '其他', sort: 4, enabled: true },
      { dictType: 'payment_method', dictLabel: '现金', dictValue: 'cash', sort: 1, enabled: true },
      { dictType: 'payment_method', dictLabel: '微信', dictValue: 'wechat', sort: 2, enabled: true },
      { dictType: 'payment_method', dictLabel: '支付宝', dictValue: 'alipay', sort: 3, enabled: true },
      { dictType: 'payment_method', dictLabel: '刷卡', dictValue: 'card', sort: 4, enabled: true },
      { dictType: 'payment_method', dictLabel: '会员卡', dictValue: 'membership', sort: 5, enabled: true },
      { dictType: 'technician_position', dictLabel: '实习生', dictValue: 'intern', sort: 1, enabled: true },
      { dictType: 'technician_position', dictLabel: '初级美甲师', dictValue: 'junior', sort: 2, enabled: true },
      { dictType: 'technician_position', dictLabel: '高级美甲师', dictValue: 'senior', sort: 3, enabled: true },
      { dictType: 'technician_position', dictLabel: '资深美甲师', dictValue: 'expert', sort: 4, enabled: true },
      { dictType: 'technician_position', dictLabel: '店长', dictValue: 'manager', sort: 5, enabled: true },
    ];
    
    await dictionaryService.batchCreate(defaultDict, 'system');
    console.log('✓ 创建默认字典数据');
  } else {
    console.log('✓ 字典数据已存在');
  }

  console.log('\n数据初始化完成!');
  console.log('管理员账号: admin / admin123');
  
  await app.close();
}

bootstrap();
