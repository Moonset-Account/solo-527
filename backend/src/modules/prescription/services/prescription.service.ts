import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prescription } from '../entities/prescription.entity';
import { PrescriptionItem } from '../entities/prescription-item.entity';
import { CreatePrescriptionDto, UpdatePrescriptionDto } from '../dto/prescription.dto';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { OperationLogService } from '../../log/services/operation-log.service';
import { ReminderService } from '../../reminder/services/reminder.service';

@Injectable()
export class PrescriptionService {
  constructor(
    @InjectRepository(Prescription)
    private readonly prescriptionRepository: Repository<Prescription>,
    @InjectRepository(PrescriptionItem)
    private readonly prescriptionItemRepository: Repository<PrescriptionItem>,
    private readonly operationLogService: OperationLogService,
    private readonly reminderService: ReminderService,
  ) {}

  async create(dto: CreatePrescriptionDto, operator: CurrentUserPayload) {
    const existing = await this.prescriptionRepository.findOne({
      where: { appointmentId: dto.appointmentId },
    });
    if (existing) {
      throw new BadRequestException('该预约已存在处方');
    }

    const prescription = this.prescriptionRepository.create({
      appointmentId: dto.appointmentId,
      patientId: dto.patientId,
      doctorId: dto.doctorId,
      clinicId: operator.clinicId,
      diagnosis: dto.diagnosis,
      treatmentPlan: dto.treatmentPlan,
      notes: dto.notes,
      createdById: operator.id,
      items: dto.items.map(item => this.prescriptionItemRepository.create(item)),
    });

    const saved = await this.prescriptionRepository.save(prescription);

    await this.reminderService.createFromPrescription(saved, operator);

    await this.operationLogService.createLog({
      module: '处方管理',
      action: '创建处方',
      targetType: 'Prescription',
      targetId: saved.id,
      newValue: { patientId: dto.patientId, diagnosis: dto.diagnosis },
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
  }) {
    const { page = 1, pageSize = 20, ...filters } = params;
    const queryBuilder = this.prescriptionRepository
      .createQueryBuilder('prescription')
      .leftJoinAndSelect('prescription.patient', 'patient')
      .leftJoinAndSelect('prescription.doctor', 'doctor')
      .leftJoinAndSelect('doctor.user', 'doctorUser')
      .leftJoinAndSelect('prescription.items', 'items')
      .leftJoinAndSelect('items.chargeItem', 'chargeItem');

    if (filters.clinicId) {
      queryBuilder.andWhere('prescription.clinic_id = :clinicId', { clinicId: filters.clinicId });
    }
    if (filters.patientId) {
      queryBuilder.andWhere('prescription.patient_id = :patientId', { patientId: filters.patientId });
    }
    if (filters.doctorId) {
      queryBuilder.andWhere('prescription.doctor_id = :doctorId', { doctorId: filters.doctorId });
    }
    if (filters.status) {
      queryBuilder.andWhere('prescription.status = :status', { status: filters.status });
    }

    const [items, total] = await queryBuilder
      .orderBy('prescription.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { items, total, page, pageSize };
  }

  async findOne(id: string) {
    const prescription = await this.prescriptionRepository.findOne({
      where: { id },
      relations: ['patient', 'doctor', 'doctor.user', 'items', 'items.chargeItem', 'appointment'],
    });
    if (!prescription) {
      throw new NotFoundException('处方不存在');
    }
    return prescription;
  }

  async update(id: string, dto: UpdatePrescriptionDto, operator: CurrentUserPayload) {
    const prescription = await this.prescriptionRepository.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!prescription) {
      throw new NotFoundException('处方不存在');
    }

    if (dto.diagnosis !== undefined) prescription.diagnosis = dto.diagnosis;
    if (dto.treatmentPlan !== undefined) prescription.treatmentPlan = dto.treatmentPlan;
    if (dto.notes !== undefined) prescription.notes = dto.notes;
    if (dto.status !== undefined) prescription.status = dto.status;

    if (dto.items) {
      await this.prescriptionItemRepository.delete({ prescriptionId: id });
      prescription.items = dto.items.map(item =>
        this.prescriptionItemRepository.create({ ...item, prescriptionId: id }),
      );
    }

    const saved = await this.prescriptionRepository.save(prescription);

    await this.operationLogService.createLog({
      module: '处方管理',
      action: '更新处方',
      targetType: 'Prescription',
      targetId: id,
      newValue: dto,
      user: operator,
    });

    return saved;
  }

  async calculateTotal(prescription: Prescription): Promise<{ total: number; discount: number; actual: number }> {
    let total = 0;
    let actual = 0;

    for (const item of prescription.items) {
      total += item.unitPrice * item.quantity;
      actual += item.actualPrice;
    }

    return { total, discount: total - actual, actual };
  }
}
