import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Property, PropertyStatus } from './entities/property.entity';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertyQueryDto } from './dto/property-query.dto';
import { UpdatePropertyStatusDto } from './dto/update-property-status.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { RoomStatusLogsService } from '../room-status-logs/room-status-logs.service';

@Injectable()
export class PropertiesService {
  constructor(
    @InjectRepository(Property)
    private propertyRepository: Repository<Property>,
    private auditLogsService: AuditLogsService,
    private roomStatusLogsService: RoomStatusLogsService,
  ) {}

  async create(
    createPropertyDto: CreatePropertyDto,
    operatorId?: string,
    ip?: string,
  ): Promise<Property> {
    const property = this.propertyRepository.create(createPropertyDto);
    const saved = await this.propertyRepository.save(property);

    await this.auditLogsService.create(
      'properties',
      'create',
      'Property',
      saved.id,
      null,
      saved,
      operatorId,
      ip,
    );

    return saved;
  }

  async findAll(
    query: PropertyQueryDto,
  ): Promise<{ items: Property[]; total: number; page: number; pageSize: number }> {
    const { page = 1, pageSize = 10, keyword, type, status, building, floor } = query;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.propertyRepository.createQueryBuilder('property');

    if (keyword) {
      queryBuilder.andWhere(
        '(property.name LIKE :keyword OR property.code LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }
    if (type) {
      queryBuilder.andWhere('property.type = :type', { type });
    }
    if (status) {
      queryBuilder.andWhere('property.status = :status', { status });
    }
    if (building) {
      queryBuilder.andWhere('property.building = :building', { building });
    }
    if (floor) {
      queryBuilder.andWhere('property.floor = :floor', { floor });
    }

    queryBuilder.orderBy('property.createdAt', 'DESC');
    queryBuilder.skip(skip).take(pageSize);

    const [items, total] = await queryBuilder.getManyAndCount();

    return { items, total, page, pageSize };
  }

  async findOne(id: string): Promise<Property> {
    const property = await this.propertyRepository.findOneBy({ id });
    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }
    return property;
  }

  async findByCode(code: string): Promise<Property | undefined> {
    return this.propertyRepository.findOneBy({ code });
  }

  async update(
    id: string,
    updatePropertyDto: UpdatePropertyDto,
    operatorId?: string,
    ip?: string,
  ): Promise<Property> {
    const property = await this.findOne(id);
    const oldValue = { ...property };

    if (updatePropertyDto.status === 'closed' && !updatePropertyDto.closeReason) {
      throw new BadRequestException('关闭房源需要填写关闭原因');
    }

    Object.assign(property, updatePropertyDto);
    const saved = await this.propertyRepository.save(property);

    await this.auditLogsService.create(
      'properties',
      'update',
      'Property',
      id,
      oldValue,
      saved,
      operatorId,
      ip,
    );

    return saved;
  }

  async updateStatus(
    id: string,
    updateStatusDto: UpdatePropertyStatusDto,
    operatorId?: string,
    ip?: string,
  ): Promise<Property> {
    const property = await this.findOne(id);
    const oldStatus = property.status;
    const oldValue = { ...property };

    if (updateStatusDto.status === 'closed' && !updateStatusDto.reason) {
      throw new BadRequestException('关闭房源需要填写原因');
    }

    if (oldStatus === updateStatusDto.status) {
      return property;
    }

    property.status = updateStatusDto.status;
    if (updateStatusDto.status === 'closed') {
      property.closeReason = updateStatusDto.reason;
    }

    const saved = await this.propertyRepository.save(property);

    await this.roomStatusLogsService.create(
      {
        propertyId: id,
        fromStatus: oldStatus,
        toStatus: updateStatusDto.status,
        reason: updateStatusDto.reason,
        source: updateStatusDto.source,
        sourceRemark: updateStatusDto.sourceRemark,
      },
      operatorId,
    );

    await this.auditLogsService.create(
      'properties',
      'status_change',
      'Property',
      id,
      oldValue,
      saved,
      operatorId,
      ip,
    );

    return saved;
  }

  async remove(
    id: string,
    operatorId?: string,
    ip?: string,
  ): Promise<void> {
    const property = await this.findOne(id);
    const oldValue = { ...property };

    const result = await this.propertyRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    await this.auditLogsService.create(
      'properties',
      'delete',
      'Property',
      id,
      oldValue,
      null,
      operatorId,
      ip,
    );
  }
}
