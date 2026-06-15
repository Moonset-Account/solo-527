import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CollectionRhythm, CollectionRecord, Bill } from '@/database/entities';
import {
  CreateCollectionRhythmDto,
  UpdateCollectionRhythmDto,
  CreateCollectionRecordDto,
  UpdateCollectionRecordDto,
  CollectionFilterDto,
  RhythmFilterDto,
} from './dto/collection.dto';

@Injectable()
export class CollectionService {
  constructor(
    @InjectRepository(CollectionRhythm)
    private rhythmRepository: Repository<CollectionRhythm>,
    @InjectRepository(CollectionRecord)
    private recordRepository: Repository<CollectionRecord>,
    @InjectRepository(Bill)
    private billRepository: Repository<Bill>,
    private dataSource: DataSource,
  ) {}

  async createRhythm(dto: CreateCollectionRhythmDto, userId?: string): Promise<CollectionRhythm> {
    const rhythm = this.rhythmRepository.create({
      ...dto,
      createdBy: userId,
      updatedBy: userId,
    });
    return this.rhythmRepository.save(rhythm);
  }

  async findAllRhythms(filters: RhythmFilterDto): Promise<{ data: CollectionRhythm[]; total: number }> {
    const queryBuilder = this.rhythmRepository.createQueryBuilder('rhythm');

    if (filters.severity && filters.severity.length > 0) {
      queryBuilder.andWhere('rhythm.severity IN (:...severity)', { severity: filters.severity });
    }

    if (filters.channel && filters.channel.length > 0) {
      queryBuilder.andWhere('rhythm.channel IN (:...channel)', { channel: filters.channel });
    }

    if (filters.isActive !== undefined) {
      queryBuilder.andWhere('rhythm.isActive = :isActive', { isActive: filters.isActive });
    }

    queryBuilder.orderBy('rhythm.priority', 'ASC');
    queryBuilder.addOrderBy('rhythm.daysOverdue', 'ASC');

    queryBuilder.skip((filters.page - 1) * filters.limit);
    queryBuilder.take(filters.limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }

  async findOneRhythm(id: string): Promise<CollectionRhythm> {
    const rhythm = await this.rhythmRepository.findOne({ where: { id } });
    if (!rhythm) throw new NotFoundException('Collection rhythm not found');
    return rhythm;
  }

  async updateRhythm(id: string, dto: UpdateCollectionRhythmDto, userId?: string): Promise<CollectionRhythm> {
    const rhythm = await this.findOneRhythm(id);
    const updated = this.rhythmRepository.merge(rhythm, { ...dto, updatedBy: userId });
    return this.rhythmRepository.save(updated);
  }

  async createRecord(dto: CreateCollectionRecordDto, userId?: string): Promise<CollectionRecord> {
    const bill = await this.billRepository.findOne({ where: { id: dto.billId } });
    if (!bill) throw new NotFoundException('Bill not found');

    const record = this.recordRepository.create({
      ...dto,
      createdBy: userId,
      updatedBy: userId,
    });
    return this.recordRepository.save(record);
  }

  async findAllRecords(filters: CollectionFilterDto): Promise<{ data: CollectionRecord[]; total: number }> {
    const queryBuilder = this.recordRepository.createQueryBuilder('record')
      .leftJoinAndSelect('record.bill', 'bill')
      .leftJoinAndSelect('bill.customer', 'customer')
      .leftJoinAndSelect('record.rhythm', 'rhythm');

    if (filters.billId) {
      queryBuilder.andWhere('record.billId = :billId', { billId: filters.billId });
    }

    if (filters.rhythmId) {
      queryBuilder.andWhere('record.rhythmId = :rhythmId', { rhythmId: filters.rhythmId });
    }

    if (filters.status && filters.status.length > 0) {
      queryBuilder.andWhere('record.status IN (:...status)', { status: filters.status });
    }

    if (filters.severity && filters.severity.length > 0) {
      queryBuilder.andWhere('record.severity IN (:...severity)', { severity: filters.severity });
    }

    if (filters.channel && filters.channel.length > 0) {
      queryBuilder.andWhere('record.channel IN (:...channel)', { channel: filters.channel });
    }

    if (filters.customerResponse && filters.customerResponse.length > 0) {
      queryBuilder.andWhere('record.customerResponse IN (:...customerResponse)', { customerResponse: filters.customerResponse });
    }

    if (filters.startDate) {
      queryBuilder.andWhere('record.createdAt >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      queryBuilder.andWhere('record.createdAt <= :endDate', { endDate: filters.endDate });
    }

    queryBuilder.orderBy('record.createdAt', 'DESC');
    queryBuilder.skip((filters.page - 1) * filters.limit);
    queryBuilder.take(filters.limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }

  async findOneRecord(id: string): Promise<CollectionRecord> {
    const record = await this.recordRepository.findOne({
      where: { id },
      relations: ['bill', 'bill.customer', 'rhythm'],
    });
    if (!record) throw new NotFoundException('Collection record not found');
    return record;
  }

  async updateRecord(id: string, dto: UpdateCollectionRecordDto, userId?: string): Promise<CollectionRecord> {
    const record = await this.findOneRecord(id);
    const updated = this.recordRepository.merge(record, { ...dto, updatedBy: userId });
    return this.recordRepository.save(updated);
  }

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async generateCollectionTasks() {
    const activeRhythms = await this.rhythmRepository.find({
      where: { isActive: true },
      order: { daysOverdue: 'ASC', priority: 'ASC' },
    });

    for (const rhythm of activeRhythms) {
      const overdueBills = await this.billRepository.createQueryBuilder('bill')
        .leftJoinAndSelect('bill.customer', 'customer')
        .where('bill.overdueDays >= :minDays', { minDays: rhythm.daysOverdue })
        .andWhere('bill.status IN (:...statuses)', { statuses: ['overdue', 'partial'] })
        .andWhere('bill.remainingAmount > 0')
        .andWhere(qb => {
          const subQuery = qb.subQuery()
            .select('1')
            .from('collection_records', 'cr')
            .where('cr.billId = bill.id')
            .andWhere('cr.rhythmId = :rhythmId')
            .andWhere('cr.createdAt >= :dateThreshold')
            .getQuery();
          return `NOT EXISTS (${subQuery})`;
        })
        .setParameter('rhythmId', rhythm.id)
        .setParameter('dateThreshold', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
        .getMany();

      for (const bill of overdueBills) {
        const content = this.renderTemplate(rhythm.template, {
          customerName: bill.customer.name,
          billNumber: bill.billNumber,
          amount: bill.remainingAmount,
          dueDate: bill.dueDate,
          overdueDays: bill.overdueDays,
        });

        await this.recordRepository.save({
          billId: bill.id,
          rhythmId: rhythm.id,
          status: 'pending',
          severity: rhythm.severity,
          channel: rhythm.channel,
          customerResponse: 'no_response',
          scheduledDate: new Date(),
          content,
          notes: `Auto-generated based on rhythm: ${rhythm.name}`,
        });
      }
    }
  }

  private renderTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] || '');
  }

  async getStatistics(): Promise<any> {
    const statusCounts = await this.recordRepository.createQueryBuilder('record')
      .select('record.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('record.status')
      .getRawMany();

    const severityCounts = await this.recordRepository.createQueryBuilder('record')
      .select('record.severity', 'severity')
      .addSelect('COUNT(*)', 'count')
      .groupBy('record.severity')
      .getRawMany();

    const totals = await this.recordRepository.createQueryBuilder('record')
      .select('COUNT(*)', 'totalRecords')
      .addSelect('COUNT(CASE WHEN record.status = \'completed\' THEN 1 END)', 'completedCount')
      .addSelect('COUNT(CASE WHEN record.customerResponse = \'promised_to_pay\' THEN 1 END)', 'promisedCount')
      .getRawOne();

    return {
      summary: {
        totalRecords: parseInt(totals.totalRecords || 0),
        completedCount: parseInt(totals.completedCount || 0),
        promisedCount: parseInt(totals.promisedCount || 0),
      },
      byStatus: statusCounts.map(s => ({ status: s.status, count: parseInt(s.count) }),
      bySeverity: severityCounts.map(s => ({ severity: s.severity, count: parseInt(s.count) })),
    };
  }
}
