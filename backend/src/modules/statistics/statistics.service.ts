import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Brackets } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { Order } from '../orders/entities/order.entity';
import { Settlement } from '../settlements/entities/settlement.entity';
import { Material } from '../materials/entities/material.entity';
import { SatisfactionLevel, OrderStatus } from '../../common/enums/order.enum';
import { MaterialStatus } from '../../common/enums/material.enum';
import { ExceptionType } from '../../common/enums/exception.enum';
import { StatisticsQueryDto, ExportQueryDto } from './dto/statistics.dto';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(Settlement)
    private settlementsRepository: Repository<Settlement>,
    @InjectRepository(Material)
    private materialsRepository: Repository<Material>,
  ) {}

  async getDashboard(query: StatisticsQueryDto) {
    const { startDate, endDate, photographerId } = this.getDateRange(query);

    const ordersQuery = this.ordersRepository
      .createQueryBuilder('o')
      .where('o.createdAt BETWEEN :start AND :end', { start: startDate, end: endDate });

    const settlementsQuery = this.settlementsRepository
      .createQueryBuilder('s')
      .where('s.createdAt BETWEEN :start AND :end', { start: startDate, end: endDate });

    if (photographerId) {
      ordersQuery.andWhere('o.photographerId = :pid', { pid: photographerId });
      settlementsQuery.andWhere('s.photographerId = :pid', { pid: photographerId });
    }

    const orders = await ordersQuery.getMany();
    const settlements = await settlementsQuery.getMany();

    const completedOrders = orders.filter((o) =>
      [OrderStatus.COMPLETED, OrderStatus.DELIVERED].includes(o.status),
    );

    const totalRevenue = completedOrders.reduce((s, o) => s + parseFloat(o.finalAmount.toString()), 0);
    const photographerIncome = completedOrders.reduce((s, o) => s + parseFloat(o.photographerIncome.toString()), 0);
    const platformIncome = completedOrders.reduce((s, o) => s + parseFloat(o.platformIncome.toString()), 0);

    const satisfactionData = completedOrders
      .filter((o) => o.satisfactionLevel)
      .reduce((acc: any, o) => {
        const level = o.satisfactionLevel as number;
        acc[level] = (acc[level] || 0) + 1;
        acc.total = (acc.total || 0) + level;
        acc.count = (acc.count || 0) + 1;
        return acc;
      }, {});

    const avgSatisfaction = satisfactionData.count
      ? (satisfactionData.total / satisfactionData.count).toFixed(2)
      : null;

    const settlementPaid = settlements.filter((s) => s.status === 'paid');
    const totalSettled = settlementPaid.reduce((s, x) => s + parseFloat(x.netAmount.toString()), 0);

    const topMaterials = await this.materialsRepository
      .createQueryBuilder('m')
      .select('m.id', 'id')
      .addSelect('m.title', 'title')
      .addSelect('m.saleCount', 'saleCount')
      .addSelect('m.viewCount', 'viewCount')
      .where('m.status = :status', { status: MaterialStatus.ON_SHELF })
      .orderBy('m.saleCount', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      overview: {
        totalOrders: orders.length,
        completedOrders: completedOrders.length,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        photographerIncome: parseFloat(photographerIncome.toFixed(2)),
        platformIncome: parseFloat(platformIncome.toFixed(2)),
        totalSettled: parseFloat(totalSettled.toFixed(2)),
        settlementCount: settlementPaid.length,
        pendingSettlement: parseFloat(
          settlements
            .filter((s) => s.status !== 'paid' && s.status !== 'cancelled')
            .reduce((s, x) => s + parseFloat(x.netAmount.toString()), 0)
            .toFixed(2),
        ),
      },
      satisfaction: {
        average: avgSatisfaction,
        count: satisfactionData.count || 0,
        distribution: {
          1: satisfactionData[1] || 0,
          2: satisfactionData[2] || 0,
          3: satisfactionData[3] || 0,
          4: satisfactionData[4] || 0,
          5: satisfactionData[5] || 0,
        },
      },
      topMaterials,
      byStatus: orders.reduce((acc: any, o) => {
        acc[o.status] = (acc[o.status] || 0) + 1;
        return acc;
      }, {}),
    };
  }

  async getTrend(query: StatisticsQueryDto) {
    const { startDate, endDate, granularity, photographerId } = this.getDateRange(query);

    const qb = this.ordersRepository
      .createQueryBuilder('o')
      .select(`DATE_TRUNC('${granularity}', o."createdAt")`, 'date')
      .addSelect('COUNT(o.id)', 'orderCount')
      .addSelect('SUM(o.finalAmount) FILTER (WHERE o.status IN (:...statuses))', 'revenue')
      .where('o.createdAt BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
        statuses: [OrderStatus.COMPLETED, OrderStatus.DELIVERED],
      })
      .addGroupBy('date')
      .orderBy('date', 'ASC');

    if (photographerId) {
      qb.andWhere('o.photographerId = :pid', { pid: photographerId });
    }

    return qb.getRawMany();
  }

  async getSatisfactionStats(query: StatisticsQueryDto) {
    const { startDate, endDate, photographerId, satisfactionLevel } = this.getDateRange(query);

    const qb = this.ordersRepository
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.client', 'client')
      .leftJoinAndSelect('o.photographer', 'photographer')
      .where('o.satisfactionLevel IS NOT NULL')
      .andWhere('o.createdAt BETWEEN :start AND :end', { start: startDate, end: endDate });

    if (photographerId) qb.andWhere('o.photographerId = :pid', { pid: photographerId });
    if (satisfactionLevel) qb.andWhere('o.satisfactionLevel = :sl', { sl: satisfactionLevel });

    const list = await qb.getMany();
    return {
      total: list.length,
      list,
      averageRating: list.length
        ? (list.reduce((s, o) => s + (o.satisfactionLevel as number), 0) / list.length).toFixed(2)
        : 0,
    };
  }

  async export(query: ExportQueryDto) {
    const { startDate, endDate, photographerId } = this.getDateRange(query);

    let workbook: ExcelJS.Workbook;
    let filename: string;

    switch (query.type) {
      case 'orders':
        workbook = await this.exportOrders(startDate, endDate, photographerId);
        filename = `订单报表_${this.formatDate(startDate)}_${this.formatDate(endDate)}.xlsx`;
        break;
      case 'settlements':
        workbook = await this.exportSettlements(startDate, endDate, photographerId);
        filename = `结算报表_${this.formatDate(startDate)}_${this.formatDate(endDate)}.xlsx`;
        break;
      case 'materials':
        workbook = await this.exportMaterials();
        filename = `素材报表_${this.formatDate(new Date())}.xlsx`;
        break;
      case 'satisfaction':
        workbook = await this.exportSatisfaction(startDate, endDate, photographerId);
        filename = `满意度报表_${this.formatDate(startDate)}_${this.formatDate(endDate)}.xlsx`;
        break;
      default:
        throw new BadRequestException('未知导出类型');
    }

    return { workbook, filename };
  }

  private async exportOrders(startDate: Date, endDate: Date, photographerId?: string): Promise<ExcelJS.Workbook> {
    const qb = this.ordersRepository
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.client', 'client')
      .leftJoinAndSelect('o.photographer', 'photographer')
      .where('o.createdAt BETWEEN :start AND :end', { start: startDate, end: endDate });
    if (photographerId) qb.andWhere('o.photographerId = :pid', { pid: photographerId });
    const orders = await qb.getMany();

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('订单报表');
    ws.columns = [
      { header: '订单号', key: 'orderNo', width: 22 },
      { header: '创建时间', key: 'createdAt', width: 20 },
      { header: '客户', key: 'client', width: 15 },
      { header: '摄影师', key: 'photographer', width: 15 },
      { header: '状态', key: 'status', width: 14 },
      { header: '订单金额', key: 'totalAmount', width: 12 },
      { header: '实付金额', key: 'finalAmount', width: 12 },
      { header: '摄影师收入', key: 'photographerIncome', width: 14 },
      { header: '平台收入', key: 'platformIncome', width: 12 },
      { header: '满意度', key: 'satisfaction', width: 10 },
      { header: '完成时间', key: 'completedAt', width: 20 },
    ];
    orders.forEach((o) => {
      ws.addRow({
        orderNo: o.orderNo,
        createdAt: new Date(o.createdAt).toLocaleString(),
        client: o.client?.name || '',
        photographer: o.photographer?.name || '',
        status: o.status,
        totalAmount: o.totalAmount,
        finalAmount: o.finalAmount,
        photographerIncome: o.photographerIncome,
        platformIncome: o.platformIncome,
        satisfaction: o.satisfactionLevel ? `${o.satisfactionLevel}星` : '未评',
        completedAt: o.completedAt ? new Date(o.completedAt).toLocaleString() : '',
      });
    });
    return wb;
  }

  private async exportSettlements(startDate: Date, endDate: Date, photographerId?: string): Promise<ExcelJS.Workbook> {
    const qb = this.settlementsRepository
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.photographer', 'photographer')
      .where('s.createdAt BETWEEN :start AND :end', { start: startDate, end: endDate });
    if (photographerId) qb.andWhere('s.photographerId = :pid', { pid: photographerId });
    const list = await qb.getMany();

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('结算报表');
    ws.columns = [
      { header: '结算单号', key: 'settlementNo', width: 22 },
      { header: '结算周期', key: 'settlementPeriod', width: 12 },
      { header: '摄影师', key: 'photographer', width: 15 },
      { header: '类型', key: 'type', width: 10 },
      { header: '状态', key: 'status', width: 12 },
      { header: '订单金额', key: 'orderAmount', width: 12 },
      { header: '分成比例', key: 'ratio', width: 10 },
      { header: '毛收入', key: 'grossAmount', width: 12 },
      { header: '扣款', key: 'deduction', width: 10 },
      { header: '调整', key: 'adjustment', width: 10 },
      { header: '净收入', key: 'netAmount', width: 12 },
      { header: '订单数', key: 'orderCount', width: 10 },
      { header: '创建时间', key: 'createdAt', width: 20 },
    ];
    list.forEach((s) => {
      ws.addRow({
        settlementNo: s.settlementNo,
        settlementPeriod: s.settlementPeriod,
        photographer: s.photographer?.name || '',
        type: s.type,
        status: s.status,
        orderAmount: s.orderAmount,
        ratio: `${(s.settlementRatio * 100).toFixed(1)}%`,
        grossAmount: s.grossAmount,
        deduction: s.deductionAmount,
        adjustment: s.adjustmentAmount,
        netAmount: s.netAmount,
        orderCount: s.orderCount,
        createdAt: new Date(s.createdAt).toLocaleString(),
      });
    });
    return wb;
  }

  private async exportMaterials(): Promise<ExcelJS.Workbook> {
    const materials = await this.materialsRepository.find({ relations: ['photographer'] });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('素材报表');
    ws.columns = [
      { header: '素材标题', key: 'title', width: 30 },
      { header: '分类', key: 'category', width: 12 },
      { header: '摄影师', key: 'photographer', width: 15 },
      { header: '状态', key: 'status', width: 12 },
      { header: '个人授权价', key: 'pPersonal', width: 14 },
      { header: '商业授权价', key: 'pCommercial', width: 14 },
      { header: '独家授权价', key: 'pExclusive', width: 14 },
      { header: '浏览数', key: 'viewCount', width: 10 },
      { header: '销量', key: 'saleCount', width: 10 },
      { header: '评分', key: 'rating', width: 10 },
      { header: '上架时间', key: 'createdAt', width: 20 },
    ];
    materials.forEach((m) => {
      ws.addRow({
        title: m.title,
        category: m.category,
        photographer: m.photographer?.name || '',
        status: m.status,
        pPersonal: m.pricePersonal,
        pCommercial: m.priceCommercial,
        pExclusive: m.priceExclusive || '-',
        viewCount: m.viewCount,
        saleCount: m.saleCount,
        rating: m.averageRating,
        createdAt: new Date(m.createdAt).toLocaleString(),
      });
    });
    return wb;
  }

  private async exportSatisfaction(startDate: Date, endDate: Date, photographerId?: string): Promise<ExcelJS.Workbook> {
    const qb = this.ordersRepository
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.client', 'client')
      .leftJoinAndSelect('o.photographer', 'photographer')
      .where('o.satisfactionLevel IS NOT NULL')
      .andWhere('o.createdAt BETWEEN :start AND :end', { start: startDate, end: endDate });
    if (photographerId) qb.andWhere('o.photographerId = :pid', { pid: photographerId });
    const list = await qb.getMany();

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('满意度报表');
    ws.columns = [
      { header: '订单号', key: 'orderNo', width: 22 },
      { header: '客户', key: 'client', width: 15 },
      { header: '摄影师', key: 'photographer', width: 15 },
      { header: '满意度', key: 'satisfaction', width: 12 },
      { header: '反馈内容', key: 'feedback', width: 40 },
      { header: '评价时间', key: 'time', width: 20 },
    ];
    list.forEach((o) => {
      ws.addRow({
        orderNo: o.orderNo,
        client: o.client?.name || '',
        photographer: o.photographer?.name || '',
        satisfaction: `${o.satisfactionLevel}星`,
        feedback: o.satisfactionFeedback || '',
        time: o.updatedAt ? new Date(o.updatedAt).toLocaleString() : '',
      });
    });
    return wb;
  }

  private getDateRange(query: StatisticsQueryDto) {
    const startDate = query.startDate ? new Date(query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    return {
      startDate,
      endDate,
      photographerId: query.photographerId,
      granularity: query.granularity || 'day',
      satisfactionLevel: query.satisfactionLevel,
    };
  }

  private formatDate(d: Date): string {
    const dt = d instanceof Date ? d : new Date(d);
    return `${dt.getFullYear()}${(dt.getMonth() + 1).toString().padStart(2, '0')}${dt.getDate().toString().padStart(2, '0')}`;
  }
}
