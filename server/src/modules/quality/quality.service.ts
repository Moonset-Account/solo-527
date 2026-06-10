import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between } from 'typeorm';
import { QualityInspection, InspectionResult } from '../../entities';
import { BaseCrudService } from '../../common/services/base-crud.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { NotificationService } from '../../common/services/notification.service';
import { SystemConfigService } from '../system-config/system-config.service';

export interface CreateQualityInspectionDto {
  orderId: string;
  nodeId?: string;
  inspectionType: string;
  inspectionItem?: string;
  inspectedQuantity: number;
  passedQuantity?: number;
  failedQuantity?: number;
  passRate?: number;
  result?: InspectionResult;
  defectDescription?: string;
  handlingSuggestion?: string;
  inspector?: string;
  inspectionTime?: Date;
  inspectionData?: Record<string, any>;
  extraFields?: Record<string, any>;
}

export interface UpdateQualityInspectionDto {
  orderId?: string;
  nodeId?: string;
  inspectionType?: string;
  inspectionItem?: string;
  inspectedQuantity?: number;
  passedQuantity?: number;
  failedQuantity?: number;
  passRate?: number;
  result?: InspectionResult;
  defectDescription?: string;
  handlingSuggestion?: string;
  inspector?: string;
  inspectionTime?: Date;
  inspectionData?: Record<string, any>;
  extraFields?: Record<string, any>;
}

export interface QualityQueryDto extends PaginationDto {
  orderId?: string;
  result?: InspectionResult;
  startDate?: Date;
  endDate?: Date;
  inspectionType?: string;
  inspector?: string;
}

export interface QualityStatisticsDto {
  startDate?: Date;
  endDate?: Date;
  orderId?: string;
  inspectionType?: string;
}

export interface QualityStatisticsResult {
  totalInspections: number;
  totalInspectedQuantity: number;
  totalPassedQuantity: number;
  totalFailedQuantity: number;
  overallPassRate: number;
  passedCount: number;
  failedCount: number;
  partialCount: number;
  pendingCount: number;
  resultDistribution: {
    passed: number;
    failed: number;
    partial: number;
    pending: number;
  };
  threshold: number;
  isBelowThreshold: boolean;
}

@Injectable()
export class QualityInspectionService extends BaseCrudService<QualityInspection> {
  constructor(
    @InjectRepository(QualityInspection)
    protected readonly repository: Repository<QualityInspection>,
    private readonly notificationService: NotificationService,
    private readonly systemConfigService: SystemConfigService,
  ) {
    super(repository, '质检记录');
  }

  protected override getKeywordField(): string {
    return 'inspectionItem';
  }

  async findAllWithFilters(query: QualityQueryDto) {
    const where: FindOptionsWhere<QualityInspection> = {};

    if (query.orderId) {
      (where as any).orderId = query.orderId;
    }
    if (query.result) {
      (where as any).result = query.result;
    }
    if (query.inspectionType) {
      (where as any).inspectionType = query.inspectionType;
    }
    if (query.inspector) {
      (where as any).inspector = query.inspector;
    }
    if (query.startDate && query.endDate) {
      (where as any).createdAt = Between(new Date(query.startDate), new Date(query.endDate));
    }

    return this.findAll(query, where);
  }

  async findByOrderId(orderId: string): Promise<QualityInspection[]> {
    return this.repository.find({
      where: { orderId } as any,
      order: { createdAt: 'DESC' } as any,
      relations: ['order'],
    });
  }

  async findOneWithRelations(id: string): Promise<QualityInspection> {
    const inspection = await this.repository.findOne({
      where: { id } as any,
      relations: ['order'],
    });
    if (!inspection) {
      throw new BadRequestException('质检记录不存在');
    }
    return inspection;
  }

  private calculatePassRate(
    inspectedQuantity: number,
    passedQuantity: number,
  ): number {
    if (inspectedQuantity <= 0) return 0;
    return Number(((passedQuantity / inspectedQuantity) * 100).toFixed(2));
  }

  private determineResult(
    passRate: number,
    inspectedQuantity: number,
    failedQuantity: number,
  ): InspectionResult {
    if (inspectedQuantity === 0) return 'pending';
    if (failedQuantity === 0) return 'passed';
    if (passRate >= 100) return 'passed';
    if (passRate <= 0) return 'failed';
    return 'partial';
  }

  private getPassRateThreshold(): number {
    const threshold = this.systemConfigService.getConfigValue('quality.pass_rate_threshold');
    return parseFloat(threshold) || 95;
  }

  private checkAndSendAlert(
    passRate: number,
    inspection: QualityInspection,
  ): void {
    const threshold = this.getPassRateThreshold();
    if (passRate < threshold) {
      this.notificationService.create({
        type: 'quality',
        title: '质检合格率预警',
        message: `质检合格率为 ${passRate}%，低于阈值 ${threshold}%。订单ID: ${inspection.orderId}，检查项: ${inspection.inspectionItem || inspection.inspectionType}`,
        level: passRate < threshold - 10 ? 'danger' : 'warning',
        relatedId: inspection.id,
      });
    }
  }

  override async create(dto: CreateQualityInspectionDto, createdBy?: string): Promise<QualityInspection> {
    const passedQuantity = dto.passedQuantity ?? 0;
    const failedQuantity = dto.failedQuantity ?? 0;
    const inspectedQuantity = dto.inspectedQuantity || passedQuantity + failedQuantity;
    const passRate = dto.passRate ?? this.calculatePassRate(inspectedQuantity, passedQuantity);
    const result = dto.result ?? this.determineResult(passRate, inspectedQuantity, failedQuantity);

    const inspection = this.repository.create({
      ...dto,
      inspectedQuantity,
      passedQuantity,
      failedQuantity,
      passRate,
      result,
      createdBy,
      updatedBy: createdBy,
    });

    const saved = await this.repository.save(inspection);

    this.checkAndSendAlert(passRate, saved);

    return saved;
  }

  override async update(id: string, dto: UpdateQualityInspectionDto, updatedBy?: string): Promise<QualityInspection> {
    const inspection = await this.findOne(id);

    const passedQuantity = dto.passedQuantity ?? inspection.passedQuantity;
    const failedQuantity = dto.failedQuantity ?? inspection.failedQuantity;
    const inspectedQuantity = dto.inspectedQuantity ?? (inspection.inspectedQuantity || passedQuantity + failedQuantity);
    const passRate = dto.passRate ?? this.calculatePassRate(inspectedQuantity, passedQuantity);
    const result = dto.result ?? this.determineResult(passRate, inspectedQuantity, failedQuantity);

    this.repository.merge(inspection as any, {
      ...dto,
      inspectedQuantity,
      passedQuantity,
      failedQuantity,
      passRate,
      result,
      updatedBy,
    });

    const saved = await this.repository.save(inspection);

    this.checkAndSendAlert(passRate, saved);

    return saved;
  }

  async getStatistics(query: QualityStatisticsDto): Promise<QualityStatisticsResult> {
    const where: FindOptionsWhere<QualityInspection> = {};

    if (query.orderId) {
      (where as any).orderId = query.orderId;
    }
    if (query.inspectionType) {
      (where as any).inspectionType = query.inspectionType;
    }
    if (query.startDate && query.endDate) {
      (where as any).createdAt = Between(new Date(query.startDate), new Date(query.endDate));
    }

    const inspections = await this.repository.find({ where });

    const totalInspections = inspections.length;
    let totalInspectedQuantity = 0;
    let totalPassedQuantity = 0;
    let totalFailedQuantity = 0;
    let passedCount = 0;
    let failedCount = 0;
    let partialCount = 0;
    let pendingCount = 0;

    inspections.forEach((ins) => {
      totalInspectedQuantity += ins.inspectedQuantity || 0;
      totalPassedQuantity += ins.passedQuantity || 0;
      totalFailedQuantity += ins.failedQuantity || 0;
      switch (ins.result) {
        case 'passed':
          passedCount++;
          break;
        case 'failed':
          failedCount++;
          break;
        case 'partial':
          partialCount++;
          break;
        case 'pending':
          pendingCount++;
          break;
      }
    });

    const overallPassRate = this.calculatePassRate(totalInspectedQuantity, totalPassedQuantity);
    const threshold = this.getPassRateThreshold();
    const isBelowThreshold = totalInspections > 0 && overallPassRate < threshold;

    if (isBelowThreshold) {
      this.notificationService.create({
        type: 'quality',
        title: '质检合格率统计预警',
        message: `统计周期内总体合格率为 ${overallPassRate}%，低于阈值 ${threshold}%。共 ${totalInspections} 次质检，检查 ${totalInspectedQuantity} 件产品。`,
        level: overallPassRate < threshold - 10 ? 'danger' : 'warning',
      });
    }

    return {
      totalInspections,
      totalInspectedQuantity,
      totalPassedQuantity,
      totalFailedQuantity,
      overallPassRate,
      passedCount,
      failedCount,
      partialCount,
      pendingCount,
      resultDistribution: {
        passed: passedCount,
        failed: failedCount,
        partial: partialCount,
        pending: pendingCount,
      },
      threshold,
      isBelowThreshold,
    };
  }
}
