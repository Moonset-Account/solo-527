import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  FosterRecord,
  FosterStatus,
} from '../../entities/foster-record.entity';
import { OperationLog, OperationType } from '../../entities/operation-log.entity';
import { User } from '../../entities/user.entity';
import { Pet } from '../../entities/pet.entity';

interface FindAllQuery {
  page: number;
  pageSize: number;
  status?: FosterStatus;
  startDate?: string;
  endDate?: string;
  volunteerId?: string;
  petId?: string;
}

@Injectable()
export class FosterRecordsService {
  constructor(
    @InjectRepository(FosterRecord)
    private fosterRecordsRepository: Repository<FosterRecord>,
    @InjectRepository(OperationLog)
    private operationLogsRepository: Repository<OperationLog>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Pet)
    private petsRepository: Repository<Pet>,
  ) {}

  async findAll(query: FindAllQuery) {
    const { page, pageSize, status, startDate, endDate, volunteerId, petId } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (status) {
      where.status = status;
    }
    if (volunteerId) {
      where.volunteerId = volunteerId;
    }
    if (petId) {
      where.petId = petId;
    }
    if (startDate && endDate) {
      where.startDate = Between(new Date(startDate), new Date(endDate));
    }

    const [data, total] = await this.fosterRecordsRepository.findAndCount({
      where,
      skip,
      take: pageSize,
      order: { startDate: 'DESC', createdAt: 'DESC' },
      relations: ['pet', 'volunteer'],
    });

    return {
      data,
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string) {
    const record = await this.fosterRecordsRepository.findOne({
      where: { id },
      relations: ['pet', 'volunteer'],
    });
    if (!record) {
      throw new NotFoundException('寄养记录不存在');
    }
    return record;
  }

  async create(dto: any, operator: User) {
    const record = this.fosterRecordsRepository.create(dto);
    const saved = (await this.fosterRecordsRepository.save(record)) as unknown as FosterRecord;

    await this.operationLogsRepository.save({
      operatorId: operator.id,
      module: 'foster-records',
      operationType: OperationType.CREATE,
      targetId: saved.id,
      description: `创建寄养记录`,
      afterData: saved as any,
    });

    return this.findOne(saved.id);
  }

  async update(id: string, dto: any, operator: User) {
    const record = await this.findOne(id);
    const beforeData = { ...record };
    Object.assign(record, dto);
    const saved = (await this.fosterRecordsRepository.save(record)) as unknown as FosterRecord;

    await this.operationLogsRepository.save({
      operatorId: operator.id,
      module: 'foster-records',
      operationType: OperationType.UPDATE,
      targetId: saved.id,
      description: `更新寄养记录`,
      beforeData: beforeData as any,
      afterData: saved as any,
    });

    return this.findOne(saved.id);
  }

  async remove(id: string, operator: User) {
    const record = await this.findOne(id);
    await this.fosterRecordsRepository.remove(record);

    await this.operationLogsRepository.save({
      operatorId: operator.id,
      module: 'foster-records',
      operationType: OperationType.DELETE,
      targetId: id,
      description: `删除寄养记录`,
      beforeData: record as any,
    });

    return { success: true };
  }
}
