import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../entities/patient.entity';
import { CreatePatientDto, UpdatePatientDto } from '../dto/patient.dto';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { OperationLogService } from '../../log/services/operation-log.service';

@Injectable()
export class PatientService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    private readonly operationLogService: OperationLogService,
  ) {}

  async create(dto: CreatePatientDto, operator: CurrentUserPayload) {
    const existing = await this.patientRepository.findOne({
      where: { phone: dto.phone, clinicId: operator.clinicId },
    });
    if (existing) {
      throw new BadRequestException('该手机号已存在');
    }

    const patient = this.patientRepository.create({
      ...dto,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      clinicId: operator.clinicId,
    });

    const saved = await this.patientRepository.save(patient);

    await this.operationLogService.createLog({
      module: '患者管理',
      action: '创建患者',
      targetType: 'Patient',
      targetId: saved.id,
      newValue: { name: dto.name, phone: dto.phone },
      user: operator,
    });

    return saved;
  }

  async findAll(params: {
    page?: number;
    pageSize?: number;
    clinicId?: string;
    keyword?: string;
  }) {
    const { page = 1, pageSize = 20, clinicId, keyword } = params;
    const queryBuilder = this.patientRepository
      .createQueryBuilder('patient');

    if (clinicId) {
      queryBuilder.andWhere('patient.clinic_id = :clinicId', { clinicId });
    }
    if (keyword) {
      queryBuilder.andWhere(
        '(patient.name LIKE :keyword OR patient.phone LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    const [items, total] = await queryBuilder
      .orderBy('patient.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { items, total, page, pageSize };
  }

  async findOne(id: string) {
    const patient = await this.patientRepository.findOne({ where: { id } });
    if (!patient) {
      throw new NotFoundException('患者不存在');
    }
    return patient;
  }

  async update(id: string, dto: UpdatePatientDto, operator: CurrentUserPayload) {
    const patient = await this.patientRepository.findOne({ where: { id } });
    if (!patient) {
      throw new NotFoundException('患者不存在');
    }

    const oldValue = { name: patient.name, phone: patient.phone };

    if (dto.name !== undefined) patient.name = dto.name;
    if (dto.phone !== undefined) patient.phone = dto.phone;
    if (dto.idCard !== undefined) patient.idCard = dto.idCard;
    if (dto.gender !== undefined) patient.gender = dto.gender;
    if (dto.birthDate !== undefined) patient.birthDate = new Date(dto.birthDate);
    if (dto.address !== undefined) patient.address = dto.address;
    if (dto.allergyHistory !== undefined) patient.allergyHistory = dto.allergyHistory;
    if (dto.medicalHistory !== undefined) patient.medicalHistory = dto.medicalHistory;

    const saved = await this.patientRepository.save(patient);

    await this.operationLogService.createLog({
      module: '患者管理',
      action: '更新患者',
      targetType: 'Patient',
      targetId: id,
      oldValue,
      newValue: dto,
      user: operator,
    });

    return saved;
  }

  async findByPhone(phone: string, clinicId: string) {
    return await this.patientRepository.findOne({
      where: { phone, clinicId },
    });
  }
}
