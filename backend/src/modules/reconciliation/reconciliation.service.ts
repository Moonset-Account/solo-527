import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { Reconciliation, Bill, CashForecast, CollectionRecord, Invoice, Attachment } from '@/database/entities';

@Injectable()
export class ReconciliationService {
  constructor(
    @InjectRepository(Reconciliation)
    private reconciliationRepository: Repository<Reconciliation>,
    @InjectRepository(Bill)
    private billRepository: Repository<Bill>,
    @InjectRepository(CashForecast)
    private cashForecastRepository: Repository<CashForecast>,
    private dataSource: DataSource,
  ) {}

  async create(period: string, userId?: string): Promise<Reconciliation> {
    const existing = await this.reconciliationRepository.findOne({ where: { period } });
    if (existing) {
      throw new BadRequestException(`Reconciliation for period ${period} already exists`);
    }

    const [year, month] = period.split('-').map(Number);
    const periodStart = startOfMonth(new Date(year, month - 1));
    const periodEnd = endOfMonth(new Date(year, month - 1));

    const bills = await this.billRepository.createQueryBuilder('bill')
      .leftJoinAndSelect('bill.customer', 'customer')
      .where('bill.issueDate BETWEEN :start AND :end', { start: periodStart, end: periodEnd })
      .andWhere('bill.status NOT IN (:...excluded)', { excluded: ['draft', 'cancelled'] })
      .getMany();

    const systemTotal = bills.reduce((sum, b) => sum + Number(b.paidAmount || 0), 0);

    const matchedItems = bills
      .filter(b => b.status === 'paid')
      .map(b => ({
        billId: b.id,
        billNumber: b.billNumber,
        customerName: b.customer?.name || '',
        systemAmount: Number(b.paidAmount),
        bankAmount: Number(b.paidAmount),
        variance: 0,
        matchedDate: new Date(),
      }));

    const unmatchedItems = bills
      .filter(b => b.status !== 'paid')
      .map(b => ({
        type: 'bill' as const,
        reference: b.billNumber,
        amount: Number(b.remainingAmount),
        date: b.dueDate,
        description: `Bill ${b.billNumber} - ${b.status}`,
      }));

    const totalVariance = systemTotal - matchedItems.reduce((sum, m) => sum + m.bankAmount, 0);

    const reconciliation = this.reconciliationRepository.create({
      period,
      periodStartDate: periodStart,
      periodEndDate: periodEnd,
      status: 'draft',
      systemBillsTotal: systemTotal,
      bankDepositsTotal: matchedItems.reduce((sum, m) => sum + m.bankAmount, 0),
      totalVariance,
      reconciledVariance: 0,
      unreconciledVariance: totalVariance,
      totalBills: bills.length,
      matchedBills: matchedItems.length,
      unmatchedBills: unmatchedItems.length,
      pendingBills: bills.filter(b => b.status === 'pending' || b.status === 'partial').length,
      matchedItems,
      unmatchedItems,
      varianceBreakdown: [],
      linkedRecords: [],
      createdBy: userId,
      updatedBy: userId,
    });

    return this.reconciliationRepository.save(reconciliation);
  }

  async findAll(page: number = 1, limit: number = 50): Promise<{ data: Reconciliation[]; total: number }> {
    const [data, total] = await this.reconciliationRepository.findAndCount({
      order: { period: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async findOne(id: string): Promise<Reconciliation> {
    const reconciliation = await this.reconciliationRepository.findOne({ where: { id } });
    if (!reconciliation) throw new NotFoundException('Reconciliation not found');
    return reconciliation;
  }

  async linkRecord(id: string, linkData: {
    entityType: string;
    entityId: string;
    entityName: string;
    amount: number;
    notes?: string;
  }, userId?: string): Promise<Reconciliation> {
    const reconciliation = await this.findOne(id);

    if (reconciliation.status === 'approved') {
      throw new BadRequestException('Cannot modify approved reconciliation');
    }

    const existingIndex = reconciliation.linkedRecords?.findIndex(
      r => r.entityType === linkData.entityType && r.entityId === linkData.entityId
    );

    if (existingIndex >= 0) {
      reconciliation.linkedRecords[existingIndex] = linkData;
    } else {
      reconciliation.linkedRecords = [
        ...(reconciliation.linkedRecords || []),
        linkData,
      ];
    }

    reconciliation.updatedBy = userId;
    return this.reconciliationRepository.save(reconciliation);
  }

  async addVariance(id: string, varianceData: {
    category: string;
    amount: number;
    description: string;
    resolved: boolean;
    resolution?: string;
  }, userId?: string): Promise<Reconciliation> {
    const reconciliation = await this.findOne(id);

    if (reconciliation.status === 'approved') {
      throw new BadRequestException('Cannot modify approved reconciliation');
    }

    reconciliation.varianceBreakdown = [
      ...(reconciliation.varianceBreakdown || []),
      varianceData,
    ];

    if (varianceData.resolved) {
      reconciliation.reconciledVariance = Number(reconciliation.reconciledVariance) + Number(varianceData.amount);
      reconciliation.unreconciledVariance = Number(reconciliation.unreconciledVariance) - Number(varianceData.amount);
    }

    reconciliation.updatedBy = userId;
    return this.reconciliationRepository.save(reconciliation);
  }

  async updateStatus(id: string, status: 'draft' | 'in_progress' | 'completed' | 'approved', notes?: string, userId?: string): Promise<Reconciliation> {
    const reconciliation = await this.findOne(id);

    if (reconciliation.status === 'approved' && status !== 'approved') {
      throw new BadRequestException('Cannot revert approved reconciliation');
    }

    reconciliation.status = status;
    reconciliation.updatedBy = userId;

    if (notes !== undefined) {
      reconciliation.notes = notes;
    }

    if (status === 'approved') {
      reconciliation.approvedBy = userId;
      reconciliation.approvedAt = new Date();
    }

    return this.reconciliationRepository.save(reconciliation);
  }

  async getLinkedRecords(id: string): Promise<any> {
    const reconciliation = await this.findOne(id);

    const bills = await this.billRepository.createQueryBuilder('bill')
      .leftJoinAndSelect('bill.customer', 'customer')
      .leftJoinAndSelect('bill.statusHistory', 'statusHistory')
      .leftJoinAndSelect('bill.collectionRecords', 'collectionRecords')
      .leftJoinAndSelect('bill.attachments', 'attachments')
      .where('bill.issueDate BETWEEN :start AND :end', {
        start: reconciliation.periodStartDate,
        end: reconciliation.periodEndDate,
      })
      .getMany();

    const cashForecasts = await this.cashForecastRepository.find({
      where: { forecastPeriod: reconciliation.period },
    });

    const collectionRecords = await this.dataSource.getRepository(CollectionRecord)
      .createQueryBuilder('cr')
      .leftJoinAndSelect('cr.bill', 'bill')
      .leftJoinAndSelect('cr.rhythm', 'rhythm')
      .where('cr.createdAt BETWEEN :start AND :end', {
        start: reconciliation.periodStartDate,
        end: reconciliation.periodEndDate,
      })
      .getMany();

    const invoices = await this.dataSource.getRepository(Invoice)
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.bill', 'bill')
      .where('invoice.invoiceDate BETWEEN :start AND :end', {
        start: reconciliation.periodStartDate,
        end: reconciliation.periodEndDate,
      })
      .getMany();

    const attachments = await this.dataSource.getRepository(Attachment)
      .createQueryBuilder('attachment')
      .where('attachment.entityType = :entityType', { entityType: 'reconciliation' })
      .andWhere('attachment.entityId = :entityId', { entityId: id })
      .getMany();

    return {
      reconciliation,
      bills: bills.map(b => ({
        ...b,
        attachments: b.attachments?.map(a => ({
          id: a.id,
          fileName: a.fileName,
          originalName: a.originalName,
          description: a.description,
        })),
      })),
      cashForecasts,
      collectionRecords,
      invoices,
      attachments,
      linkedRecords: reconciliation.linkedRecords,
    };
  }

  async getStatistics(): Promise<any> {
    const periods = await this.reconciliationRepository.find({
      order: { period: 'DESC' },
      take: 12,
    });

    return {
      totalReconciliations: periods.length,
      approvedCount: periods.filter(p => p.status === 'approved').length,
      inProgressCount: periods.filter(p => p.status === 'in_progress').length,
      totalVariance: periods.reduce((sum, p) => sum + Number(p.totalVariance || 0), 0),
      unreconciledVariance: periods.reduce((sum, p) => sum + Number(p.unreconciledVariance || 0), 0),
      byPeriod: periods.map(p => ({
        period: p.period,
        status: p.status,
        systemBillsTotal: p.systemBillsTotal,
        bankDepositsTotal: p.bankDepositsTotal,
        totalVariance: p.totalVariance,
        matchedRate: p.totalBills > 0 ? ((p.matchedBills / p.totalBills) * 100).toFixed(1) + '%' : '0%',
      })),
    };
  }
}
