import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  HealthRecord,
  HealthRecordType,
} from '../../entities/health-record.entity';
import { OperationLog, OperationType } from '../../entities/operation-log.entity';
import { User } from '../../entities/user.entity';
import { Pet } from '../../entities/pet.entity';

interface FindAllQuery {
  page: number;
  pageSize: number;
  type?: HealthRecordType;
  startDate?: string;
  endDate?: string;
  petId?: string;
  veterinarianId?: string;
}

@Injectable()
export class HealthRecordsService {
  constructor(
    @InjectRepository(HealthRecord)
    private healthRecordsRepository: Repository<HealthRecord>,
    @InjectRepository(OperationLog)
    private operationLogsRepository: Repository<OperationLog>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Pet)
    private petsRepository: Repository<Pet>,
  ) {}

  async findAll(query: FindAllQuery) {
    const { page, pageSize, type, startDate, endDate, petId, veterinarianId } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (type) {
      where.type = type;
    }
    if (petId) {
      where.petId = petId;
    }
    if (veterinarianId) {
      where.veterinarianId = veterinarianId;
    }
    if (startDate && endDate) {
      where.recordDate = Between(new Date(startDate), new Date(endDate));
    }

    const [data, total] = await this.healthRecordsRepository.findAndCount({
      where,
      skip,
      take: pageSize,
      order: { recordDate: 'DESC', createdAt: 'DESC' },
      relations: ['pet', 'veterinarian'],
    });

    return {
      data,
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string) {
    const record = await this.healthRecordsRepository.findOne({
      where: { id },
      relations: ['pet', 'veterinarian'],
    });
    if (!record) {
      throw new NotFoundException('健康记录不存在');
    }
    return record;
  }

  async create(dto: any, operator: User) {
    const record = this.healthRecordsRepository.create(dto);
    const saved = (await this.healthRecordsRepository.save(record)) as unknown as HealthRecord;

    await this.operationLogsRepository.save({
      operatorId: operator.id,
      module: 'health-records',
      operationType: OperationType.CREATE,
      targetId: saved.id,
      description: `创建健康记录: ${saved.title}`,
      afterData: saved as any,
    });

    return this.findOne(saved.id);
  }

  async update(id: string, dto: any, operator: User) {
    const record = await this.findOne(id);
    const beforeData = { ...record };
    Object.assign(record, dto);
    const saved = (await this.healthRecordsRepository.save(record)) as unknown as HealthRecord;

    await this.operationLogsRepository.save({
      operatorId: operator.id,
      module: 'health-records',
      operationType: OperationType.UPDATE,
      targetId: saved.id,
      description: `更新健康记录: ${saved.title}`,
      beforeData: beforeData as any,
      afterData: saved as any,
    });

    return this.findOne(saved.id);
  }

  async remove(id: string, operator: User) {
    const record = await this.findOne(id);
    await this.healthRecordsRepository.remove(record);

    await this.operationLogsRepository.save({
      operatorId: operator.id,
      module: 'health-records',
      operationType: OperationType.DELETE,
      targetId: id,
      description: `删除健康记录: ${record.title}`,
      beforeData: record as any,
    });

    return { success: true };
  }
}
