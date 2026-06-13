import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FollowUpTask } from '../entities/follow-up-task.entity';
import { CreateFollowUpTaskDto, UpdateFollowUpTaskDto } from '../dto/follow-up.dto';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { OperationLogService } from '../../log/services/operation-log.service';
import { ReminderService } from '../../reminder/services/reminder.service';

@Injectable()
export class FollowUpService {
  constructor(
    @InjectRepository(FollowUpTask)
    private readonly followUpRepository: Repository<FollowUpTask>,
    private readonly operationLogService: OperationLogService,
    private readonly reminderService: ReminderService,
  ) {}

  async create(dto: CreateFollowUpTaskDto, operator: CurrentUserPayload) {
    const followUp = this.followUpRepository.create({
      ...dto,
      clinicId: operator.clinicId,
      planDate: new Date(dto.planDate),
      status: 'pending',
      createdById: operator.id,
    });

    const saved = await this.followUpRepository.save(followUp);

    const reminder = await this.reminderService.createFromFollowUp(saved, operator);
    saved.reminderTaskId = reminder.id;
    await this.followUpRepository.save(saved);

    await this.operationLogService.createLog({
      module: '随访管理',
      action: '创建随访',
      targetType: 'FollowUpTask',
      targetId: saved.id,
      newValue: { type: dto.type, planDate: dto.planDate },
      user: operator,
    });

    return saved;
  }

  async findAll(params: {
    page?: number;
    pageSize?: number;
    clinicId?: string;
    patientId?: string;
    doctorId?: string;
    status?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { page = 1, pageSize = 20, ...filters } = params;
    const queryBuilder = this.followUpRepository
      .createQueryBuilder('followUp')
      .leftJoinAndSelect('followUp.patient', 'patient')
      .leftJoinAndSelect('followUp.doctor', 'doctor')
      .leftJoinAndSelect('followUp.appointment', 'appointment')
      .leftJoinAndSelect('followUp.createdBy', 'createdBy');

    if (filters.clinicId) {
      queryBuilder.andWhere('followUp.clinic_id = :clinicId', { clinicId: filters.clinicId });
    }
    if (filters.patientId) {
      queryBuilder.andWhere('followUp.patient_id = :patientId', { patientId: filters.patientId });
    }
    if (filters.doctorId) {
      queryBuilder.andWhere('followUp.doctor_id = :doctorId', { doctorId: filters.doctorId });
    }
    if (filters.status) {
      queryBuilder.andWhere('followUp.status = :status', { status: filters.status });
    }
    if (filters.type) {
      queryBuilder.andWhere('followUp.type = :type', { type: filters.type });
    }
    if (filters.startDate) {
      queryBuilder.andWhere('followUp.plan_date >= :startDate', { startDate: new Date(filters.startDate) });
    }
    if (filters.endDate) {
      queryBuilder.andWhere('followUp.plan_date <= :endDate', { endDate: new Date(filters.endDate) });
    }

    const [items, total] = await queryBuilder
      .orderBy('followUp.plan_date', 'ASC')
      .addOrderBy('followUp.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { items, total, page, pageSize };
  }

  async findOne(id: string) {
    const followUp = await this.followUpRepository.findOne({
      where: { id },
      relations: ['patient', 'doctor', 'appointment', 'createdBy', 'reminderTask'],
    });
    if (!followUp) {
      throw new NotFoundException('随访任务不存在');
    }
    return followUp;
  }

  async update(id: string, dto: UpdateFollowUpTaskDto, operator: CurrentUserPayload) {
    const followUp = await this.followUpRepository.findOne({ where: { id } });
    if (!followUp) {
      throw new NotFoundException('随访任务不存在');
    }

    const oldValue = { status: followUp.status, result: followUp.result };

    if (dto.status !== undefined) followUp.status = dto.status;
    if (dto.type !== undefined) followUp.type = dto.type;
    if (dto.content !== undefined) followUp.content = dto.content;
    if (dto.planDate !== undefined) followUp.planDate = new Date(dto.planDate);
    if (dto.actualDate !== undefined) followUp.actualDate = new Date(dto.actualDate);
    if (dto.result !== undefined) followUp.result = dto.result;
    if (dto.feedback !== undefined) followUp.feedback = dto.feedback;

    if (dto.status === 'completed') {
      followUp.actualDate = followUp.actualDate || new Date();
    }

    const saved = await this.followUpRepository.save(followUp);

    await this.operationLogService.createLog({
      module: '随访管理',
      action: '更新随访',
      targetType: 'FollowUpTask',
      targetId: id,
      oldValue,
      newValue: dto,
      user: operator,
    });

    return saved;
  }

  async complete(id: string, dto: { result: string; feedback?: string }, operator: CurrentUserPayload) {
    const followUp = await this.followUpRepository.findOne({ where: { id } });
    if (!followUp) {
      throw new NotFoundException('随访任务不存在');
    }

    const oldValue = { status: followUp.status };

    followUp.status = 'completed';
    followUp.actualDate = new Date();
    followUp.result = dto.result;
    followUp.feedback = dto.feedback;

    const saved = await this.followUpRepository.save(followUp);

    await this.operationLogService.createLog({
      module: '随访管理',
      action: '完成随访',
      targetType: 'FollowUpTask',
      targetId: id,
      oldValue,
      newValue: { status: 'completed', result: dto.result },
      user: operator,
    });

    return saved;
  }

  async getPendingCount(clinicId: string) {
    const count = await this.followUpRepository.count({
      where: {
        clinicId,
        status: 'pending',
      },
    });
    const overdueCount = await this.followUpRepository
      .createQueryBuilder('followUp')
      .where('followUp.clinic_id = :clinicId', { clinicId })
      .andWhere('followUp.status = :status', { status: 'pending' })
      .andWhere('followUp.plan_date < :today', { today: new Date() })
      .getCount();

    return { total: count, overdue: overdueCount };
  }
}
