import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as XLSX from 'xlsx';
import * as PDFDocument from 'pdfkit';
import { createWriteStream, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ExportQueue, Bill, CollectionRecord, CashForecast, Reconciliation, Invoice } from '@/database/entities';
import { format } from 'date-fns';

@Processor('export')
export class ExportProcessor {
  constructor(
    @InjectRepository(ExportQueue)
    private exportQueueRepository: Repository<ExportQueue>,
    @InjectRepository(Bill)
    private billRepository: Repository<Bill>,
    @InjectRepository(CollectionRecord)
    private collectionRepository: Repository<CollectionRecord>,
    @InjectRepository(CashForecast)
    private cashForecastRepository: Repository<CashForecast>,
    @InjectRepository(Reconciliation)
    private reconciliationRepository: Repository<Reconciliation>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
  ) {}

  @Process()
  async processExport(job: Job<{ exportId: string }>) {
    const { exportId } = job.data;
    const exportQueue = await this.exportQueueRepository.findOne({ where: { id: exportId } });

    if (!exportQueue) return;

    try {
      exportQueue.status = 'processing';
      exportQueue.startedAt = new Date();
      await this.exportQueueRepository.save(exportQueue);

      const data = await this.fetchData(exportQueue);
      const summary = this.calculateSummary(exportQueue.type, data);

      const filePath = await this.generateFile(exportQueue, data, summary);

      exportQueue.status = 'completed';
      exportQueue.completedAt = new Date();
      exportQueue.storagePath = filePath;
      exportQueue.downloadUrl = `/exports/${exportQueue.id}/download`;
      exportQueue.recordCount = data.length;
      exportQueue.exportSummary = summary;

      await this.exportQueueRepository.save(exportQueue);
    } catch (error) {
      exportQueue.status = 'failed';
      exportQueue.errorMessage = error.message;
      exportQueue.errorDetails = { stack: error.stack };
      await this.exportQueueRepository.save(exportQueue);
    }
  }

  private async fetchData(exportQueue: ExportQueue): Promise<any[]> {
    const filters = exportQueue.filters || {};

    switch (exportQueue.type) {
      case 'bills':
        return this.fetchBills(filters);
      case 'collections':
        return this.fetchCollections(filters);
      case 'cash_forecast':
        return this.fetchCashForecasts(filters);
      case 'reconciliation':
        return this.fetchReconciliations(filters);
      case 'invoices':
        return this.fetchInvoices(filters);
      default:
        return [];
    }
  }

  private async fetchBills(filters: any): Promise<any[]> {
    const queryBuilder = this.billRepository.createQueryBuilder('bill')
      .leftJoinAndSelect('bill.customer', 'customer')
      .leftJoinAndSelect('bill.subscription', 'subscription')
      .leftJoinAndSelect('bill.statusHistory', 'statusHistory');

    if (filters.status) queryBuilder.andWhere('bill.status IN (:...status)', { status: filters.status });
    if (filters.startDate) queryBuilder.andWhere('bill.dueDate >= :startDate', { startDate: filters.startDate });
    if (filters.endDate) queryBuilder.andWhere('bill.dueDate <= :endDate', { endDate: filters.endDate });

    const bills = await queryBuilder.getMany();
    return bills.map(bill => ({
      billNumber: bill.billNumber,
      customerName: bill.customer?.name,
      customerEmail: bill.customer?.email,
      subscriptionPlan: bill.subscription?.planName,
      totalAmount: bill.totalAmount,
      paidAmount: bill.paidAmount,
      remainingAmount: bill.remainingAmount,
      currency: bill.currency,
      issueDate: format(bill.issueDate, 'yyyy-MM-dd'),
      dueDate: format(bill.dueDate, 'yyyy-MM-dd'),
      status: bill.status,
      overdueDays: bill.overdueDays,
      lastStatusChange: bill.statusHistory?.[0]?.createdAt ? format(bill.statusHistory[0].createdAt, 'yyyy-MM-dd HH:mm') : null,
      createdAt: format(bill.createdAt, 'yyyy-MM-dd HH:mm'),
      updatedAt: format(bill.updatedAt, 'yyyy-MM-dd HH:mm'),
    }));
  }

  private async fetchCollections(filters: any): Promise<any[]> {
    const queryBuilder = this.collectionRepository.createQueryBuilder('record')
      .leftJoinAndSelect('record.bill', 'bill')
      .leftJoinAndSelect('bill.customer', 'customer')
      .leftJoinAndSelect('record.rhythm', 'rhythm');

    if (filters.status) queryBuilder.andWhere('record.status IN (:...status)', { status: filters.status });
    if (filters.startDate) queryBuilder.andWhere('record.createdAt >= :startDate', { startDate: filters.startDate });
    if (filters.endDate) queryBuilder.andWhere('record.createdAt <= :endDate', { endDate: filters.endDate });

    const records = await queryBuilder.getMany();
    return records.map(record => ({
      customerName: record.bill?.customer?.name,
      billNumber: record.bill?.billNumber,
      billAmount: record.bill?.totalAmount,
      billRemaining: record.bill?.remainingAmount,
      rhythmName: record.rhythm?.name,
      severity: record.severity,
      channel: record.channel,
      status: record.status,
      customerResponse: record.customerResponse,
      promisedAmount: record.promisedAmount,
      promisedPaymentDate: record.promisedPaymentDate ? format(record.promisedPaymentDate, 'yyyy-MM-dd') : null,
      scheduledDate: record.scheduledDate ? format(record.scheduledDate, 'yyyy-MM-dd') : null,
      contactDate: record.contactDate ? format(record.contactDate, 'yyyy-MM-dd HH:mm') : null,
      notes: record.notes,
      createdAt: format(record.createdAt, 'yyyy-MM-dd HH:mm'),
    }));
  }

  private async fetchCashForecasts(filters: any): Promise<any[]> {
    const queryBuilder = this.cashForecastRepository.createQueryBuilder('forecast');
    if (filters.period) queryBuilder.andWhere('forecast.forecastPeriod = :period', { period: filters.period });

    const forecasts = await queryBuilder.getMany();
    return forecasts.map(forecast => ({
      forecastPeriod: forecast.forecastPeriod,
      forecastDate: format(forecast.forecastDate, 'yyyy-MM-dd'),
      openingBalance: forecast.openingBalance,
      expectedReceivables: forecast.expectedReceivables,
      expectedPayables: forecast.expectedPayables,
      otherIncome: forecast.otherIncome,
      otherExpenses: forecast.otherExpenses,
      projectedClosingBalance: forecast.projectedClosingBalance,
      projectedCashGap: forecast.projectedCashGap,
      actualClosingBalance: forecast.actualClosingBalance,
      actualCashGap: forecast.actualCashGap,
      reconciliationVariance: forecast.projectedClosingBalance - forecast.actualClosingBalance,
      status: forecast.status,
      createdAt: format(forecast.createdAt, 'yyyy-MM-dd HH:mm'),
      updatedAt: format(forecast.updatedAt, 'yyyy-MM-dd HH:mm'),
    }));
  }

  private async fetchReconciliations(filters: any): Promise<any[]> {
    const queryBuilder = this.reconciliationRepository.createQueryBuilder('reconciliation');
    if (filters.period) queryBuilder.andWhere('reconciliation.period = :period', { period: filters.period });

    const reconciliations = await queryBuilder.getMany();
    return reconciliations.map(rec => ({
      period: rec.period,
      periodStartDate: format(rec.periodStartDate, 'yyyy-MM-dd'),
      periodEndDate: format(rec.periodEndDate, 'yyyy-MM-dd'),
      systemBillsTotal: rec.systemBillsTotal,
      bankDepositsTotal: rec.bankDepositsTotal,
      totalVariance: rec.totalVariance,
      reconciledVariance: rec.reconciledVariance,
      unreconciledVariance: rec.unreconciledVariance,
      totalBills: rec.totalBills,
      matchedBills: rec.matchedBills,
      unmatchedBills: rec.unmatchedBills,
      pendingBills: rec.pendingBills,
      status: rec.status,
      createdAt: format(rec.createdAt, 'yyyy-MM-dd HH:mm'),
    }));
  }

  private async fetchInvoices(filters: any): Promise<any[]> {
    const queryBuilder = this.invoiceRepository.createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.bill', 'bill');

    if (filters.status) queryBuilder.andWhere('invoice.status IN (:...status)', { status: filters.status });
    if (filters.startDate) queryBuilder.andWhere('invoice.invoiceDate >= :startDate', { startDate: filters.startDate });
    if (filters.endDate) queryBuilder.andWhere('invoice.invoiceDate <= :endDate', { endDate: filters.endDate });

    const invoices = await queryBuilder.getMany();
    return invoices.map(invoice => ({
      invoiceNumber: invoice.invoiceNumber,
      billNumber: invoice.bill?.billNumber,
      amount: invoice.amount,
      currency: invoice.currency,
      invoiceDate: format(invoice.invoiceDate, 'yyyy-MM-dd'),
      dueDate: invoice.dueDate ? format(invoice.dueDate, 'yyyy-MM-dd') : null,
      status: invoice.status,
      recipientEmail: invoice.recipientEmail,
      sentDate: invoice.sentDate ? format(invoice.sentDate, 'yyyy-MM-dd HH:mm') : null,
      paidDate: invoice.paidDate ? format(invoice.paidDate, 'yyyy-MM-dd HH:mm') : null,
      createdAt: format(invoice.createdAt, 'yyyy-MM-dd HH:mm'),
    }));
  }

  private calculateSummary(type: string, data: any[]): any {
    const summary: any = {
      lastChangeDate: new Date(),
      totalRecords: data.length,
    };

    if (type === 'bills') {
      summary.totalAmount = data.reduce((sum, d) => sum + (d.totalAmount || 0), 0);
      summary.paidAmount = data.reduce((sum, d) => sum + (d.paidAmount || 0), 0);
      summary.overdueAmount = data.filter(d => d.status === 'overdue').reduce((sum, d) => sum + (d.remainingAmount || 0), 0);
    }

    if (type === 'cash_forecast') {
      const lastForecast = data[data.length - 1];
      if (lastForecast) {
        summary.cashGap = lastForecast.actualCashGap || lastForecast.projectedCashGap;
        summary.reconciliationVariance = lastForecast.reconciliationVariance;
      }
    }

    if (type === 'reconciliation') {
      const lastReconciliation = data[data.length - 1];
      if (lastReconciliation) {
        summary.reconciliationVariance = lastReconciliation.totalVariance;
      }
    }

    return summary;
  }

  private async generateFile(exportQueue: ExportQueue, data: any[], summary: any): Promise<string> {
    const exportDir = join(process.cwd(), 'exports');
    if (!existsSync(exportDir)) mkdirSync(exportDir, { recursive: true });

    const fileName = `${exportQueue.type}_${format(new Date(), 'yyyyMMdd_HHmmss')}_${uuidv4().substring(0, 8)}.${exportQueue.format}`;
    const filePath = join(exportDir, fileName);

    exportQueue.fileName = fileName;
    await this.exportQueueRepository.save(exportQueue);

    switch (exportQueue.format) {
      case 'xlsx':
        await this.generateExcel(filePath, data, summary);
        break;
      case 'csv':
        await this.generateCSV(filePath, data);
        break;
      case 'pdf':
        await this.generatePDF(filePath, data, summary, exportQueue.type);
        break;
    }

    return filePath;
  }

  private async generateExcel(filePath: string, data: any[], summary: any): Promise<void> {
    const wb = XLSX.utils.book_new();

    const summaryData = [
      { Item: 'Export Summary', Value: '' },
      { Item: 'Total Records', Value: summary.totalRecords },
      ...(summary.totalAmount !== undefined ? [{ Item: 'Total Amount', Value: summary.totalAmount }] : []),
      ...(summary.paidAmount !== undefined ? [{ Item: 'Paid Amount', Value: summary.paidAmount }] : []),
      ...(summary.overdueAmount !== undefined ? [{ Item: 'Overdue Amount', Value: summary.overdueAmount }] : []),
      ...(summary.cashGap !== undefined ? [{ Item: 'Cash Gap', Value: summary.cashGap }] : []),
      ...(summary.reconciliationVariance !== undefined ? [{ Item: 'Reconciliation Variance', Value: summary.reconciliationVariance }] : []),
      { Item: 'Last Change Date', Value: summary.lastChangeDate },
    ];

    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    const wsData = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, wsData, 'Data');

    XLSX.writeFile(wb, filePath);
  }

  private async generateCSV(filePath: string, data: any[]): Promise<void> {
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    require('fs').writeFileSync(filePath, csv);
  }

  private async generatePDF(filePath: string, data: any[], summary: any, type: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' });
      const stream = createWriteStream(filePath);

      doc.pipe(stream);

      doc.fontSize(18).text(`Export Report: ${type.toUpperCase().replace('_', ' ')}`, { align: 'center' });
      doc.moveDown();

      doc.fontSize(12).text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`);
      doc.moveDown();

      doc.fontSize(14).text('Summary', { underline: true });
      doc.fontSize(10);
      doc.text(`Total Records: ${summary.totalRecords}`);
      if (summary.totalAmount !== undefined) doc.text(`Total Amount: ${summary.totalAmount.toFixed(2)}`);
      if (summary.cashGap !== undefined) doc.text(`Cash Gap: ${summary.cashGap.toFixed(2)}`);
      if (summary.reconciliationVariance !== undefined) doc.text(`Reconciliation Variance: ${summary.reconciliationVariance.toFixed(2)}`);
      doc.moveDown();

      doc.fontSize(14).text('Data Records', { underline: true });
      doc.moveDown();

      if (data.length > 0) {
        const headers = Object.keys(data[0]);
        const colWidth = (doc.page.width - 100) / Math.min(headers.length, 10);
        let y = doc.y;

        doc.fontSize(9);
        headers.slice(0, 10).forEach((header, i) => {
          doc.text(header, 50 + i * colWidth, y, { width: colWidth, align: 'left' });
        });

        y += 20;
        data.slice(0, 100).forEach(row => {
          if (y > doc.page.height - 100) {
            doc.addPage();
            y = 50;
          }
          headers.slice(0, 10).forEach((header, i) => {
            const value = row[header]?.toString() || '';
            doc.text(value, 50 + i * colWidth, y, { width: colWidth, align: 'left' });
          });
          y += 15;
        });

        if (data.length > 100) {
          doc.moveDown().text(`... and ${data.length - 100} more records`, { align: 'center' });
        }
      }

      doc.end();
      stream.on('finish', resolve);
      stream.on('error', reject);
    });
  }
}
