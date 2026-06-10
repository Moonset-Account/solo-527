import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between } from 'typeorm';
import { Material, MaterialCost, MaterialCategory } from '../../entities';
import { BaseCrudService } from '../../common/services/base-crud.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { NotificationService } from '../../common/services/notification.service';

export interface CreateMaterialDto {
  materialName: string;
  materialCode: string;
  category?: MaterialCategory;
  materialSpec?: string;
  stockUnit?: string;
  safetyStock?: number;
  currentStock?: number;
  supplier?: string;
  isActive?: boolean;
  thresholdConfig?: Record<string, any>;
  extraFields?: Record<string, any>;
}

export interface UpdateMaterialDto {
  materialName?: string;
  materialCode?: string;
  category?: MaterialCategory;
  materialSpec?: string;
  stockUnit?: string;
  safetyStock?: number;
  currentStock?: number;
  supplier?: string;
  isActive?: boolean;
  thresholdConfig?: Record<string, any>;
  extraFields?: Record<string, any>;
}

export interface MaterialQueryDto extends PaginationDto {
  category?: MaterialCategory;
  isActive?: boolean;
  lowStock?: boolean;
}

export interface CreateMaterialCostDto {
  orderId: string;
  materialId: string;
  materialName: string;
  materialSpec?: string;
  quantityUsed: number;
  unit?: string;
  unitCost: number;
  totalCost?: number;
  costDate?: Date;
  remark?: string;
  extraFields?: Record<string, any>;
}

export interface UpdateMaterialCostDto {
  orderId?: string;
  materialId?: string;
  materialName?: string;
  materialSpec?: string;
  quantityUsed?: number;
  unit?: string;
  unitCost?: number;
  totalCost?: number;
  costDate?: Date;
  remark?: string;
  extraFields?: Record<string, any>;
}

export interface MaterialCostQueryDto extends PaginationDto {
  materialId?: string;
  orderId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface MaterialCostStats {
  totalCost: number;
  averageUnitCost: number;
  totalQuantity: number;
  recordCount: number;
}

@Injectable()
export class MaterialService extends BaseCrudService<Material> {
  constructor(
    @InjectRepository(Material)
    protected readonly repository: Repository<Material>,
    private readonly notificationService: NotificationService,
  ) {
    super(repository, '耗材');
  }

  protected override getKeywordField(): string {
    return 'materialName';
  }

  async findAllWithFilters(query: MaterialQueryDto) {
    const where: FindOptionsWhere<Material> = {};

    if (query.category) {
      where.category = query.category;
    }
    if (query.isActive !== undefined && query.isActive !== null) {
      (where as any).isActive = query.isActive;
    }

    const result = await this.findAll(query, where);

    if (query.lowStock) {
      result.list = result.list.filter((m: any) => m.currentStock <= m.safetyStock);
      result.total = result.list.length;
      result.totalPages = Math.ceil(result.total / (query.pageSize || 20));
    }

    return result;
  }

  async findByCategory(category: MaterialCategory): Promise<Material[]> {
    return this.repository.find({
      where: { category, isActive: true } as any,
      order: { materialName: 'ASC' } as any,
    });
  }

  async findLowStock(): Promise<Material[]> {
    const materials = await this.repository.find({
      where: { isActive: true } as any,
    });
    return materials.filter((m: any) => m.currentStock <= m.safetyStock);
  }

  async checkLowStockAndNotify(): Promise<Material[]> {
    const lowStockMaterials = await this.findLowStock();

    for (const material of lowStockMaterials) {
      this.notificationService.create({
        type: 'shortage',
        title: '耗材库存预警',
        message: `耗材【${material.materialName}】当前库存 ${material.currentStock}${material.stockUnit || ''}，低于安全库存 ${material.safetyStock}${material.stockUnit || ''}，请及时补货。`,
        level: material.currentStock === 0 ? 'danger' : 'warning',
        relatedId: material.id,
      });
    }

    return lowStockMaterials;
  }

  async findOneWithRelations(id: string): Promise<Material> {
    const material = await this.repository.findOne({
      where: { id } as any,
      relations: ['materialCosts'],
    });
    if (!material) {
      throw new BadRequestException('耗材不存在');
    }
    return material;
  }

  override async create(dto: CreateMaterialDto, createdBy?: string): Promise<Material> {
    const existing = await this.repository.findOne({
      where: { materialCode: dto.materialCode } as any,
    });
    if (existing) {
      throw new BadRequestException('耗材编码已存在');
    }
    return super.create(dto, createdBy);
  }

  override async update(id: string, dto: UpdateMaterialDto, updatedBy?: string): Promise<Material> {
    if (dto.materialCode) {
      const existing = await this.repository.findOne({
        where: { materialCode: dto.materialCode } as any,
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException('耗材编码已存在');
      }
    }

    const material = await this.findOne(id);
    const oldStock = material.currentStock;
    const result = await super.update(id, dto, updatedBy);

    if (dto.currentStock !== undefined && oldStock > material.safetyStock && dto.currentStock <= material.safetyStock) {
      this.notificationService.create({
        type: 'shortage',
        title: '耗材库存预警',
        message: `耗材【${result.materialName}】当前库存 ${dto.currentStock}${result.stockUnit || ''}，低于安全库存 ${result.safetyStock}${result.stockUnit || ''}，请及时补货。`,
        level: dto.currentStock === 0 ? 'danger' : 'warning',
        relatedId: id,
      });
    }

    return result;
  }
}

@Injectable()
export class MaterialCostService extends BaseCrudService<MaterialCost> {
  constructor(
    @InjectRepository(MaterialCost)
    protected readonly repository: Repository<MaterialCost>,
    @InjectRepository(Material)
    private readonly materialRepository: Repository<Material>,
    private readonly notificationService: NotificationService,
  ) {
    super(repository, '耗材成本');
  }

  async findAllWithFilters(query: MaterialCostQueryDto) {
    const where: FindOptionsWhere<MaterialCost> = {};

    if (query.materialId) {
      (where as any).materialId = query.materialId;
    }
    if (query.orderId) {
      (where as any).orderId = query.orderId;
    }
    if (query.startDate && query.endDate) {
      (where as any).costDate = Between(new Date(query.startDate), new Date(query.endDate));
    } else if (query.startDate) {
      (where as any).costDate = Between(new Date(query.startDate), new Date());
    }

    return this.findAll(query, where);
  }

  async findByMaterialId(materialId: string): Promise<MaterialCost[]> {
    return this.repository.find({
      where: { materialId } as any,
      order: { costDate: 'DESC' } as any,
      relations: ['material', 'order'],
    });
  }

  async findByDateRange(startDate: Date, endDate: Date, materialId?: string): Promise<MaterialCost[]> {
    const where: FindOptionsWhere<MaterialCost> = {
      costDate: Between(new Date(startDate), new Date(endDate)),
    } as any;

    if (materialId) {
      (where as any).materialId = materialId;
    }

    return this.repository.find({
      where,
      order: { costDate: 'ASC' } as any,
      relations: ['material'],
    });
  }

  async findOneWithRelations(id: string): Promise<MaterialCost> {
    const cost = await this.repository.findOne({
      where: { id } as any,
      relations: ['material', 'order'],
    });
    if (!cost) {
      throw new BadRequestException('耗材成本记录不存在');
    }
    return cost;
  }

  override async create(dto: CreateMaterialCostDto, createdBy?: string): Promise<MaterialCost> {
    const totalCost = dto.totalCost !== undefined
      ? dto.totalCost
      : dto.quantityUsed * dto.unitCost;

    const cost = this.repository.create({
      ...dto,
      totalCost,
      costDate: dto.costDate || new Date(),
      createdBy,
      updatedBy: createdBy,
    });

    const saved = await this.repository.save(cost);

    if (dto.materialId && dto.quantityUsed) {
      const material = await this.materialRepository.findOne({
        where: { id: dto.materialId } as any,
      });
      if (material) {
        const newStock = (material.currentStock as any) - dto.quantityUsed;
        await this.materialRepository.update(material.id, {
          currentStock: newStock,
          updatedBy: createdBy,
        } as any);

        if (newStock <= (material.safetyStock as any)) {
          this.notificationService.create({
            type: 'shortage',
            title: '耗材库存预警',
            message: `耗材【${material.materialName}】因消耗减少库存，当前库存 ${newStock}${material.stockUnit || ''}，低于安全库存 ${material.safetyStock}${material.stockUnit || ''}，请及时补货。`,
            level: newStock === 0 ? 'danger' : 'warning',
            relatedId: material.id,
          });
        }
      }
    }

    return this.findOneWithRelations(saved.id);
  }

  override async update(id: string, dto: UpdateMaterialCostDto, updatedBy?: string): Promise<MaterialCost> {
    const cost = await this.findOne(id);

    let totalCost = cost.totalCost;
    if (dto.quantityUsed !== undefined || dto.unitCost !== undefined) {
      const quantityUsed = dto.quantityUsed ?? cost.quantityUsed;
      const unitCost = dto.unitCost ?? cost.unitCost;
      totalCost = quantityUsed * unitCost;
    }

    this.repository.merge(cost as any, {
      ...dto,
      totalCost,
      updatedBy,
    });

    await this.repository.save(cost);
    return this.findOneWithRelations(id);
  }

  async getStats(materialId?: string, startDate?: Date, endDate?: Date): Promise<MaterialCostStats> {
    const where: FindOptionsWhere<MaterialCost> = {} as any;

    if (materialId) {
      (where as any).materialId = materialId;
    }
    if (startDate && endDate) {
      (where as any).costDate = Between(new Date(startDate), new Date(endDate));
    }

    const costs = await this.repository.find({ where });

    if (costs.length === 0) {
      return {
        totalCost: 0,
        averageUnitCost: 0,
        totalQuantity: 0,
        recordCount: 0,
      };
    }

    const totalCost = costs.reduce((sum: number, c: any) => sum + parseFloat(c.totalCost), 0);
    const totalQuantity = costs.reduce((sum: number, c: any) => sum + parseFloat(c.quantityUsed), 0);
    const totalUnitCost = costs.reduce((sum: number, c: any) => sum + parseFloat(c.unitCost), 0);

    return {
      totalCost: Number(totalCost.toFixed(2)),
      averageUnitCost: Number((totalUnitCost / costs.length).toFixed(2)),
      totalQuantity: Number(totalQuantity.toFixed(2)),
      recordCount: costs.length,
    };
  }
}
