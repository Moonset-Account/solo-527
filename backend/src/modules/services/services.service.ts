import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from '../../entities/service.entity';
import { ProcessingRecord } from '../../entities/processing-record.entity';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private servicesRepository: Repository<Service>,
    @InjectRepository(ProcessingRecord)
    private processingRecordsRepository: Repository<ProcessingRecord>,
  ) {}

  async create(createServiceDto: any, userId?: string) {
    const service = this.servicesRepository.create(createServiceDto);
    const saved = await this.servicesRepository.save(service) as unknown as Service;

    await this.processingRecordsRepository.save({
      type: 'service_update',
      relatedId: saved.id,
      relatedType: 'service',
      operatorId: userId,
      action: '创建服务项目',
      remarks: `服务名称: ${saved.name}`,
    });

    return saved;
  }

  async findAll(page = 1, pageSize = 10, filters: any = {}) {
    const query = this.servicesRepository.createQueryBuilder('service')
      .leftJoinAndSelect('service.counselor', 'counselor');

    if (filters.status) {
      query.andWhere('service.status = :status', { status: filters.status });
    }
    if (filters.counselorId) {
      query.andWhere('service.counselorId = :counselorId', { counselorId: filters.counselorId });
    }

    query.orderBy('service.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await query.getManyAndCount();

    return {
      items: items.map(item => ({
        ...item,
        counselor: item.counselor ? { id: item.counselor.id, name: item.counselor.name } : null,
      })),
      total,
      page,
      pageSize,
    };
  }

  async findByCounselor(counselorId: string) {
    const services = await this.servicesRepository.find({
      where: { counselorId, status: 'active' },
      order: { createdAt: 'DESC' },
    });
    return services;
  }

  async findOne(id: string) {
    const service = await this.servicesRepository.findOne({
      where: { id },
      relations: ['counselor'],
    });
    if (!service) {
      throw new NotFoundException('服务项目不存在');
    }
    return {
      ...service,
      counselor: service.counselor ? { id: service.counselor.id, name: service.counselor.name } : null,
    };
  }

  async update(id: string, updateServiceDto: any, userId?: string) {
    const service = await this.findOne(id);
    const beforeState = JSON.stringify(service);

    await this.servicesRepository.update(id, updateServiceDto);
    const updated = await this.findOne(id);

    await this.processingRecordsRepository.save({
      type: 'service_update',
      relatedId: id,
      relatedType: 'service',
      operatorId: userId,
      action: '更新服务项目',
      beforeState,
      afterState: JSON.stringify(updated),
    });

    return updated;
  }

  async remove(id: string, userId?: string) {
    const result = await this.servicesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('服务项目不存在');
    }

    await this.processingRecordsRepository.save({
      type: 'service_update',
      relatedId: id,
      relatedType: 'service',
      operatorId: userId,
      action: '删除服务项目',
    });

    return { success: true };
  }
}
