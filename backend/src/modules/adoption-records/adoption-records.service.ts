import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  AdoptionRecord,
  AdoptionStatus,
} from '../../entities/adoption-record.entity';
import { OperationLog, OperationType } from '../../entities/operation-log.entity';
import { User } from '../../entities/user.entity';
import { Pet } from '../../entities/pet.entity';

interface FindAllQuery {
  page: number;
  pageSize: number;
  status?: AdoptionStatus;
  startDate?: string;
  endDate?: string;
  approverId?: string;
  adopterId?: string;
}

@Injectable()
export class AdoptionRecordsService {
  constructor(
    @InjectRepository(AdoptionRecord)
    private adoptionRecordsRepository: Repository<AdoptionRecord>,
    @InjectRepository(OperationLog)
    private operationLogsRepository: Repository<OperationLog>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Pet)
    private petsRepository: Repository<Pet>,
  ) {}

  async findAll(query: FindAllQuery) {
    const { page, pageSize, status, startDate, endDate, approverId, adopterId } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (status) {
      where.status = status;
    }
    if (approverId) {
      where.approverId = approverId;
    }
    if (adopterId) {
      where.adopterId = adopterId;
    }
    if (startDate && endDate) {
      where.applicationDate = Between(new Date(startDate), new Date(endDate));
    }

    const [data, total] = await this.adoptionRecordsRepository.findAndCount({
      where,
      skip,
      take: pageSize,
      order: { applicationDate: 'DESC', createdAt: 'DESC' },
      relations: ['pet', 'adopter', 'approver'],
    });

    return {
      data,
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string) {
    const record = await this.adoptionRecordsRepository.findOne({
      where: { id },
      relations: ['pet', 'adopter', 'approver'],
    });
    if (!record) {
      throw new NotFoundException('领养记录不存在');
    }
    return record;
  }

  async create(dto: any, operator: User) {
    const record = this.adoptionRecordsRepository.create(dto);
    const saved = (await this.adoptionRecordsRepository.save(record)) as unknown as AdoptionRecord;

    await this.operationLogsRepository.save({
      operatorId: operator.id,
      module: 'adoption-records',
      operationType: OperationType.CREATE,
      targetId: saved.id,
      description: `创建领养申请记录`,
      afterData: saved as any,
    });

    return this.findOne(saved.id);
  }

  async update(id: string, dto: any, operator: User) {
    const record = await this.findOne(id);
    const beforeData = { ...record };
    Object.assign(record, dto);
    const saved = (await this.adoptionRecordsRepository.save(record)) as unknown as AdoptionRecord;

    await this.operationLogsRepository.save({
      operatorId: operator.id,
      module: 'adoption-records',
      operationType: OperationType.UPDATE,
      targetId: saved.id,
      description: `更新领养申请记录`,
      beforeData: beforeData as any,
      afterData: saved as any,
    });

    return this.findOne(saved.id);
  }

  async approve(id: string, operator: User) {
    const record = await this.findOne(id);
    if (record.status !== AdoptionStatus.PENDING) {
      throw new BadRequestException('只有待审批的申请才能通过');
    }
    const beforeData = { ...record };

    record.status = AdoptionStatus.APPROVED;
    record.approverId = operator.id;
    record.approvalDate = new Date();

    const saved = (await this.adoptionRecordsRepository.save(record)) as unknown as AdoptionRecord;

    await this.operationLogsRepository.save({
      operatorId: operator.id,
      module: 'adoption-records',
      operationType: OperationType.APPROVE,
      targetId: saved.id,
      description: `审批通过领养申请`,
      beforeData: beforeData as any,
      afterData: saved as any,
    });

    return this.findOne(saved.id);
  }

  async reject(id: string, rejectionReason: string, operator: User) {
    const record = await this.findOne(id);
    if (record.status !== AdoptionStatus.PENDING) {
      throw new BadRequestException('只有待审批的申请才能拒绝');
    }
    const beforeData = { ...record };

    record.status = AdoptionStatus.REJECTED;
    record.approverId = operator.id;
    record.approvalDate = new Date();
    record.rejectionReason = rejectionReason;

    const saved = (await this.adoptionRecordsRepository.save(record)) as unknown as AdoptionRecord;

    await this.operationLogsRepository.save({
      operatorId: operator.id,
      module: 'adoption-records',
      operationType: OperationType.REJECT,
      targetId: saved.id,
      description: `审批拒绝领养申请，原因：${rejectionReason || '未填写'}`,
      beforeData: beforeData as any,
      afterData: saved as any,
    });

    return this.findOne(saved.id);
  }

  async remove(id: string, operator: User) {
    const record = await this.findOne(id);
    await this.adoptionRecordsRepository.remove(record);

    await this.operationLogsRepository.save({
      operatorId: operator.id,
      module: 'adoption-records',
      operationType: OperationType.DELETE,
      targetId: id,
      description: `删除领养申请记录`,
      beforeData: record as any,
    });

    return { success: true };
  }
}
