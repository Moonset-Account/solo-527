import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigItem } from './entities/config-item.entity.js';
import { CreateConfigItemDto } from './dto/create-config-item.dto.js';
import { AuditService } from '../audit/audit.service.js';
import { TargetType } from '../../../shared/types.js';

@Injectable()
export class ConfigItemService {
  constructor(
    @InjectRepository(ConfigItem)
    private configItemRepository: Repository<ConfigItem>,
    private auditService: AuditService,
  ) {}

  async findAll(query: {
    assetId?: number;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { assetId, keyword, page = 1, pageSize = 10 } = query;
    const qb = this.configItemRepository
      .createQueryBuilder('ci')
      .leftJoinAndSelect('ci.asset', 'asset');

    if (assetId) {
      qb.andWhere('ci.asset_id = :assetId', { assetId });
    }
    if (keyword) {
      qb.andWhere(
        '(ci.name LIKE :keyword OR ci.key LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    qb.orderBy('ci.created_at', 'DESC');
    const total = await qb.getCount();
    const items = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    return { items, total, page, pageSize };
  }

  async findOne(id: number) {
    return this.configItemRepository.findOne({
      where: { id },
      relations: ['asset'],
    });
  }

  async create(dto: CreateConfigItemDto, operatorId?: number) {
    const configItem = this.configItemRepository.create({
      ...dto,
      asset: { id: dto.assetId },
    });
    const saved = await this.configItemRepository.save(configItem);
    await this.auditService.log(
      operatorId,
      'create_config_item',
      TargetType.config_item,
      saved.id,
      null,
      saved as unknown as Record<string, unknown>,
    );
    return saved;
  }

  async update(
    id: number,
    dto: Partial<CreateConfigItemDto>,
    operatorId?: number,
  ) {
    const before = await this.configItemRepository.findOne({ where: { id } });
    if (!before) throw new NotFoundException('ConfigItem not found');
    const updateData: Partial<ConfigItem> = { ...dto };
    if (dto.assetId) {
      updateData.asset = { id: dto.assetId } as any;
      delete (updateData as any).assetId;
    }
    await this.configItemRepository.update(id, updateData);
    const after = await this.configItemRepository.findOne({ where: { id } });
    await this.auditService.log(
      operatorId,
      'update_config_item',
      TargetType.config_item,
      id,
      before as unknown as Record<string, unknown>,
      after as unknown as Record<string, unknown>,
    );
    return after;
  }

  async remove(id: number, operatorId?: number) {
    const before = await this.configItemRepository.findOne({ where: { id } });
    if (!before) throw new NotFoundException('ConfigItem not found');
    await this.auditService.log(
      operatorId,
      'delete_config_item',
      TargetType.config_item,
      id,
      before as unknown as Record<string, unknown>,
      null,
    );
    return this.configItemRepository.delete(id);
  }
}
