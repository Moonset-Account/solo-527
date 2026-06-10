import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { MaterialShortage, ShortageStatus, ImpactLevel } from '../../entities';
import { BaseCrudService } from '../../common/services/base-crud.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { NotificationService } from '../../common/services/notification.service';

export interface CreateMaterialShortageDto {
  orderId: string;
  materialId: string;
  materialName: string;
  materialSpec?: string;
  requiredQuantity: number;
  availableQuantity: number;
  impactLevel?: ImpactLevel;
  impactScope: string;
  responsiblePerson: string;
  responsiblePhone?: string;
  resolutionPath: string;
  expectedResolutionTime?: Date;
  remark?: string;
  extraFields?: Record<string, any>;
}

export interface UpdateMaterialShortageDto {
  orderId?: string;
  materialId?: string;
  materialName?: string;
  materialSpec?: string;
  requiredQuantity?: number;
  availableQuantity?: number;
  impactLevel?: ImpactLevel;
  impactScope?: string;
  responsiblePerson?: string;
  responsiblePhone?: string;
  resolutionPath?: string;
  expectedResolutionTime?: Date;
  resolutionResult?: string;
  remark?: string;
  extraFields?: Record<string, any>;
}

export interface ShortageQueryDto extends PaginationDto {
  status?: ShortageStatus;
  impactLevel?: ImpactLevel;
  orderId?: string;
}

export interface ResolveShortageDto {
  resolutionResult: string;
  actualResolutionTime?: Date;
}

export interface ShortageStatistics {
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
  total: number;
  critical: number;
  high: number;
}

@Injectable()
export class MaterialShortageService extends BaseCrudService<MaterialShortage> {
  constructor(
    @InjectRepository(MaterialShortage)
    protected readonly repository: Repository<MaterialShortage>,
    private readonly notificationService: NotificationService,
  ) {
    super(repository, '缺料记录');
  }

  protected override getKeywordField(): string {
    return 'materialName';
  }

  async findAllWithFilters(query: ShortageQueryDto) {
    const where: FindOptionsWhere<MaterialShortage> = {};

    if (query.status) {
      where.status = query.status;
    }
    if (query.impactLevel) {
      where.impactLevel = query.impactLevel;
    }
    if (query.orderId) {
      where.orderId = query.orderId;
    }

    return this.findAll(query, where);
  }

  async findOneWithRelations(id: string): Promise<MaterialShortage> {
    const shortage = await this.repository.findOne({
      where: { id } as any,
      relations: ['order', 'material'],
    });
    if (!shortage) {
      throw new BadRequestException('缺料记录不存在');
    }
    return shortage;
  }

  override async create(dto: CreateMaterialShortageDto, createdBy?: string): Promise<MaterialShortage> {
    const shortageQuantity = Math.max(0, dto.requiredQuantity - dto.availableQuantity);

    if (shortageQuantity <= 0) {
      throw new BadRequestException('可用数量大于等于需求数量，无需创建缺料记录');
    }

    const shortage = this.repository.create({
      ...dto,
      shortageQuantity,
      status: 'open',
      createdBy,
      updatedBy: createdBy,
    });

    const saved = await this.repository.save(shortage);

    const level = saved.impactLevel === 'critical' ? 'danger' : 'warning';
    const prefix = saved.impactLevel === 'critical' ? '【紧急】' : '【警告】';

    this.notificationService.create({
      type: 'shortage',
      title: `${prefix}物料缺料警报`,
      message: `物料【${saved.materialName}${saved.materialSpec ? '(' + saved.materialSpec + ')' : ''}】缺料 ${saved.shortageQuantity}，影响范围：${saved.impactScope}，负责人：${saved.responsiblePerson}${saved.responsiblePhone ? '(' + saved.responsiblePhone + ')' : ''}`,
      level,
      relatedId: saved.id,
    });

    return this.findOneWithRelations(saved.id);
  }

  override async update(id: string, dto: UpdateMaterialShortageDto, updatedBy?: string): Promise<MaterialShortage> {
    const shortage = await this.findOne(id);

    const requiredQuantity = dto.requiredQuantity ?? shortage.requiredQuantity;
    const availableQuantity = dto.availableQuantity ?? shortage.availableQuantity;
    const shortageQuantity = Math.max(0, requiredQuantity - availableQuantity);

    this.repository.merge(shortage as any, {
      ...dto,
      shortageQuantity,
      updatedBy,
    });

    await this.repository.save(shortage);
    return this.findOneWithRelations(id);
  }

  async startProcessing(id: string, updatedBy?: string): Promise<MaterialShortage> {
    const shortage = await this.findOne(id);

    if (shortage.status !== 'open') {
      throw new BadRequestException('只有待处理状态的缺料记录才能开始处理');
    }

    shortage.status = 'in_progress';
    shortage.updatedBy = updatedBy;
    await this.repository.save(shortage);

    this.notificationService.create({
      type: 'shortage',
      title: '缺料处理中',
      message: `物料【${shortage.materialName}】缺料问题已开始处理，负责人：${shortage.responsiblePerson}。`,
      level: 'info',
      relatedId: id,
    });

    return this.findOneWithRelations(id);
  }

  async resolve(id: string, dto: ResolveShortageDto, updatedBy?: string): Promise<MaterialShortage> {
    const shortage = await this.findOne(id);

    if (shortage.status !== 'in_progress') {
      throw new BadRequestException('只有处理中状态的缺料记录才能标记解决');
    }

    if (!dto.resolutionResult || dto.resolutionResult.trim() === '') {
      throw new BadRequestException('解决结果不能为空');
    }

    shortage.status = 'resolved';
    shortage.resolutionResult = dto.resolutionResult;
    shortage.actualResolutionTime = dto.actualResolutionTime || new Date();
    shortage.updatedBy = updatedBy;
    await this.repository.save(shortage);

    this.notificationService.create({
      type: 'shortage',
      title: '缺料已解决',
      message: `物料【${shortage.materialName}】缺料问题已解决：${dto.resolutionResult.substring(0, 50)}${dto.resolutionResult.length > 50 ? '...' : ''}`,
      level: 'info',
      relatedId: id,
    });

    return this.findOneWithRelations(id);
  }

  async close(id: string, updatedBy?: string): Promise<MaterialShortage> {
    const shortage = await this.findOne(id);

    if (shortage.status !== 'resolved') {
      throw new BadRequestException('只有已解决状态的缺料记录才能关闭');
    }

    shortage.status = 'closed';
    shortage.updatedBy = updatedBy;
    await this.repository.save(shortage);

    return this.findOneWithRelations(id);
  }

  async getStatistics(): Promise<ShortageStatistics> {
    const [allShortages] = await this.repository.findAndCount();

    const stats: ShortageStatistics = {
      open: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0,
      total: allShortages.length,
      critical: 0,
      high: 0,
    };

    for (const s of allShortages) {
      if (stats[s.status] !== undefined) {
        stats[s.status]++;
      }
      if (s.impactLevel === 'critical') {
        stats.critical++;
      } else if (s.impactLevel === 'high') {
        stats.high++;
      }
    }

    return stats;
  }
}
