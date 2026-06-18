import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Pet, PetStatus, PetSource } from '../../entities/pet.entity';
import { OperationLog, OperationType } from '../../entities/operation-log.entity';
import { User } from '../../entities/user.entity';

interface FindAllQuery {
  page: number;
  pageSize: number;
  status?: PetStatus;
  source?: PetSource;
  startDate?: string;
  endDate?: string;
  volunteerId?: string;
}

@Injectable()
export class PetsService {
  constructor(
    @InjectRepository(Pet)
    private petsRepository: Repository<Pet>,
    @InjectRepository(OperationLog)
    private operationLogsRepository: Repository<OperationLog>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll(query: FindAllQuery) {
    const { page, pageSize, status, source, startDate, endDate, volunteerId } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (status) {
      where.status = status;
    }
    if (source) {
      where.source = source;
    }
    if (volunteerId) {
      where.volunteerId = volunteerId;
    }
    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate));
    }

    const [data, total] = await this.petsRepository.findAndCount({
      where,
      skip,
      take: pageSize,
      order: { createdAt: 'DESC' },
      relations: ['volunteer', 'owner'],
    });

    return {
      data,
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string) {
    const pet = await this.petsRepository.findOne({
      where: { id },
      relations: ['volunteer', 'owner'],
    });
    if (!pet) {
      throw new NotFoundException('宠物不存在');
    }
    return pet;
  }

  async create(dto: any, operator: User) {
    const pet = this.petsRepository.create(dto);
    const saved = (await this.petsRepository.save(pet)) as unknown as Pet;

    await this.operationLogsRepository.save({
      operatorId: operator.id,
      module: 'pets',
      operationType: OperationType.CREATE,
      targetId: saved.id,
      description: `创建宠物档案: ${saved.name}`,
      afterData: saved as any,
    });

    return this.findOne(saved.id);
  }

  async update(id: string, dto: any, operator: User) {
    const pet = await this.findOne(id);
    const beforeData = { ...pet };
    Object.assign(pet, dto);
    const saved = (await this.petsRepository.save(pet)) as unknown as Pet;

    await this.operationLogsRepository.save({
      operatorId: operator.id,
      module: 'pets',
      operationType: OperationType.UPDATE,
      targetId: saved.id,
      description: `更新宠物档案: ${saved.name}`,
      beforeData: beforeData as any,
      afterData: saved as any,
    });

    return this.findOne(saved.id);
  }

  async remove(id: string, operator: User) {
    const pet = await this.findOne(id);
    await this.petsRepository.remove(pet);

    await this.operationLogsRepository.save({
      operatorId: operator.id,
      module: 'pets',
      operationType: OperationType.DELETE,
      targetId: id,
      description: `删除宠物档案: ${pet.name}`,
      beforeData: pet as any,
    });

    return { success: true };
  }
}
