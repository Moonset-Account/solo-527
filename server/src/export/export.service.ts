import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { Feedback } from '../feedback/feedback.entity.js';
import { AfterSaleOrder } from '../after-sale/after-sale.entity.js';
import { Budget } from '../budget/budget.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(Budget)
    private budgetRepo: Repository<Budget>,
  ) {}

  exportFeedbacks(feedbacks: Feedback[]): Buffer {
    const data = feedbacks.map((f) => ({
      项目名称: f.project?.name || '',
      客户名称: f.customer?.name || '',
      阶段: f.stage,
      评分: f.rating,
      内容: f.content || '',
      建议: f.suggestion || '',
      创建时间: f.createdAt?.toISOString() || '',
    }));

    return this.createExcelBuffer(data, '满意度报告');
  }

  exportAfterSaleReport(orders: AfterSaleOrder[]): Buffer {
    const data = orders.map((o) => ({
      项目名称: o.project?.name || '',
      客户名称: o.customer?.name || '',
      标题: o.title,
      描述: o.description || '',
      优先级: o.priority || '',
      状态: o.status,
      处理人: o.assignee?.name || '',
      处理备注: o.resolutionNote || '',
      创建时间: o.createdAt?.toISOString() || '',
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
      预算名称: budget.name,
      版本: budget.version,
      状态: budget.status,
      小计: Number(budget.subtotal),
      管理费: Number(budget.managementFee),
      设计费: Number(budget.designFee),
      税额: Number(budget.taxAmount),
      总金额: Number(budget.totalAmount),
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
}
