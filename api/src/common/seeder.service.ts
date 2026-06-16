import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity.js';
import { Room } from '../entities/room.entity.js';
import { Appointment } from '../entities/appointment.entity.js';
import { WorkOrder } from '../entities/work-order.entity.js';
import { Contract } from '../entities/contract.entity.js';
import { ContractTemplate } from '../entities/contract-template.entity.js';
import { Settlement } from '../entities/settlement.entity.js';
import { SettlementRule } from '../entities/settlement-rule.entity.js';
import { ExceptionOrder } from '../entities/exception-order.entity.js';
import { MessageRecord } from '../entities/message-record.entity.js';
import { PaymentRecord } from '../entities/payment-record.entity.js';
import { VacancyStats } from '../entities/vacancy-stats.entity.js';
import { VacancyAlert } from '../entities/vacancy-alert.entity.js';
import { VacancyAlertConfig } from '../entities/vacancy-alert-config.entity.js';
import { AppointmentSlotConfig } from '../entities/appointment-slot-config.entity.js';
import { WorkflowNodeConfig } from '../entities/workflow-node-config.entity.js';

@Injectable()
export class SeederService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Room) private readonly roomRepo: Repository<Room>,
    @InjectRepository(Appointment) private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(WorkOrder) private readonly workOrderRepo: Repository<WorkOrder>,
    @InjectRepository(Contract) private readonly contractRepo: Repository<Contract>,
    @InjectRepository(ContractTemplate) private readonly templateRepo: Repository<ContractTemplate>,
    @InjectRepository(Settlement) private readonly settlementRepo: Repository<Settlement>,
    @InjectRepository(SettlementRule) private readonly ruleRepo: Repository<SettlementRule>,
    @InjectRepository(ExceptionOrder) private readonly exceptionRepo: Repository<ExceptionOrder>,
    @InjectRepository(MessageRecord) private readonly messageRepo: Repository<MessageRecord>,
    @InjectRepository(PaymentRecord) private readonly paymentRepo: Repository<PaymentRecord>,
    @InjectRepository(VacancyStats) private readonly vacancyStatsRepo: Repository<VacancyStats>,
    @InjectRepository(VacancyAlert) private readonly vacancyAlertRepo: Repository<VacancyAlert>,
    @InjectRepository(VacancyAlertConfig) private readonly alertConfigRepo: Repository<VacancyAlertConfig>,
    @InjectRepository(AppointmentSlotConfig) private readonly slotConfigRepo: Repository<AppointmentSlotConfig>,
    @InjectRepository(WorkflowNodeConfig) private readonly workflowNodeRepo: Repository<WorkflowNodeConfig>,
  ) {}

  async seed(): Promise<void> {
    const users = await this.userRepo.save([
      this.userRepo.create({ username: 'admin', password: 'hashed_admin', realName: '系统管理员', phone: '13800000001', email: 'admin@rental.com', role: 'admin', status: 'active' }),
      this.userRepo.create({ username: 'owner1', password: 'hashed_owner1', realName: '房东张三', phone: '13800000002', email: 'owner1@rental.com', role: 'owner', status: 'active' }),
      this.userRepo.create({ username: 'owner2', password: 'hashed_owner2', realName: '房东李四', phone: '13800000003', email: 'owner2@rental.com', role: 'owner', status: 'active' }),
      this.userRepo.create({ username: 'tenant1', password: 'hashed_tenant1', realName: '租客王五', phone: '13800000004', email: 'tenant1@rental.com', role: 'tenant', status: 'active' }),
      this.userRepo.create({ username: 'staff1', password: 'hashed_staff1', realName: '维修工赵六', phone: '13800000005', email: 'staff1@rental.com', role: 'staff', status: 'active' }),
    ]);

    const rooms = await this.roomRepo.save([
      this.roomRepo.create({ name: '阳光花园A-101', address: '北京市朝阳区阳光花园小区A栋101室', area: 35.5, unitType: '一室一厅', status: 'rented', monthlyRent: 3000, images: ['/images/room1-1.jpg', '/images/room1-2.jpg'], vacantDays: 0, ownerId: users[1].id }),
      this.roomRepo.create({ name: '阳光花园A-102', address: '北京市朝阳区阳光花园小区A栋102室', area: 42.0, unitType: '一室一厅', status: 'vacant', monthlyRent: 3500, images: ['/images/room2-1.jpg', '/images/room2-2.jpg'], vacantDays: 15, ownerId: users[1].id }),
      this.roomRepo.create({ name: '阳光花园A-201', address: '北京市朝阳区阳光花园小区A栋201室', area: 55.0, unitType: '两室一厅', status: 'rented', monthlyRent: 4500, images: ['/images/room3-1.jpg', '/images/room3-2.jpg'], vacantDays: 0, ownerId: users[1].id }),
      this.roomRepo.create({ name: '阳光花园A-202', address: '北京市朝阳区阳光花园小区A栋202室', area: 50.0, unitType: '两室一厅', status: 'maintenance', monthlyRent: 4200, images: ['/images/room4-1.jpg'], vacantDays: 30, ownerId: users[1].id }),
      this.roomRepo.create({ name: '翠苑小区B-101', address: '北京市海淀区翠苑小区B栋101室', area: 38.0, unitType: '一室一厅', status: 'vacant', monthlyRent: 3200, images: ['/images/room5-1.jpg', '/images/room5-2.jpg'], vacantDays: 10, ownerId: users[2].id }),
      this.roomRepo.create({ name: '翠苑小区B-102', address: '北京市海淀区翠苑小区B栋102室', area: 60.0, unitType: '两室一厅', status: 'rented', monthlyRent: 5000, images: ['/images/room6-1.jpg', '/images/room6-2.jpg'], vacantDays: 0, ownerId: users[2].id }),
      this.roomRepo.create({ name: '翠苑小区B-201', address: '北京市海淀区翠苑小区B栋201室', area: 45.0, unitType: '一室一厅', status: 'reserved', monthlyRent: 3800, images: ['/images/room7-1.jpg'], vacantDays: 5, ownerId: users[2].id }),
      this.roomRepo.create({ name: '翠苑小区B-202', address: '北京市海淀区翠苑小区B栋202室', area: 70.0, unitType: '两室两厅', status: 'vacant', monthlyRent: 5800, images: ['/images/room8-1.jpg', '/images/room8-2.jpg', '/images/room8-3.jpg'], vacantDays: 25, ownerId: users[2].id }),
    ]);

    const appointments = await this.appointmentRepo.save([
      this.appointmentRepo.create({ roomId: rooms[1].id, userId: users[3].id, appointmentTime: new Date('2026-06-20T10:00:00'), duration: 60, purpose: '看房', status: 'pending' }),
      this.appointmentRepo.create({ roomId: rooms[4].id, userId: users[3].id, appointmentTime: new Date('2026-06-21T14:00:00'), duration: 60, purpose: '看房', status: 'confirmed' }),
      this.appointmentRepo.create({ roomId: rooms[7].id, userId: users[3].id, appointmentTime: new Date('2026-06-18T09:00:00'), duration: 60, purpose: '看房', status: 'completed' }),
      this.appointmentRepo.create({ roomId: rooms[1].id, userId: users[3].id, appointmentTime: new Date('2026-06-22T15:00:00'), duration: 60, purpose: '复看', status: 'pending' }),
      this.appointmentRepo.create({ roomId: rooms[4].id, userId: users[3].id, appointmentTime: new Date('2026-06-23T11:00:00'), duration: 60, purpose: '签约洽谈', status: 'confirmed' }),
    ]);

    await this.workOrderRepo.save([
      this.workOrderRepo.create({ roomId: rooms[3].id, userId: users[2].id, title: '水管漏水维修', description: '厨房水管接口处漏水', type: 'repair', priority: 'high', status: 'in_progress', assignedTo: users[4].id }),
      this.workOrderRepo.create({ roomId: rooms[0].id, userId: users[3].id, title: '空调不制冷', description: '卧室空调无法制冷', type: 'repair', priority: 'medium', status: 'pending', assignedTo: users[4].id }),
      this.workOrderRepo.create({ roomId: rooms[5].id, userId: users[2].id, title: '退房清洁', description: '租客退房后需深度清洁', type: 'clean', priority: 'low', status: 'completed', assignedTo: users[4].id, completedAt: new Date() }),
      this.workOrderRepo.create({ roomId: rooms[2].id, userId: users[1].id, title: '门锁更换', description: '大门锁芯损坏需更换', type: 'repair', priority: 'high', status: 'pending', assignedTo: users[4].id }),
    ]);

    const templates = await this.templateRepo.save([
      this.templateRepo.create({
        name: '标准房屋租赁合同',
        content: '本合同由甲方（出租方）与乙方（承租方）就房屋租赁事宜达成如下协议...',
        fields: ['tenantName', 'ownerName', 'roomName', 'rentAmount', 'startDate', 'endDate', 'depositAmount'],
        isActive: true,
      }),
      this.templateRepo.create({
        name: '短期租赁合同',
        content: '本合同适用于短期租赁（3个月以内），双方就短期租赁事宜达成如下协议...',
        fields: ['tenantName', 'ownerName', 'roomName', 'rentAmount', 'startDate', 'endDate'],
        isActive: true,
      }),
      this.templateRepo.create({
        name: '商业用房租赁合同',
        content: '本合同适用于商业用房租赁，双方就商业用房租赁事宜达成如下协议...',
        fields: ['tenantName', 'ownerName', 'roomName', 'businessType', 'rentAmount', 'startDate', 'endDate', 'depositAmount'],
        isActive: false,
      }),
    ]);

    const contracts = await this.contractRepo.save([
      this.contractRepo.create({ roomId: rooms[0].id, tenantId: users[3].id, ownerId: users[1].id, templateId: templates[0].id, contractNumber: 'HT-2026-001', startDate: '2026-01-01', endDate: '2027-01-01', rentAmount: 3000, depositAmount: 6000, paymentCycle: 1, status: 'archived', signedAt: new Date('2025-12-28') }),
      this.contractRepo.create({ roomId: rooms[2].id, tenantId: users[3].id, ownerId: users[1].id, templateId: templates[0].id, contractNumber: 'HT-2026-002', startDate: '2026-03-01', endDate: '2027-03-01', rentAmount: 4500, depositAmount: 9000, paymentCycle: 1, status: 'archived', signedAt: new Date('2026-02-25') }),
      this.contractRepo.create({ roomId: rooms[5].id, tenantId: users[3].id, ownerId: users[2].id, templateId: templates[0].id, contractNumber: 'HT-2026-003', startDate: '2026-06-01', endDate: '2027-06-01', rentAmount: 5000, depositAmount: 10000, paymentCycle: 1, status: 'owner_signed' }),
    ]);

    const rules = await this.ruleRepo.save([
      this.ruleRepo.create({ name: '月租金', projectType: '住宅', cycle: 'monthly', ratio: 1.0, isActive: true }),
      this.ruleRepo.create({ name: '季度租金', projectType: '住宅', cycle: 'quarterly', ratio: 0.95, isActive: true }),
      this.ruleRepo.create({ name: '年度租金', projectType: '住宅', cycle: 'yearly', ratio: 0.9, isActive: true }),
      this.ruleRepo.create({ name: '商业月租金', projectType: '商业', cycle: 'monthly', ratio: 1.2, isActive: true }),
      this.ruleRepo.create({ name: '商业季度租金', projectType: '商业', cycle: 'quarterly', ratio: 1.15, isActive: true }),
      this.ruleRepo.create({ name: '商业年度租金', projectType: '商业', cycle: 'yearly', ratio: 1.1, isActive: false }),
    ]);

    await this.settlementRepo.save([
      this.settlementRepo.create({ contractId: contracts[0].id, ruleId: rules[0].id, amount: 3000, type: 'rent', periodStart: '2026-06-01', periodEnd: '2026-06-30', status: 'approved', approvedBy: users[0].id, approvedAt: new Date() }),
      this.settlementRepo.create({ contractId: contracts[0].id, ruleId: rules[2].id, amount: 50, type: 'utility', periodStart: '2026-06-01', periodEnd: '2026-06-30', status: 'pending' }),
      this.settlementRepo.create({ contractId: contracts[1].id, ruleId: rules[0].id, amount: 4500, type: 'rent', periodStart: '2026-06-01', periodEnd: '2026-06-30', status: 'pending' }),
    ]);

    await this.exceptionRepo.save([
      this.exceptionRepo.create({ sourceType: 'appointment', sourceId: 1, roomId: rooms[3].id, title: '预约冲突：房间当前状态为 maintenance', description: '用户尝试预约维修中的房间', severity: 'high', status: 'open' }),
      this.exceptionRepo.create({ sourceType: 'system', roomId: rooms[3].id, title: '维修超时预警', description: '房间维修工单已超过预计完成时间', severity: 'medium', status: 'in_progress' }),
    ]);

    await this.messageRepo.save([
      this.messageRepo.create({ userId: users[3].id, type: 'sms', title: '租金提醒', content: '您本月租金3000元即将到期，请及时缴纳。', status: 'sent', provider: 'aliyun', providerMessageId: 'sms-001', sentAt: new Date() }),
      this.messageRepo.create({ userId: users[3].id, type: 'wechat', title: '看房预约确认', content: '您预约的看房已确认，时间为6月21日14:00。', status: 'pending', provider: 'wechat_official' }),
      this.messageRepo.create({ userId: users[2].id, type: 'email', title: '维修工单通知', content: '您提交的水管维修工单已受理，维修人员将尽快联系您。', status: 'failed', provider: 'sendgrid', errorMessage: 'Connection timeout', retryCount: 1 }),
    ]);

    await this.paymentRepo.save([
      this.paymentRepo.create({ settlementId: 1, contractId: contracts[0].id, amount: 3000, paymentMethod: 'bank_transfer', paymentChannel: 'icbc', transactionId: 'TXN-20260601-001', status: 'success', paidAt: new Date() }),
      this.paymentRepo.create({ settlementId: 3, contractId: contracts[1].id, amount: 4500, paymentMethod: 'alipay', status: 'pending' }),
      this.paymentRepo.create({ contractId: contracts[0].id, amount: 6000, paymentMethod: 'bank_transfer', paymentChannel: 'icbc', status: 'failed', errorMessage: 'Insufficient funds', retryCount: 1 }),
    ]);

    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const vacantRooms = rooms.filter((r) => r.status === 'vacant');
      const randomFactor = Math.sin(i * 0.5) * 0.2 + 0.8;
      const vacantCount = Math.max(1, Math.floor(vacantRooms.length * randomFactor));

      for (let j = 0; j < Math.min(vacantCount, vacantRooms.length); j++) {
        const room = vacantRooms[j];
        const rate = Number((((j + 1) / rooms.length) * 100 * randomFactor).toFixed(2));
        await this.vacancyStatsRepo.save(
          this.vacancyStatsRepo.create({
            roomId: room.id,
            vacantDays: Math.floor(Math.random() * 15) + 5,
            totalDays: 30,
            vacancyRate: rate,
            statsDate: dateStr,
          }),
        );
      }
    }

    const alertConfig = await this.alertConfigRepo.save(
      this.alertConfigRepo.create({ name: '高空置率预警', alertType: 'vacancy_exceed', thresholdDays: 15, isEnabled: true, notifyRoles: ['admin', 'owner'] }),
    );

    await this.vacancyAlertRepo.save([
      this.vacancyAlertRepo.create({
        roomId: rooms[1].id,
        configId: alertConfig.id,
        alertType: 'vacancy_exceed',
        thresholdDays: 15,
        currentVacantDays: 15,
        status: 'active',
        projectArea: '阳光花园',
        isRead: false,
        vacancyRate: 0.5,
        threshold: 0.3,
      }),
      this.vacancyAlertRepo.create({
        roomId: rooms[7].id,
        configId: alertConfig.id,
        alertType: 'vacancy_exceed',
        thresholdDays: 15,
        currentVacantDays: 25,
        status: 'active',
        projectArea: '翠苑小区',
        isRead: false,
        vacancyRate: 0.8333,
        threshold: 0.3,
      }),
      this.vacancyAlertRepo.create({
        roomId: rooms[4].id,
        configId: alertConfig.id,
        alertType: 'vacancy_exceed',
        thresholdDays: 15,
        currentVacantDays: 10,
        status: 'read',
        projectArea: '翠苑小区',
        isRead: true,
        vacancyRate: 0.3333,
        threshold: 0.3,
        readAt: new Date(Date.now() - 86400000),
      }),
    ]);

    await this.slotConfigRepo.save([
      this.slotConfigRepo.create({ dayOfWeek: 1, startTime: '09:00', endTime: '18:00', interval: 60, isActive: true }),
      this.slotConfigRepo.create({ dayOfWeek: 2, startTime: '09:00', endTime: '18:00', interval: 60, isActive: true }),
      this.slotConfigRepo.create({ dayOfWeek: 3, startTime: '09:00', endTime: '18:00', interval: 60, isActive: true }),
      this.slotConfigRepo.create({ dayOfWeek: 4, startTime: '09:00', endTime: '18:00', interval: 60, isActive: true }),
      this.slotConfigRepo.create({ dayOfWeek: 5, startTime: '09:00', endTime: '18:00', interval: 60, isActive: true }),
      this.slotConfigRepo.create({ dayOfWeek: 6, startTime: '10:00', endTime: '16:00', interval: 90, isActive: true }),
      this.slotConfigRepo.create({ dayOfWeek: 0, startTime: '10:00', endTime: '16:00', interval: 90, isActive: true }),
    ]);

    await this.workflowNodeRepo.save([
      this.workflowNodeRepo.create({ processType: 'contract', nodeName: '提交申请', nodeOrder: 1, approverRole: null, isRequired: true, isActive: true }),
      this.workflowNodeRepo.create({ processType: 'contract', nodeName: '房东审批', nodeOrder: 2, approverRole: 'owner', isRequired: true, isActive: true }),
      this.workflowNodeRepo.create({ processType: 'contract', nodeName: '租客确认', nodeOrder: 3, approverRole: 'tenant', isRequired: true, isActive: true }),
      this.workflowNodeRepo.create({ processType: 'contract', nodeName: '管理员审核', nodeOrder: 4, approverRole: 'admin', isRequired: false, isActive: true }),
      this.workflowNodeRepo.create({ processType: 'contract', nodeName: '完成签约', nodeOrder: 5, approverRole: null, isRequired: true, isActive: true }),
      this.workflowNodeRepo.create({ processType: 'settlement', nodeName: '提交结算', nodeOrder: 1, approverRole: null, isRequired: true, isActive: true }),
      this.workflowNodeRepo.create({ processType: 'settlement', nodeName: '财务审核', nodeOrder: 2, approverRole: 'admin', isRequired: true, isActive: true }),
      this.workflowNodeRepo.create({ processType: 'settlement', nodeName: '完成结算', nodeOrder: 3, approverRole: null, isRequired: true, isActive: true }),
      this.workflowNodeRepo.create({ processType: 'appointment', nodeName: '提交预约', nodeOrder: 1, approverRole: null, isRequired: true, isActive: true }),
      this.workflowNodeRepo.create({ processType: 'appointment', nodeName: '房东确认', nodeOrder: 2, approverRole: 'owner', isRequired: true, isActive: true }),
      this.workflowNodeRepo.create({ processType: 'appointment', nodeName: '完成预约', nodeOrder: 3, approverRole: null, isRequired: true, isActive: true }),
    ]);
  }
}
