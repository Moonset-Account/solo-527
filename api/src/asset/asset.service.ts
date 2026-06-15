import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Asset } from './entities/asset.entity.js';
import { CreateAssetDto } from './dto/create-asset.dto.js';
import { AuditService } from '../audit/audit.service.js';
import { TargetType } from '../../../shared/types.js';

@Injectable()
export class AssetService {
  constructor(
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
    private auditService: AuditService,
  ) {}

  async findAll(query: {
    keyword?: string;
    status?: string;
    type?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { keyword, status, type, page = 1, pageSize = 10 } = query;
    const qb = this.assetRepository.createQueryBuilder('asset');

    if (keyword) {
      qb.andWhere(
        '(asset.name LIKE :keyword OR asset.asset_code LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }
    if (status) {
      qb.andWhere('asset.status = :status', { status });
    }
    if (type) {
      qb.andWhere('asset.type = :type', { type });
    }

    qb.orderBy('asset.created_at', 'DESC');
    const total = await qb.getCount();
    const items = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    return { items, total, page, pageSize };
  }

  async findOne(id: number) {
    return this.assetRepository.findOne({
      where: { id },
      relations: ['configItems'],
    });
  }

  async create(dto: CreateAssetDto, operatorId?: number) {
    const asset = this.assetRepository.create(dto);
    const saved = await this.assetRepository.save(asset);
    await this.auditService.log(
      operatorId,
      'create_asset',
      TargetType.asset,
      saved.id,
      null,
      saved as unknown as Record<string, unknown>,
    );
    return saved;
  }

  async update(id: number, dto: Partial<CreateAssetDto>, operatorId?: number) {
    const before = await this.assetRepository.findOne({ where: { id } });
    if (!before) throw new NotFoundException('Asset not found');
    await this.assetRepository.update(id, dto);
    const after = await this.assetRepository.findOne({ where: { id } });
    await this.auditService.log(
      operatorId,
      'update_asset',
      TargetType.asset,
      id,
      before as unknown as Record<string, unknown>,
      after as unknown as Record<string, unknown>,
    );
    return after;
  }

  async remove(id: number, operatorId?: number) {
    const before = await this.assetRepository.findOne({ where: { id } });
    if (!before) throw new NotFoundException('Asset not found');
    await this.auditService.log(
      operatorId,
      'delete_asset',
      TargetType.asset,
      id,
      before as unknown as Record<string, unknown>,
      null,
    );
    return this.assetRepository.delete(id);
  }

  async findByIds(ids: number[]) {
    return this.assetRepository.find({ where: { id: In(ids) } });
  }
}

