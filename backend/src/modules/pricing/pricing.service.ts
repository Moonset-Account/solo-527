import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pricing } from './entities/pricing.entity';
import { CreatePricingDto } from './dto/create-pricing.dto';
import { PricingQueryDto } from './dto/pricing-query.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class PricingService {
  constructor(
    @InjectRepository(Pricing)
    private pricingRepository: Repository<Pricing>,
    private auditLogsService: AuditLogsService,
  ) {}

  async create(
    createPricingDto: CreatePricingDto,
    operatorId?: string,
    ip?: string,
  ): Promise<Pricing> {
    if (createPricingDto.isCurrent) {
      await this.pricingRepository.update(
        { propertyId: createPricingDto.propertyId, isCurrent: true },
        { isCurrent: false },
      );
    }

    const pricing = this.pricingRepository.create({
      ...createPricingDto,
      createdBy: operatorId,
    });
    const saved = await this.pricingRepository.save(pricing);

    await this.auditLogsService.create(
      'pricing',
      'create',
      'Pricing',
      saved.id,
      null,
      saved,
      operatorId,
      ip,
    );

    return saved;
  }

  async findAll(
    query: PricingQueryDto,
  ): Promise<{ items: Pricing[]; total: number; page: number; pageSize: number }> {
    const { page = 1, pageSize = 10, propertyId, priceType, isCurrent, validDate, source } = query;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.pricingRepository.createQueryBuilder('pricing');

    if (propertyId) {
      queryBuilder.andWhere('pricing.propertyId = :propertyId', { propertyId });
    }
    if (priceType) {
      queryBuilder.andWhere('pricing.priceType = :priceType', { priceType });
    }
    if (isCurrent !== undefined) {
      queryBuilder.andWhere('pricing.isCurrent = :isCurrent', { isCurrent });
    }
    if (validDate) {
      queryBuilder.andWhere('pricing.validFrom <= :validDate', { validDate });
      queryBuilder.andWhere('(pricing.validTo IS NULL OR pricing.validTo >= :validDate)', { validDate });
    }
    if (source) {
      queryBuilder.andWhere('pricing.source = :source', { source });
    }

    queryBuilder.leftJoinAndSelect('pricing.property', 'property');
    queryBuilder.leftJoinAndSelect('pricing.creator', 'creator');
    queryBuilder.orderBy('pricing.createdAt', 'DESC');
    queryBuilder.skip(skip).take(pageSize);

    const [items, total] = await queryBuilder.getManyAndCount();

    return { items, total, page, pageSize };
  }

  async findOne(id: string): Promise<Pricing> {
    const pricing = await this.pricingRepository.findOne({
      where: { id },
      relations: ['property', 'creator'],
    });
    if (!pricing) {
      throw new NotFoundException(`Pricing with ID ${id} not found`);
    }
    return pricing;
  }

  async findCurrentByPropertyId(propertyId: string): Promise<Pricing[]> {
    return this.pricingRepository.find({
      where: { propertyId, isCurrent: true },
      relations: ['property'],
    });
  }

  async update(
    id: string,
    updatePricingDto: Partial<CreatePricingDto>,
    operatorId?: string,
    ip?: string,
  ): Promise<Pricing> {
    const pricing = await this.findOne(id);
    const oldValue = { ...pricing };

    if (updatePricingDto.isCurrent && pricing.propertyId) {
      await this.pricingRepository.update(
        { propertyId: pricing.propertyId, isCurrent: true },
        { isCurrent: false },
      );
    }

    Object.assign(pricing, updatePricingDto);
    const saved = await this.pricingRepository.save(pricing);

    await this.auditLogsService.create(
      'pricing',
      'update',
      'Pricing',
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
    const pricing = await this.findOne(id);
    const oldValue = { ...pricing };

    const result = await this.pricingRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Pricing with ID ${id} not found`);
    }

    await this.auditLogsService.create(
      'pricing',
      'delete',
      'Pricing',
      id,
      oldValue,
      null,
      operatorId,
      ip,
    );
  }
}
