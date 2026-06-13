import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { Feedback } from '../feedback/feedback.entity.js';
import { AfterSaleOrder } from '../after-sale/after-sale.entity.js';
import { Budget } from '../budget/budget.entity.js';
import { ExportLog, ExportType, ExportFormat } from './export-log.entity.js';
import { ExportLogFilterDto } from './dto.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like } from 'typeorm';

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(Budget)
    private budgetRepo: Repository<Budget>,
    @InjectRepository(ExportLog)
    private exportLogRepo: Repository<ExportLog>,
  ) {}

  exportFeedbacks(feedbacks: Feedback[]): Buffer {
    const stageLabels: Record<string, string> = {
      design: '设计阶段',
      construction: '施工阶段',
      completion: '竣工阶段',
    };

    const data = feedbacks.map((f, index) => ({
      序号: index + 1,
      项目名称: f.project?.name || '',
      客户名称: f.customer?.name || '',
      联系电话: f.customer?.phone || '',
      阶段: stageLabels[f.stage] || f.stage,
      综合评分: f.rating,
      施工质量: f.qualityRating || '-',
      服务态度: f.serviceRating || '-',
      工期控制: f.scheduleRating || '-',
      沟通效率: f.communicationRating || '-',
      造价控制: f.costRating || '-',
      客户评价: f.comment || '',
      改进建议: f.suggestion || '',
      是否推荐: f.wouldRecommend === null ? '-' : f.wouldRecommend ? '是' : '否',
      创建时间: f.createdAt ? new Date(f.createdAt).toLocaleString('zh-CN') : '',
    }));

    const wb = XLSX.utils.book_new();
    const dataWs = XLSX.utils.json_to_sheet(data);
    
    const avgQuality = this.calculateAverage(feedbacks.map(f => f.qualityRating));
    const avgService = this.calculateAverage(feedbacks.map(f => f.serviceRating));
    const avgSchedule = this.calculateAverage(feedbacks.map(f => f.scheduleRating));
    const avgCommunication = this.calculateAverage(feedbacks.map(f => f.communicationRating));
    const avgCost = this.calculateAverage(feedbacks.map(f => f.costRating));
    const avgRating = this.calculateAverage(feedbacks.map(f => f.rating));
    const recommendRate = feedbacks.filter(f => f.wouldRecommend === true).length / 
      Math.max(feedbacks.filter(f => f.wouldRecommend !== null && f.wouldRecommend !== undefined).length, 1);

    const summaryData = [
      { 统计项: '总评价数', 数值: feedbacks.length },
      { 统计项: '综合平均分', 数值: avgRating },
      { 统计项: '施工质量平均分', 数值: avgQuality },
      { 统计项: '服务态度平均分', 数值: avgService },
      { 统计项: '工期控制平均分', 数值: avgSchedule },
      { 统计项: '沟通效率平均分', 数值: avgCommunication },
      { 统计项: '造价控制平均分', 数值: avgCost },
      { 统计项: '推荐率', 数值: `${Math.round(recommendRate * 100)}%` },
      { 统计项: '1星评价', 数值: feedbacks.filter(f => f.rating === 1).length },
      { 统计项: '2星评价', 数值: feedbacks.filter(f => f.rating === 2).length },
      { 统计项: '3星评价', 数值: feedbacks.filter(f => f.rating === 3).length },
      { 统计项: '4星评价', 数值: feedbacks.filter(f => f.rating === 4).length },
      { 统计项: '5星评价', 数值: feedbacks.filter(f => f.rating === 5).length },
    ];
    const summaryWs = XLSX.utils.json_to_sheet(summaryData);

    dataWs['!cols'] = [
      { wch: 6 }, { wch: 20 }, { wch: 12 }, { wch: 15 }, { wch: 10 },
      { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
      { wch: 12 }, { wch: 30 }, { wch: 30 }, { wch: 10 }, { wch: 22 }
    ];
    summaryWs['!cols'] = [{ wch: 20 }, { wch: 20 }];

    XLSX.utils.book_append_sheet(wb, summaryWs, '统计汇总');
    XLSX.utils.book_append_sheet(wb, dataWs, '满意度明细');

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  private calculateAverage(arr: (number | null | undefined)[]): number {
    const valid = arr.filter(v => v !== null && v !== undefined) as number[];
    if (valid.length === 0) return 0;
    return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length * 10) / 10;
  }

  exportAfterSaleReport(orders: AfterSaleOrder[]): Buffer {
    const data = orders.map((o) => ({
      项目名称: o.project?.name || '',
      标题: o.title,
      描述: o.description || '',
      状态: o.status,
      处理人ID: o.assigneeId || '',
      创建时间: o.createdAt?.toISOString() || '',
      解决时间: o.resolvedAt?.toISOString() || '',
      关闭时间: o.closedAt?.toISOString() || '',
    }));

    return this.createExcelBuffer(data, '售后月报');
  }

  async exportBudget(budgetId: string): Promise<Buffer> {
    const budget = await this.budgetRepo.findOne({
      where: { id: budgetId },
      relations: ['items', 'items.materials'],
    });

    if (!budget) throw new Error('Budget not found');

    const headerData = [{
      版本: budget.version,
      状态: budget.status,
      人工费: Number(budget.laborCost),
      材料费: Number(budget.materialCost),
      总金额: Number(budget.totalCost),
      变更原因: budget.changeReason || '',
    }];

    const itemData = budget.items?.map((item) => ({
      项目名称: item.name,
      类别: item.category || '',
      数量: Number(item.quantity),
      单位: item.unit || '',
      单价: Number(item.unitPrice),
      人工费: Number(item.laborCost),
      总价: Number(item.totalPrice),
    })) || [];

    const wb = XLSX.utils.book_new();
    const headerWs = XLSX.utils.json_to_sheet(headerData);
    const itemWs = XLSX.utils.json_to_sheet(itemData);
    XLSX.utils.book_append_sheet(wb, headerWs, '预算概览');
    XLSX.utils.book_append_sheet(wb, itemWs, '预算明细');

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  private createExcelBuffer(data: any[], sheetName: string): Buffer {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  exportFeedbacksCsv(feedbacks: Feedback[]): string {
    const stageLabels: Record<string, string> = {
      design: '设计阶段',
      construction: '施工阶段',
      completion: '竣工阶段',
    };

    const headers = [
      '序号', '项目名称', '客户名称', '联系电话', '阶段', '综合评分',
      '施工质量', '服务态度', '工期控制', '沟通效率', '造价控制',
      '客户评价', '改进建议', '是否推荐', '创建时间'
    ];

    const rows = feedbacks.map((f, index) => [
      index + 1,
      f.project?.name || '',
      f.customer?.name || '',
      f.customer?.phone || '',
      stageLabels[f.stage] || f.stage,
      f.rating,
      f.qualityRating || '-',
      f.serviceRating || '-',
      f.scheduleRating || '-',
      f.communicationRating || '-',
      f.costRating || '-',
      `"${(f.comment || '').replace(/"/g, '""')}"`,
      `"${(f.suggestion || '').replace(/"/g, '""')}"`,
      f.wouldRecommend === null ? '-' : f.wouldRecommend ? '是' : '否',
      f.createdAt ? new Date(f.createdAt).toLocaleString('zh-CN') : '',
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  exportAfterSaleReportCsv(orders: AfterSaleOrder[]): string {
    const headers = ['项目名称', '标题', '描述', '状态', '处理人ID', '创建时间', '解决时间', '关闭时间'];
    const rows = orders.map((o) => [
      o.project?.name || '',
      `"${(o.title || '').replace(/"/g, '""')}"`,
      `"${(o.description || '').replace(/"/g, '""')}"`,
      o.status,
      o.assigneeId || '',
      o.createdAt?.toISOString() || '',
      o.resolvedAt?.toISOString() || '',
      o.closedAt?.toISOString() || '',
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  async logExport(
    type: ExportType,
    format: ExportFormat,
    fileName: string,
    recordCount: number,
    fileSize: number,
    userId: string,
    filters?: Record<string, any>,
  ): Promise<ExportLog> {
    const log = this.exportLogRepo.create({
      type,
      format,
      fileName,
      recordCount,
      fileSize,
      userId,
      filters,
    });
    return this.exportLogRepo.save(log);
  }

  async getExportLogs(dto: ExportLogFilterDto): Promise<{ data: ExportLog[]; total: number }> {
    const { page = 1, limit = 20, type, format, userId } = dto;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<ExportLog> = {};
    if (type) where.type = type;
    if (format) where.format = format;
    if (userId) where.userId = userId;

    const [data, total] = await this.exportLogRepo.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { data, total };
  }
}
