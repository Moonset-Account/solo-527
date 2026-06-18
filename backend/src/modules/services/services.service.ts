import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Service, ServiceType } from '../../entities/service.entity';
import { OperationLog, OperationType } from '../../entities/operation-log.entity';
import { User } from '../../entities/user.entity';

export interface CreateServiceDto {
  name: string;
  type: ServiceType;
  description?: string;
  duration: number;
  price: number;
  originalPrice?: number;
  isActive?: boolean;
  sortOrder?: number;
  applicableSpecies?: string[];
}

export interface UpdateServiceDto {
  name?: string;
  type?: ServiceType;
  description?: string;
  duration?: number;
  price?: number;
  originalPrice?: number;
  isActive?: boolean;
  sortOrder?: number;
  applicableSpecies?: string[];
}

export interface QueryServicesDto {
  page?: number;
  pageSize?: number;
  type?: ServiceType;
  keyword?: string;
  isActive?: boolean;
}

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private servicesRepository: Repository<Service>,
    @InjectRepository(OperationLog)
    private operationLogsRepository: Repository<OperationLog>,
  ) {}

  async findAll(query: QueryServicesDto) {
    const { page = 1, pageSize = 10, type, keyword, isActive } = query;
    const where: any = {};

    if (type) {
      where.type = type;
    }
    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    if (keyword) {
      where.name = ILike(`%${keyword}%`);
    }

    const [data, total] = await this.servicesRepository.findAndCount({
      where,
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      data,
      total,
      page,
      pageSize,
    };
  }

  async findAllActive() {
    return this.servicesRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  async findOne(id: string) {
    const service = await this.servicesRepository.findOne({ where: { id } });
    if (!service) {
      throw new NotFoundException('服务不存在');
    }
    return service;
  }

  async create(dto: CreateServiceDto, operator: User) {
    const service = this.servicesRepository.create({
      ...dto,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
      sortOrder: dto.sortOrder || 0,
    });
    const saved = await this.servicesRepository.save(service);

    await this.operationLogsRepository.save({
      operatorId: operator.id,
      module: 'services',
      operationType: OperationType.CREATE,
      targetId: saved.id,
      description: `创建服务: ${saved.name}`,
      afterData: saved as any,
    });

    return saved;
  }

  async update(id: string, dto: UpdateServiceDto, operator: User) {
    const service = await this.findOne(id);
    const beforeData = { ...service };

    await this.servicesRepository.update(id, dto);
    const updated = await this.findOne(id);

    await this.operationLogsRepository.save({
      operatorId: operator.id,
      module: 'services',
      operationType: OperationType.UPDATE,
      targetId: id,
      description: `更新服务: ${service.name}`,
      beforeData: beforeData as any,
      afterData: updated as any,
    });

    return updated;
  }

  async remove(id: string, operator: User) {
    const service = await this.findOne(id);
    await this.servicesRepository.delete(id);

    await this.operationLogsRepository.save({
      operatorId: operator.id,
      module: 'services',
      operationType: OperationType.DELETE,
      targetId: id,
      description: `删除服务: ${service.name}`,
      beforeData: {
        id: service.id,
        name: service.name,
        type: service.type,
      },
    });

    return { success: true };
  }
}
