import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { TrainingRecord } from '../../entities/training-record.entity';
import { OperationLog, OperationType } from '../../entities/operation-log.entity';
import { User } from '../../entities/user.entity';
import { Pet } from '../../entities/pet.entity';

interface FindAllQuery {
  page: number;
  pageSize: number;
  startDate?: string;
  endDate?: string;
  petId?: string;
  trainerId?: string;
}

@Injectable()
export class TrainingRecordsService {
  constructor(
    @InjectRepository(TrainingRecord)
    private trainingRecordsRepository: Repository<TrainingRecord>,
    @InjectRepository(OperationLog)
    private operationLogsRepository: Repository<OperationLog>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Pet)
    private petsRepository: Repository<Pet>,
  ) {}

  async findAll(query: FindAllQuery) {
    const { page, pageSize, startDate, endDate, petId, trainerId } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (petId) {
      where.petId = petId;
    }
    if (trainerId) {
      where.trainerId = trainerId;
    }
    if (startDate && endDate) {
      where.trainingDate = Between(new Date(startDate), new Date(endDate));
    }

    const [data, total] = await this.trainingRecordsRepository.findAndCount({
      where,
      skip,
      take: pageSize,
      order: { trainingDate: 'DESC', createdAt: 'DESC' },
      relations: ['pet', 'trainer'],
    });

    return {
      data,
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string) {
    const record = await this.trainingRecordsRepository.findOne({
      where: { id },
      relations: ['pet', 'trainer'],
    });
    if (!record) {
      throw new NotFoundException('训练记录不存在');
    }
    return record;
  }

  async create(dto: any, operator: User) {
    const record = this.trainingRecordsRepository.create(dto);
    const saved = (await this.trainingRecordsRepository.save(record)) as unknown as TrainingRecord;

    await this.operationLogsRepository.save({
      operatorId: operator.id,
      module: 'training-records',
      operationType: OperationType.CREATE,
      targetId: saved.id,
      description: `创建训练记录: ${saved.trainingType}`,
      afterData: saved as any,
    });

    return this.findOne(saved.id);
  }

  async update(id: string, dto: any, operator: User) {
    const record = await this.findOne(id);
    const beforeData = { ...record };
    Object.assign(record, dto);
    const saved = (await this.trainingRecordsRepository.save(record)) as unknown as TrainingRecord;

    await this.operationLogsRepository.save({
      operatorId: operator.id,
      module: 'training-records',
      operationType: OperationType.UPDATE,
      targetId: saved.id,
      description: `更新训练记录: ${saved.trainingType}`,
      beforeData: beforeData as any,
      afterData: saved as any,
    });

    return this.findOne(saved.id);
  }

  async remove(id: string, operator: User) {
    const record = await this.findOne(id);
    await this.trainingRecordsRepository.remove(record);

    await this.operationLogsRepository.save({
      operatorId: operator.id,
      module: 'training-records',
      operationType: OperationType.DELETE,
      targetId: id,
      description: `删除训练记录: ${record.trainingType}`,
      beforeData: record as any,
    });

    return { success: true };
  }
}
