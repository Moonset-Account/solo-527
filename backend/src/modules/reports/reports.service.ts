import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Report, ReportType, ReportFormat } from '../../entities/report.entity';
import { OperationLog, OperationType } from '../../entities/operation-log.entity';
import { StatisticsService } from '../statistics/statistics.service';

export interface GenerateReportDto {
  title: string;
  type: ReportType;
  format: ReportFormat;
  dataScope: string;
  startTime: Date;
  endTime: Date;
  filters?: Record<string, any>;
  notes?: string;
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private reportRepository: Repository<Report>,
    @InjectRepository(OperationLog)
    private operationLogRepository: Repository<OperationLog>,
    private statisticsService: StatisticsService,
  ) {}

  async getReportList(
    type?: ReportType,
    startTime?: Date,
    endTime?: Date,
    initiatorId?: string,
    page: number = 1,
    pageSize: number = 10,
  ) {
    const whereConditions: any = {};

    if (type) {
      whereConditions.type = type;
    }

    if (initiatorId) {
      whereConditions.initiatorId = initiatorId;
    }

    if (startTime && endTime) {
      whereConditions.createdAt = Between(startTime, endTime);
    }

    const skip = (page - 1) * pageSize;

    const [reports, total] = await this.reportRepository.findAndCount({
      where: whereConditions,
      order: { createdAt: 'DESC' },
      skip,
      take: pageSize,
      relations: ['initiator'],
    });

    return {
      list: reports.map((r) => ({
        id: r.id,
        title: r.title,
        type: r.type,
        format: r.format,
        initiatorId: r.initiatorId,
        initiatorName: r.initiator?.name,
        dataScope: r.dataScope,
        statisticalCaliber: r.statisticalCaliber,
        startTime: r.startTime,
        endTime: r.endTime,
        filters: r.filters,
        summaryData: r.summaryData,
        downloadCount: r.downloadCount,
        notes: r.notes,
        createdAt: r.createdAt,
      })),
      total,
      page,
      pageSize,
    };
  }

  async generateReport(dto: GenerateReportDto, user: any) {
    if (dto.startTime > dto.endTime) {
      throw new BadRequestException('开始时间不能晚于结束时间');
    }

    let reportData: any;
    let statisticalCaliber = '';

    switch (dto.type) {
      case ReportType.SERVICE_REPURCHASE:
        reportData = await this.statisticsService.getServiceRepurchaseStatistics(
          dto.startTime,
          dto.endTime,
        );
        statisticalCaliber = reportData.statisticalCaliber;
        break;

      case ReportType.FOSTER_SAFETY:
        reportData = await this.statisticsService.getFosterSafetyStatistics(
          dto.startTime,
          dto.endTime,
        );
        statisticalCaliber = reportData.statisticalCaliber;
        break;

      case ReportType.APPOINTMENT_SUMMARY:
        reportData = await this.statisticsService.getAppointmentOverview(
          dto.startTime,
          dto.endTime,
        );
        statisticalCaliber = reportData.statisticalCaliber;
        break;

      case ReportType.ADOPTION_STATISTICS:
        reportData = await this.statisticsService.getAdoptionOverview(
          dto.startTime,
          dto.endTime,
        );
        statisticalCaliber = reportData.statisticalCaliber;
        break;

      case ReportType.CUSTOM:
        statisticalCaliber = dto.filters?.statisticalCaliber || '自定义统计报表，具体口径由筛选条件决定';
        reportData = {
          message: '自定义报表数据',
          filters: dto.filters,
          statisticalCaliber,
        };
        break;

      default:
        reportData = await this.statisticsService.getAppointmentOverview(
          dto.startTime,
          dto.endTime,
        );
        statisticalCaliber = reportData.statisticalCaliber || '通用统计报表';
    }

    const report = this.reportRepository.create({
      title: dto.title,
      type: dto.type,
      format: dto.format,
      initiatorId: user.sub || user.id,
      dataScope: dto.dataScope,
      statisticalCaliber,
      startTime: dto.startTime,
      endTime: dto.endTime,
      filters: dto.filters || {},
      summaryData: reportData,
      notes: dto.notes,
      downloadCount: 0,
    });

    const savedReport = await this.reportRepository.save(report);

    await this.operationLogRepository.save({
      operatorId: user.sub || user.id,
      module: 'reports',
      operationType: OperationType.CREATE,
      targetId: savedReport.id,
      description: `生成报表: ${dto.title} (类型: ${dto.type})`,
    });

    return {
      id: savedReport.id,
      title: savedReport.title,
      type: savedReport.type,
      format: savedReport.format,
      dataScope: savedReport.dataScope,
      statisticalCaliber: savedReport.statisticalCaliber,
      startTime: savedReport.startTime,
      endTime: savedReport.endTime,
      filters: savedReport.filters,
      summaryData: savedReport.summaryData,
      downloadCount: savedReport.downloadCount,
      notes: savedReport.notes,
      createdAt: savedReport.createdAt,
    };
  }

  async getReportById(id: string) {
    const report = await this.reportRepository.findOne({
      where: { id },
      relations: ['initiator'],
    });

    if (!report) {
      throw new NotFoundException('报表不存在');
    }

    return {
      id: report.id,
      title: report.title,
      type: report.type,
      format: report.format,
      initiatorId: report.initiatorId,
      initiatorName: report.initiator?.name,
      dataScope: report.dataScope,
      statisticalCaliber: report.statisticalCaliber,
      startTime: report.startTime,
      endTime: report.endTime,
      filters: report.filters,
      summaryData: report.summaryData,
      filePath: report.filePath,
      downloadCount: report.downloadCount,
      notes: report.notes,
      createdAt: report.createdAt,
    };
  }

  async incrementDownloadCount(id: string, user: any) {
    const report = await this.reportRepository.findOne({ where: { id } });

    if (!report) {
      throw new NotFoundException('报表不存在');
    }

    report.downloadCount = (report.downloadCount || 0) + 1;
    await this.reportRepository.save(report);

    await this.operationLogRepository.save({
      operatorId: user.sub || user.id,
      module: 'reports',
      operationType: OperationType.EXPORT,
      targetId: report.id,
      description: `下载报表: ${report.title}`,
    });

    return {
      id: report.id,
      title: report.title,
      downloadCount: report.downloadCount,
      message: '下载计数已增加',
    };
  }
}
