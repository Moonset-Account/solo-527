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
      this.roomRepo.create({ roomNumber: 'A-101', building: 'A栋', floor: 1, unit: '1单元', area: 35.5, rentPrice: 3000, deposit: 6000, status: 'rented', description: '精装一居室' }),
      this.roomRepo.create({ roomNumber: 'A-102', building: 'A栋', floor: 1, unit: '1单元', area: 42.0, rentPrice: 3500, deposit: 7000, status: 'vacant', description: '精装一室一厅' }),
      this.roomRepo.create({ roomNumber: 'A-201', building: 'A栋', floor: 2, unit: '1单元', area: 55.0, rentPrice: 4500, deposit: 9000, status: 'rented', description: '精装两室一厅' }),
      this.roomRepo.create({ roomNumber: 'A-202', building: 'A栋', floor: 2, unit: '1单元', area: 50.0, rentPrice: 4200, deposit: 8400, status: 'maintenance', description: '简装两室一厅，维修中' }),
      this.roomRepo.create({ roomNumber: 'B-101', building: 'B栋', floor: 1, unit: '1单元', area: 38.0, rentPrice: 3200, deposit: 6400, status: 'vacant', description: '精装一居室' }),
      this.roomRepo.create({ roomNumber: 'B-102', building: 'B栋', floor: 1, unit: '1单元', area: 60.0, rentPrice: 5000, deposit: 10000, status: 'rented', description: '精装两室一厅' }),
      this.roomRepo.create({ roomNumber: 'B-201', building: 'B栋', floor: 2, unit: '1单元', area: 45.0, rentPrice: 3800, deposit: 7600, status: 'reserved', description: '精装一室一厅，已预留' }),
      this.roomRepo.create({ roomNumber: 'B-202', building: 'B栋', floor: 2, unit: '1单元', area: 70.0, rentPrice: 5800, deposit: 11600, status: 'vacant', description: '豪华两室两厅' }),
    ]);

    const appointments = await this.appointmentRepo.save([
      this.appointmentRepo.create({ roomId: rooms[1].id, userId: users[3].id, appointmentTime: new Date('2026-06-20T10:00:00'), duration: 60, purpose: '看房', status: 'pending' }),
      this.appointmentRepo.create({ roomId: rooms[4].id, userId: users[3].id, appointmentTime: new Date('2026-06-21T14:00:00'), duration: 60, purpose: '看房', status: 'confirmed' }),
      this.appointmentRepo.create({ roomId: rooms[7].id, userId: users[3].id, appointmentTime: new Date('2026-06-18T09:00:00'), duration: 60, purpose: '看房', status: 'completed' }),
    ]);

    await this.workOrderRepo.save([
      this.workOrderRepo.create({ roomId: rooms[3].id, userId: users[2].id, title: '水管漏水维修', description: '厨房水管接口处漏水', type: 'repair', priority: 'high', status: 'in_progress', assignedTo: users[4].id }),
      this.workOrderRepo.create({ roomId: rooms[0].id, userId: users[3].id, title: '空调不制冷', description: '卧室空调无法制冷', type: 'repair', priority: 'medium', status: 'pending', assignedTo: users[4].id }),
      this.workOrderRepo.create({ roomId: rooms[5].id, userId: users[2].id, title: '退房清洁', description: '租客退房后需深度清洁', type: 'clean', priority: 'low', status: 'completed', assignedTo: users[4].id, completedAt: new Date() }),
    ]);

    const template = await this.templateRepo.save(
      this.templateRepo.create({ name: '标准房屋租赁合同', content: '本合同由甲方（出租方）与乙方（承租方）就房屋租赁事宜达成如下协议...', version: '2.0', status: 'active' }),
    );

    const contracts = await this.contractRepo.save([
      this.contractRepo.create({ roomId: rooms[0].id, tenantId: users[3].id, ownerId: users[1].id, templateId: template.id, contractNumber: 'HT-2026-001', startDate: '2026-01-01', endDate: '2027-01-01', rentAmount: 3000, depositAmount: 6000, paymentCycle: 1, status: 'archived', signedAt: new Date('2025-12-28') }),
      this.contractRepo.create({ roomId: rooms[2].id, tenantId: users[3].id, ownerId: users[1].id, templateId: template.id, contractNumber: 'HT-2026-002', startDate: '2026-03-01', endDate: '2027-03-01', rentAmount: 4500, depositAmount: 9000, paymentCycle: 1, status: 'archived', signedAt: new Date('2026-02-25') }),
      this.contractRepo.create({ roomId: rooms[5].id, tenantId: users[3].id, ownerId: users[2].id, templateId: template.id, contractNumber: 'HT-2026-003', startDate: '2026-06-01', endDate: '2027-06-01', rentAmount: 5000, depositAmount: 10000, paymentCycle: 1, status: 'owner_signed' }),
    ]);

    const rules = await this.ruleRepo.save([
      this.ruleRepo.create({ name: '月租金', type: 'rent', amount: 0, calculationMethod: 'contract_rent', description: '按合同月租金计算', status: 'active' }),
      this.ruleRepo.create({ name: '押金', type: 'deposit', amount: 0, calculationMethod: 'contract_deposit', description: '按合同押金金额', status: 'active' }),
      this.ruleRepo.create({ name: '水费', type: 'utility', amount: 5, calculationMethod: 'per_unit', description: '按用水量5元/吨', status: 'active' }),
      this.ruleRepo.create({ name: '电费', type: 'utility', amount: 0.8, calculationMethod: 'per_unit', description: '按用电量0.8元/度', status: 'active' }),
    ]);

    await this.settlementRepo.save([
      this.settlementRepo.create({ contractId: contracts[0].id, ruleId: rules[0].id, amount: 3000, type: 'rent', periodStart: '2026-06-01', periodEnd: '2026-06-30', status: 'approved', approvedBy: users[0].id, approvedAt: new Date() }),
      this.settlementRepo.create({ contractId: contracts[0].id, ruleId: rules[2].id, amount: 50, type: 'utility', periodStart: '2026-06-01', periodEnd: '2026-06-30', status: 'pending' }),
      this.settlementRepo.create({ contractId: contracts[1].id, ruleId: rules[0].id, amount: 4500, type: 'rent', periodStart: '2026-06-01', periodEnd: '2026-06-30', status: 'pending' }),
    ]);

    await this.exceptionRepo.save([
      this.exceptionRepo.create({ sourceType: 'appointment', sourceId: 1, roomId: rooms[3].id, title: '预约冲突：房间 A-202 当前状态为 maintenance', description: '用户尝试预约维修中的房间', severity: 'high', status: 'open' }),
      this.exceptionRepo.create({ sourceType: 'system', roomId: rooms[3].id, title: '维修超时预警', description: '房间A-202维修工单已超过预计完成时间', severity: 'medium', status: 'in_progress' }),
    ]);

    await this.messageRepo.save([
      this.messageRepo.create({ userId: users[3].id, type: 'sms', title: '租金提醒', content: '您本月租金3000元即将到期，请及时缴纳。', status: 'sent', provider: 'aliyun', providerMessageId: 'sms-001', sentAt: new Date() }),
      this.messageRepo.create({ userId: users[3].id, type: 'wechat', title: '看房预约确认', content: '您预约的B-101看房已确认，时间为6月21日14:00。', status: 'pending', provider: 'wechat_official' }),
      this.messageRepo.create({ userId: users[2].id, type: 'email', title: '维修工单通知', content: '您提交的A-202水管维修工单已受理，维修人员将尽快联系您。', status: 'failed', provider: 'sendgrid', errorMessage: 'Connection timeout', retryCount: 1 }),
    ]);

    await this.paymentRepo.save([
      this.paymentRepo.create({ settlementId: 1, contractId: contracts[0].id, amount: 3000, paymentMethod: 'bank_transfer', paymentChannel: 'icbc', transactionId: 'TXN-20260601-001', status: 'success', paidAt: new Date() }),
      this.paymentRepo.create({ settlementId: 3, contractId: contracts[1].id, amount: 4500, paymentMethod: 'alipay', status: 'pending' }),
      this.paymentRepo.create({ contractId: contracts[0].id, amount: 6000, paymentMethod: 'bank_transfer', paymentChannel: 'icbc', status: 'failed', errorMessage: 'Insufficient funds', retryCount: 1 }),
    ]);

    const today = new Date().toISOString().split('T')[0];
    await this.vacancyStatsRepo.save([
      this.vacancyStatsRepo.create({ roomId: rooms[1].id, vacantDays: 15, totalDays: 30, vacancyRate: 50.0, statsDate: today }),
      this.vacancyStatsRepo.create({ roomId: rooms[4].id, vacantDays: 10, totalDays: 30, vacancyRate: 33.33, statsDate: today }),
      this.vacancyStatsRepo.create({ roomId: rooms[7].id, vacantDays: 25, totalDays: 30, vacancyRate: 83.33, statsDate: today }),
    ]);

    const alertConfig = await this.alertConfigRepo.save(
      this.alertConfigRepo.create({ name: '高空置率预警', alertType: 'vacancy_exceed', thresholdDays: 15, isEnabled: true, notifyRoles: ['admin', 'owner'] }),
    );

    await this.vacancyAlertRepo.save([
      this.vacancyAlertRepo.create({ roomId: rooms[1].id, configId: alertConfig.id, alertType: 'vacancy_exceed', thresholdDays: 15, currentVacantDays: 15, status: 'active' }),
      this.vacancyAlertRepo.create({ roomId: rooms[7].id, configId: alertConfig.id, alertType: 'vacancy_exceed', thresholdDays: 15, currentVacantDays: 25, status: 'active' }),
    ]);

    await this.slotConfigRepo.save([
      this.slotConfigRepo.create({ name: '工作日看房时段', startTime: '09:00', endTime: '18:00', intervalMinutes: 60, maxAppointments: 3, isEnabled: true }),
      this.slotConfigRepo.create({ name: '周末看房时段', startTime: '10:00', endTime: '16:00', intervalMinutes: 90, maxAppointments: 5, isEnabled: true }),
    ]);

    await this.workflowNodeRepo.save([
      this.workflowNodeRepo.create({ name: '提交申请', workflowType: 'contract_sign', nodeType: 'start', nodeKey: 'submit', orderNum: 1, isEnabled: true }),
      this.workflowNodeRepo.create({ name: '房东审批', workflowType: 'contract_sign', nodeType: 'approve', nodeKey: 'owner_approve', config: { approverRole: 'owner' }, orderNum: 2, isEnabled: true }),
      this.workflowNodeRepo.create({ name: '租客确认', workflowType: 'contract_sign', nodeType: 'approve', nodeKey: 'tenant_confirm', config: { approverRole: 'tenant' }, orderNum: 3, isEnabled: true }),
      this.workflowNodeRepo.create({ name: '发送通知', workflowType: 'contract_sign', nodeType: 'notify', nodeKey: 'send_notification', config: { channels: ['sms', 'wechat'] }, orderNum: 4, isEnabled: true }),
      this.workflowNodeRepo.create({ name: '完成签约', workflowType: 'contract_sign', nodeType: 'end', nodeKey: 'complete', orderNum: 5, isEnabled: true }),
    ]);
  }
}
