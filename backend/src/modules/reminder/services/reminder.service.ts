import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReminderTask } from '../entities/reminder-task.entity';
import { CreateReminderTaskDto, UpdateReminderTaskDto } from '../dto/reminder.dto';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { OperationLogService } from '../../log/services/operation-log.service';
import { Appointment } from '../../appointment/entities/appointment.entity';
import { Prescription } from '../../prescription/entities/prescription.entity';
import { FollowUpTask } from '../../followup/entities/follow-up-task.entity';

@Injectable()
export class ReminderService {
  constructor(
    @InjectRepository(ReminderTask)
    private readonly reminderRepository: Repository<ReminderTask>,
    private readonly operationLogService: OperationLogService,
  ) {}

  async createFromAppointment(appointment: Appointment, operator: CurrentUserPayload) {
    const reminder = this.reminderRepository.create({
      type: 'appointment',
      relatedId: appointment.id,
      patientId: appointment.patientId,
      clinicId: operator.clinicId,
      title: `预约提醒 - ${new Date(appointment.slot.date).toLocaleDateString()} ${appointment.slot.startTime}`,
      content: `请提醒患者准时就诊，主诉：${appointment.chiefComplaint}`,
      priority: 'normal',
      status: 'pending',
      dueDate: appointment.slot.date,
      createdById: operator.id,
    });
    return await this.reminderRepository.save(reminder);
  }

  async createFromPrescription(prescription: Prescription, operator: CurrentUserPayload) {
    const reminder = this.reminderRepository.create({
      type: 'prescription',
      relatedId: prescription.id,
      patientId: prescription.patientId,
      clinicId: operator.clinicId,
      title: `处方收费提醒`,
      content: `请提醒患者完成处方缴费，诊断：${prescription.diagnosis}`,
      priority: 'high',
      status: 'pending',
      createdById: operator.id,
    });
    return await this.reminderRepository.save(reminder);
  }

  async createFromFollowUp(followUp: FollowUpTask, operator: CurrentUserPayload) {
    const reminder = this.reminderRepository.create({
      type: 'follow_up',
      relatedId: followUp.id,
      patientId: followUp.patientId,
      clinicId: operator.clinicId,
      title: `随访任务提醒`,
      content: followUp.content,
      priority: 'normal',
      status: 'pending',
      dueDate: followUp.planDate,
      createdById: operator.id,
    });
    return await this.reminderRepository.save(reminder);
  }

  async create(dto: CreateReminderTaskDto, operator: CurrentUserPayload) {
    const reminder = this.reminderRepository.create({
      ...dto,
      clinicId: operator.clinicId,
      createdById: operator.id,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
    });

    const saved = await this.reminderRepository.save(reminder);

    await this.operationLogService.createLog({
      module: '催办管理',
      action: '创建催办',
      targetType: 'ReminderTask',
      targetId: saved.id,
      newValue: { title: dto.title, type: dto.type },
      user: operator,
    });

    return saved;
  }

  async findAll(params: {
    page?: number;
    pageSize?: number;
    clinicId?: string;
    type?: string;
    status?: string;
    priority?: string;
    assignedToId?: string;
  }) {
    const { page = 1, pageSize = 20, ...filters } = params;
    const queryBuilder = this.reminderRepository
      .createQueryBuilder('reminder')
      .leftJoinAndSelect('reminder.patient', 'patient')
      .leftJoinAndSelect('reminder.assignedTo', 'assignedTo');

    if (filters.clinicId) {
      queryBuilder.andWhere('reminder.clinic_id = :clinicId', { clinicId: filters.clinicId });
    }
    if (filters.type) {
      queryBuilder.andWhere('reminder.type = :type', { type: filters.type });
    }
    if (filters.status) {
      queryBuilder.andWhere('reminder.status = :status', { status: filters.status });
    }
    if (filters.priority) {
      queryBuilder.andWhere('reminder.priority = :priority', { priority: filters.priority });
    }
    if (filters.assignedToId) {
      queryBuilder.andWhere('reminder.assigned_to = :assignedToId', { assignedToId: filters.assignedToId });
    }

    const [items, total] = await queryBuilder
      .orderBy('reminder.priority', 'DESC')
      .addOrderBy('reminder.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { items, total, page, pageSize };
  }

  async update(id: string, dto: UpdateReminderTaskDto, operator: CurrentUserPayload) {
    const reminder = await this.reminderRepository.findOne({ where: { id } });
    if (!reminder) {
      throw new NotFoundException('催办任务不存在');
    }

    const oldValue = { status: reminder.status };

    if (dto.status !== undefined) reminder.status = dto.status;
    if (dto.result !== undefined) reminder.result = dto.result;
    if (dto.content !== undefined) reminder.content = dto.content;

    if (dto.status === 'completed') {
      reminder.completedAt = new Date();
      reminder.completedById = operator.id;
    }

    const saved = await this.reminderRepository.save(reminder);

    await this.operationLogService.createLog({
      module: '催办管理',
      action: '处理催办',
      targetType: 'ReminderTask',
      targetId: id,
      oldValue,
      newValue: dto,
      user: operator,
    });

    return saved;
  }

  async findOne(id: string) {
    return await this.reminderRepository.findOne({
      where: { id },
      relations: ['patient', 'assignedTo', 'completedBy'],
    });
  }

  async getPendingCount(clinicId: string) {
    const count = await this.reminderRepository.count({
      where: {
        clinicId,
        status: 'pending',
      },
    });
    const urgentCount = await this.reminderRepository.count({
      where: {
        clinicId,
        status: 'pending',
        priority: 'urgent',
      },
    });
    return { total: count, urgent: urgentCount };
  }
}
