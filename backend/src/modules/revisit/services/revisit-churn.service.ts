import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { RevisitChurn } from '../entities/revisit-churn.entity';
import { CreateRevisitChurnDto, UpdateRevisitChurnDto, CloseRevisitChurnDto } from '../dto/revisit-churn.dto';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { OperationLogService } from '../../log/services/operation-log.service';
import { ReminderService } from '../../reminder/services/reminder.service';

@Injectable()
export class RevisitChurnService {
  constructor(
    @InjectRepository(RevisitChurn)
    private readonly revisitChurnRepository: Repository<RevisitChurn>,
    private readonly entityManager: EntityManager,
    private readonly operationLogService: OperationLogService,
    private readonly reminderService: ReminderService,
  ) {}

  async create(dto: CreateRevisitChurnDto, operator: CurrentUserPayload) {
    const churnDays = dto.lastVisitDate && dto.plannedRevisitDate
      ? Math.ceil((new Date(dto.plannedRevisitDate).getTime() - new Date(dto.lastVisitDate).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const revisitChurn = this.revisitChurnRepository.create({
      ...dto,
      clinicId: operator.clinicId,
      lastVisitDate: dto.lastVisitDate ? new Date(dto.lastVisitDate) : undefined,
      plannedRevisitDate: dto.plannedRevisitDate ? new Date(dto.plannedRevisitDate) : undefined,
      churnDays,
      status: 'pending',
      isClosed: false,
      backfillToChargeAccuracy: false,
      createdById: operator.id,
    });

    const saved = await this.revisitChurnRepository.save(revisitChurn);

    const reminder = await this.reminderService.create({
      type: 'revisit',
      relatedId: saved.id,
      patientId: saved.patientId,
      title: `复诊流失处理提醒`,
      content: `患者复诊流失，需要及时跟进处理`,
      priority: 'high',
      assignedToId: dto.assignedToId || operator.id,
    }, operator);

    await this.operationLogService.createLog({
      module: '复诊流失管理',
      action: '创建复诊流失记录',
      targetType: 'RevisitChurn',
      targetId: saved.id,
      newValue: { patientId: dto.patientId, churnType: dto.churnType },
      user: operator,
    });

    return saved;
  }

  async findAll(params: {
    page?: number;
    pageSize?: number;
    clinicId?: string;
    patientId?: string;
    status?: string;
    churnType?: string;
    assignedToId?: string;
    isClosed?: boolean;
    startDate?: string;
    endDate?: string;
  }) {
    const { page = 1, pageSize = 20, ...filters } = params;
    const queryBuilder = this.revisitChurnRepository
      .createQueryBuilder('revisitChurn')
      .leftJoinAndSelect('revisitChurn.patient', 'patient')
      .leftJoinAndSelect('revisitChurn.lastAppointment', 'lastAppointment')
      .leftJoinAndSelect('revisitChurn.assignedTo', 'assignedTo')
      .leftJoinAndSelect('revisitChurn.handler', 'handler')
      .leftJoinAndSelect('revisitChurn.closedBy', 'closedBy')
      .leftJoinAndSelect('revisitChurn.createdBy', 'createdBy');

    if (filters.clinicId) {
      queryBuilder.andWhere('revisitChurn.clinic_id = :clinicId', { clinicId: filters.clinicId });
    }
    if (filters.patientId) {
      queryBuilder.andWhere('revisitChurn.patient_id = :patientId', { patientId: filters.patientId });
    }
    if (filters.status) {
      queryBuilder.andWhere('revisitChurn.status = :status', { status: filters.status });
    }
    if (filters.churnType) {
      queryBuilder.andWhere('revisitChurn.churn_type = :churnType', { churnType: filters.churnType });
    }
    if (filters.assignedToId) {
      queryBuilder.andWhere('revisitChurn.assigned_to = :assignedToId', { assignedToId: filters.assignedToId });
    }
    if (filters.isClosed !== undefined) {
      queryBuilder.andWhere('revisitChurn.is_closed = :isClosed', { isClosed: filters.isClosed });
    }
    if (filters.startDate) {
      queryBuilder.andWhere('revisitChurn.created_at >= :startDate', { startDate: new Date(filters.startDate) });
    }
    if (filters.endDate) {
      queryBuilder.andWhere('revisitChurn.created_at <= :endDate', { endDate: new Date(filters.endDate) });
    }

    const [items, total] = await queryBuilder
      .orderBy('revisitChurn.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { items, total, page, pageSize };
  }

  async findOne(id: string) {
    const revisitChurn = await this.revisitChurnRepository.findOne({
      where: { id },
      relations: ['patient', 'lastAppointment', 'assignedTo', 'handler', 'closedBy', 'createdBy', 'chargeAccuracy'],
    });
    if (!revisitChurn) {
      throw new NotFoundException('复诊流失记录不存在');
    }
    return revisitChurn;
  }

  async update(id: string, dto: UpdateRevisitChurnDto, operator: CurrentUserPayload) {
    const revisitChurn = await this.revisitChurnRepository.findOne({ where: { id } });
    if (!revisitChurn) {
      throw new NotFoundException('复诊流失记录不存在');
    }

    if (revisitChurn.isClosed) {
      throw new BadRequestException('已关闭的复诊流失记录不能修改');
    }

    const oldValue = { status: revisitChurn.status, handleResult: revisitChurn.handleResult };

    if (dto.status !== undefined) revisitChurn.status = dto.status;
    if (dto.churnType !== undefined) revisitChurn.churnType = dto.churnType;
    if (dto.handleResult !== undefined) revisitChurn.handleResult = dto.handleResult;
    if (dto.handleNotes !== undefined) revisitChurn.handleNotes = dto.handleNotes;
    if (dto.assignedToId !== undefined) revisitChurn.assignedToId = dto.assignedToId;
    if (dto.handlerId !== undefined) revisitChurn.handlerId = dto.handlerId;
    if (dto.handledAt !== undefined) {
      revisitChurn.handledAt = new Date(dto.handledAt);
    } else if (dto.status === 'completed' && !revisitChurn.handledAt) {
      revisitChurn.handledAt = new Date();
      revisitChurn.handlerId = operator.id;
    }

    const saved = await this.revisitChurnRepository.save(revisitChurn);

    await this.operationLogService.createLog({
      module: '复诊流失管理',
      action: '更新复诊流失记录',
      targetType: 'RevisitChurn',
      targetId: id,
      oldValue,
      newValue: dto,
      user: operator,
    });

    return saved;
  }

  async handle(id: string, dto: { handleResult: string; handleNotes?: string }, operator: CurrentUserPayload) {
    const revisitChurn = await this.revisitChurnRepository.findOne({ where: { id } });
    if (!revisitChurn) {
      throw new NotFoundException('复诊流失记录不存在');
    }

    if (revisitChurn.isClosed) {
      throw new BadRequestException('已关闭的复诊流失记录不能处理');
    }

    const oldValue = { status: revisitChurn.status, handlerId: revisitChurn.handlerId };

    revisitChurn.status = 'processing';
    revisitChurn.handlerId = operator.id;
    revisitChurn.handledAt = new Date();
    revisitChurn.handleResult = dto.handleResult;
    revisitChurn.handleNotes = dto.handleNotes;

    const saved = await this.revisitChurnRepository.save(revisitChurn);

    await this.operationLogService.createLog({
      module: '复诊流失管理',
      action: '处理复诊流失',
      targetType: 'RevisitChurn',
      targetId: id,
      oldValue,
      newValue: { status: 'processing', handleResult: dto.handleResult },
      user: operator,
    });

    return saved;
  }

  async close(id: string, dto: CloseRevisitChurnDto, operator: CurrentUserPayload) {
    const revisitChurn = await this.revisitChurnRepository.findOne({ where: { id } });
    if (!revisitChurn) {
      throw new NotFoundException('复诊流失记录不存在');
    }

    if (revisitChurn.isClosed) {
      throw new BadRequestException('复诊流失记录已关闭');
    }

    const oldValue = { isClosed: revisitChurn.isClosed, status: revisitChurn.status };

    revisitChurn.status = 'completed';
    revisitChurn.isClosed = true;
    revisitChurn.closedById = operator.id;
    revisitChurn.closedAt = new Date();
    revisitChurn.handleResult = dto.handleResult;
    revisitChurn.handleNotes = dto.handleNotes;
    revisitChurn.handlerId = revisitChurn.handlerId || operator.id;
    revisitChurn.handledAt = revisitChurn.handledAt || new Date();

    if (dto.backfillToChargeAccuracy) {
      await this.backfillToChargeAccuracy(revisitChurn, operator);
      revisitChurn.backfillToChargeAccuracy = true;
    }

    const saved = await this.revisitChurnRepository.save(revisitChurn);

    await this.operationLogService.createLog({
      module: '复诊流失管理',
      action: '关闭复诊流失记录',
      targetType: 'RevisitChurn',
      targetId: id,
      oldValue,
      newValue: { isClosed: true, status: 'completed', backfillToChargeAccuracy: dto.backfillToChargeAccuracy },
      user: operator,
    });

    return saved;
  }

  private async backfillToChargeAccuracy(revisitChurn: RevisitChurn, operator: CurrentUserPayload) {
    const lastCharge = await this.entityManager
      .createQueryBuilder('charges', 'charge')
      .where('charge.patient_id = :patientId', { patientId: revisitChurn.patientId })
      .andWhere('charge.clinic_id = :clinicId', { clinicId: revisitChurn.clinicId })
      .orderBy('charge.created_at', 'DESC')
      .getRawOne();

    if (!lastCharge) {
      throw new BadRequestException('未找到该患者的收费记录，无法回填');
    }

    let chargeAccuracy = await this.entityManager
      .createQueryBuilder('charge_accuracy', 'ca')
      .where('ca.charge_id = :chargeId', { chargeId: lastCharge.charge_id })
      .getRawOne();

    if (!chargeAccuracy) {
      chargeAccuracy = await this.entityManager
        .createQueryBuilder()
        .insert()
        .into('charge_accuracy')
        .values({
          chargeId: lastCharge.charge_id,
          prescriptionId: lastCharge.charge_prescription_id,
          patientId: lastCharge.charge_patient_id,
          clinicId: lastCharge.charge_clinic_id,
          isAccurate: false,
          checkedAmount: lastCharge.charge_actual_amount,
          systemAmount: lastCharge.charge_actual_amount,
          differenceAmount: 0,
        })
        .returning('*')
        .execute()
        .then(result => result.raw[0]);
    } else {
      await this.entityManager
        .createQueryBuilder()
        .update('charge_accuracy')
        .set({
          isRevisitBackfill: true,
          revisitChurnId: revisitChurn.id,
          accuracyNotes: `复诊流失回填：${revisitChurn.handleResult || ''}。${revisitChurn.handleNotes || ''}`,
          completedById: operator.id,
          completedAt: new Date(),
        })
        .where('id = :id', { id: chargeAccuracy.ca_id })
        .execute();

      chargeAccuracy = await this.entityManager
        .createQueryBuilder('charge_accuracy', 'ca')
        .where('ca.id = :id', { id: chargeAccuracy.ca_id })
        .getRawOne();
    }

    const accuracyId = chargeAccuracy.ca_id || chargeAccuracy.id;
    revisitChurn.chargeAccuracyId = accuracyId;

    await this.operationLogService.createLog({
      module: '复诊流失管理',
      action: '回填收费准确报表',
      targetType: 'ChargeAccuracy',
      targetId: accuracyId,
      newValue: {
        chargeId: lastCharge.charge_id,
        isRevisitBackfill: true,
        revisitChurnId: revisitChurn.id,
      },
      user: operator,
    });
  }

  async getStats(clinicId: string) {
    const totalCount = await this.revisitChurnRepository.count({
      where: { clinicId },
    });

    const pendingCount = await this.revisitChurnRepository.count({
      where: { clinicId, status: 'pending', isClosed: false },
    });

    const processingCount = await this.revisitChurnRepository.count({
      where: { clinicId, status: 'processing', isClosed: false },
    });

    const completedCount = await this.revisitChurnRepository.count({
      where: { clinicId, status: 'completed', isClosed: true },
    });

    const backfilledCount = await this.revisitChurnRepository.count({
      where: { clinicId, backfillToChargeAccuracy: true },
    });

    return {
      total: totalCount,
      pending: pendingCount,
      processing: processingCount,
      completed: completedCount,
      backfilled: backfilledCount,
    };
  }
}
