import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import * as dayjs from 'dayjs';
import { ExportRecord, ExportType, ExportFormat } from '../../entities';
import { ExportService, ExportColumn } from '../../common/services/export.service';
import { OrderService, OrderQueryDto } from '../order/order.service';
import { SystemConfigService } from '../system-config/system-config.service';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

export interface SaveExportRecordDto {
  exportName: string;
  exportType: ExportType;
  exportFormat?: ExportFormat;
  filterCriteria: Record<string, any>;
  exportFields?: string[];
  recordCount: number;
  filePath?: string;
  fileName?: string;
  operator: string;
  operatorRole?: string;
  extraInfo?: Record<string, any>;
}

export interface ExportRecordQueryDto extends PaginationDto {
  exportType?: ExportType;
  startTime?: Date;
  endTime?: Date;
}

export interface OrderExportDto {
  filterCriteria: OrderQueryDto;
  operator: string;
  operatorRole?: string;
}

@Injectable()
export class ExportRecordService {
  constructor(
    @InjectRepository(ExportRecord)
    private readonly exportRecordRepository: Repository<ExportRecord>,
  ) {}

  async saveRecord(dto: SaveExportRecordDto): Promise<ExportRecord> {
    const record = this.exportRecordRepository.create({
      exportName: dto.exportName,
      exportType: dto.exportType,
      exportFormat: dto.exportFormat || 'xlsx',
      filterCriteria: dto.filterCriteria,
      exportFields: dto.exportFields,
      recordCount: dto.recordCount,
      filePath: dto.filePath,
      fileName: dto.fileName,
      operator: dto.operator,
      operatorRole: dto.operatorRole,
      exportTime: new Date(),
      extraInfo: dto.extraInfo,
    });
    return this.exportRecordRepository.save(record);
  }

  async findByType(query: ExportRecordQueryDto): Promise<PaginatedResult<ExportRecord>> {
    const where: FindOptionsWhere<ExportRecord> = {};

    if (query.exportType) {
      where.exportType = query.exportType;
    }

    if (query.startTime && query.endTime) {
      where.exportTime = Between(new Date(query.startTime), new Date(query.endTime));
    } else if (query.startTime) {
      where.exportTime = Between(new Date(query.startTime), new Date());
    }

    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const [list, total] = await this.exportRecordRepository.findAndCount({
      where,
      skip,
      take: pageSize,
      order: { exportTime: 'DESC' },
    });

    return {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findById(id: string): Promise<ExportRecord> {
    return this.exportRecordRepository.findOne({ where: { id } as any });
  }
}

@Injectable()
export class OrderExportService {
  constructor(
    private readonly exportService: ExportService,
    private readonly orderService: OrderService,
    private readonly systemConfigService: SystemConfigService,
    private readonly exportRecordService: ExportRecordService,
  ) {}

  async exportOrders(dto: OrderExportDto): Promise<Buffer> {
    const fieldConfig = this.systemConfigService.getConfigJson<any[]>('export.fields.order') || [];
    const columns: ExportColumn[] = fieldConfig.map(f => ({
      key: f.key,
      header: f.label,
      width: f.width,
      format: f.format,
    }));
    const exportFields = columns.map(c => c.key);

    const ordersResult = await this.orderService.findAllWithFilters({
      ...dto.filterCriteria,
      page: 1,
      pageSize: 100000,
    });
    const orders = ordersResult.list;

    const rows = orders.map(order => {
      const row: Record<string, any> = {};
      columns.forEach(col => {
        let value = (order as any)[col.key];
        if (col.key === 'customerName') {
          value = (order as any).customer?.name || '';
        } else if (col.key === 'salespersonName') {
          value = (order as any).salesperson?.name || '';
        } else if (col.key === 'status') {
          value = this.getStatusLabel(value);
        } else if (col.key === 'urgentLevel') {
          value = this.getUrgentLevelLabel(value);
        }
        row[col.key] = value;
      });
      return row;
    });

    const fileName = `订单导出_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
    const buffer = await this.exportService.exportToExcel({
      columns,
      rows,
      sheetName: '订单数据',
      title: '订单导出报表',
      filterInfo: dto.filterCriteria,
      operator: dto.operator,
    });

    await this.exportRecordService.saveRecord({
      exportName: '订单导出',
      exportType: 'order',
      exportFormat: 'xlsx',
      filterCriteria: dto.filterCriteria as any,
      exportFields,
      recordCount: orders.length,
      fileName,
      operator: dto.operator,
      operatorRole: dto.operatorRole,
      extraInfo: {
        generatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      },
    });

    return buffer;
  }

  private getStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
      pending: '待确认',
      confirmed: '已确认',
      in_production: '生产中',
      quality_check: '待质检',
      completed: '已完成',
      cancelled: '已取消',
    };
    return statusMap[status] || status;
  }

  private getUrgentLevelLabel(level: number): string {
    const levelMap: Record<number, string> = {
      0: '普通',
      1: '紧急',
      2: '特急',
    };
    return levelMap[level] || String(level);
  }
}
