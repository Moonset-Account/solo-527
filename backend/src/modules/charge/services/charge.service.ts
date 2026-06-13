import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Charge } from '../entities/charge.entity';
import { ChargeItem } from '../entities/charge-item.entity';
import { ChargeAccuracy } from '../entities/charge-accuracy.entity';
import { CreateChargeDto, PayChargeDto, CheckChargeDto, ChargeListQueryDto } from '../dto/charge.dto';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { OperationLogService } from '../../log/services/operation-log.service';
import { PrescriptionService } from '../../prescription/services/prescription.service';

@Injectable()
export class ChargeService {
  constructor(
    @InjectRepository(Charge)
    private readonly chargeRepository: Repository<Charge>,
    @InjectRepository(ChargeItem)
    private readonly chargeItemRepository: Repository<ChargeItem>,
    @InjectRepository(ChargeAccuracy)
    private readonly chargeAccuracyRepository: Repository<ChargeAccuracy>,
    private readonly operationLogService: OperationLogService,
    private readonly prescriptionService: PrescriptionService,
  ) {}

  async create(dto: CreateChargeDto, operator: CurrentUserPayload) {
    const charge = this.chargeRepository.create({
      ...dto,
      clinicId: operator.clinicId,
      createdById: operator.id,
    });

    const saved = await this.chargeRepository.save(charge);

    await this.operationLogService.createLog({
      module: '收费管理',
      action: '创建收费单',
      targetType: 'Charge',
      targetId: saved.id,
      newValue: { patientId: dto.patientId, actualAmount: dto.actualAmount },
      user: operator,
    });

    return saved;
  }

  async findAll(query: ChargeListQueryDto, clinicId?: string) {
    const { page = 1, pageSize = 20, ...filters } = query;
    const queryBuilder = this.chargeRepository
      .createQueryBuilder('charge')
      .leftJoinAndSelect('charge.patient', 'patient')
      .leftJoinAndSelect('charge.prescription', 'prescription')
      .leftJoinAndSelect('charge.createdBy', 'createdBy')
      .leftJoinAndSelect('charge.checkedBy', 'checkedBy');

    if (clinicId) {
      queryBuilder.andWhere('charge.clinic_id = :clinicId', { clinicId });
    }
    if (filters.patientId) {
      queryBuilder.andWhere('charge.patient_id = :patientId', { patientId: filters.patientId });
    }
    if (filters.status) {
      queryBuilder.andWhere('charge.status = :status', { status: filters.status });
    }
    if (filters.isChecked !== undefined) {
      queryBuilder.andWhere('charge.is_checked = :isChecked', { isChecked: filters.isChecked === 'true' });
    }
    if (filters.startDate) {
      queryBuilder.andWhere('charge.created_at >= :startDate', { startDate: new Date(filters.startDate) });
    }
    if (filters.endDate) {
      queryBuilder.andWhere('charge.created_at <= :endDate', { endDate: new Date(filters.endDate) });
    }

    const [items, total] = await queryBuilder
      .orderBy('charge.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { items, total, page, pageSize };
  }

  async findOne(id: string) {
    const charge = await this.chargeRepository.findOne({
      where: { id },
      relations: ['patient', 'prescription', 'prescription.items', 'prescription.items.chargeItem', 'createdBy', 'checkedBy'],
    });
    if (!charge) {
      throw new NotFoundException('收费单不存在');
    }
    return charge;
  }

  async pay(id: string, dto: PayChargeDto, operator: CurrentUserPayload) {
    const charge = await this.chargeRepository.findOne({ where: { id } });
    if (!charge) {
      throw new NotFoundException('收费单不存在');
    }

    if (charge.status === 'refunded') {
      throw new BadRequestException('该收费单已退费，无法支付');
    }

    charge.paidAmount = (charge.paidAmount || 0) + dto.paidAmount;
    charge.paymentMethod = dto.paymentMethod;

    if (charge.paidAmount >= charge.actualAmount) {
      charge.status = 'paid';
    } else if (charge.paidAmount > 0) {
      charge.status = 'partial';
    }

    const saved = await this.chargeRepository.save(charge);

    if (charge.prescriptionId && saved.status === 'paid') {
      await this.prescriptionService.update(charge.prescriptionId, { status: 'charged' }, operator);
    }

    await this.createChargeAccuracyRecord(saved, operator);

    await this.operationLogService.createLog({
      module: '收费管理',
      action: '收费支付',
      targetType: 'Charge',
      targetId: id,
      newValue: { paidAmount: dto.paidAmount, paymentMethod: dto.paymentMethod },
      user: operator,
    });

    return saved;
  }

  async check(id: string, dto: CheckChargeDto, operator: CurrentUserPayload) {
    const charge = await this.chargeRepository.findOne({ where: { id } });
    if (!charge) {
      throw new NotFoundException('收费单不存在');
    }

    charge.isChecked = true;
    charge.checkedById = operator.id;
    charge.checkedAt = new Date();

    const savedCharge = await this.chargeRepository.save(charge);

    const accuracy = await this.chargeAccuracyRepository.findOne({ where: { chargeId: id } });
    if (accuracy) {
      accuracy.isAccurate = dto.isAccurate;
      accuracy.accuracyNotes = dto.accuracyNotes;
      accuracy.checkedAmount = dto.checkedAmount;
      accuracy.differenceAmount = dto.differenceAmount || 0;
      accuracy.completedById = operator.id;
      accuracy.completedAt = new Date();
      await this.chargeAccuracyRepository.save(accuracy);
    }

    await this.operationLogService.createLog({
      module: '收费管理',
      action: '收费核对',
      targetType: 'Charge',
      targetId: id,
      newValue: dto,
      user: operator,
    });

    return savedCharge;
  }

  async createChargeAccuracyRecord(charge: Charge, operator: CurrentUserPayload) {
    const existing = await this.chargeAccuracyRepository.findOne({ where: { chargeId: charge.id } });
    if (existing) return existing;

    const accuracy = this.chargeAccuracyRepository.create({
      chargeId: charge.id,
      prescriptionId: charge.prescriptionId,
      patientId: charge.patientId,
      clinicId: charge.clinicId,
      isAccurate: false,
      checkedAmount: charge.actualAmount,
      systemAmount: charge.actualAmount,
      differenceAmount: 0,
    });

    return await this.chargeAccuracyRepository.save(accuracy);
  }

  async findChargeItems(clinicId?: string, category?: string) {
    const queryBuilder = this.chargeItemRepository
      .createQueryBuilder('item')
      .where('item.is_active = true');

    if (clinicId) {
      queryBuilder.andWhere('(item.clinic_id = :clinicId OR item.clinic_id IS NULL)', { clinicId });
    }
    if (category) {
      queryBuilder.andWhere('item.category = :category', { category });
    }

    return await queryBuilder.orderBy('item.category', 'ASC').addOrderBy('item.name', 'ASC').getMany();
  }

  async getChargeAccuracyList(params: {
    page?: number;
    pageSize?: number;
    clinicId?: string;
    isAccurate?: boolean;
    isRevisitBackfill?: boolean;
  }) {
    const { page = 1, pageSize = 20, ...filters } = params;
    const queryBuilder = this.chargeAccuracyRepository
      .createQueryBuilder('accuracy')
      .leftJoinAndSelect('accuracy.charge', 'charge')
      .leftJoinAndSelect('accuracy.patient', 'patient')
      .leftJoinAndSelect('accuracy.completedBy', 'completedBy');

    if (filters.clinicId) {
      queryBuilder.andWhere('accuracy.clinic_id = :clinicId', { clinicId: filters.clinicId });
    }
    if (filters.isAccurate !== undefined) {
      queryBuilder.andWhere('accuracy.is_accurate = :isAccurate', { isAccurate: filters.isAccurate });
    }
    if (filters.isRevisitBackfill !== undefined) {
      queryBuilder.andWhere('accuracy.is_revisit_backfill = :isRevisitBackfill', { isRevisitBackfill: filters.isRevisitBackfill });
    }

    const [items, total] = await queryBuilder
      .orderBy('accuracy.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { items, total, page, pageSize };
  }
}
