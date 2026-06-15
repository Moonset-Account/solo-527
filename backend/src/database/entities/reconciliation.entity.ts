import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

export type ReconciliationStatus = 'draft' | 'in_progress' | 'completed' | 'approved';

@Entity('reconciliations')
export class Reconciliation extends BaseEntity {
  @Column({ type: 'varchar', length: 7 })
  @Index()
  period: string;

  @Column({ type: 'date' })
  periodStartDate: Date;

  @Column({ type: 'date' })
  periodEndDate: Date;

  @Column({
    type: 'enum',
    enum: ['draft', 'in_progress', 'completed', 'approved'],
    default: 'draft'
  })
  status: ReconciliationStatus;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  systemBillsTotal: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  bankDepositsTotal: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalVariance: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  reconciledVariance: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  unreconciledVariance: number;

  @Column({ type: 'int', default: 0 })
  totalBills: number;

  @Column({ type: 'int', default: 0 })
  matchedBills: number;

  @Column({ type: 'int', default: 0 })
  unmatchedBills: number;

  @Column({ type: 'int', default: 0 })
  pendingBills: number;

  @Column({ type: 'jsonb', nullable: true })
  matchedItems: {
    billId: string;
    billNumber: string;
    customerName: string;
    systemAmount: number;
    bankAmount: number;
    variance: number;
    matchedDate: Date;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  unmatchedItems: {
    type: 'bill' | 'bank';
    reference: string;
    amount: number;
    date: Date;
    description: string;
    suggestedMatch?: string;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  varianceBreakdown: {
    category: string;
    amount: number;
    description: string;
    resolved: boolean;
    resolution?: string;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  linkedRecords: {
    entityType: string;
    entityId: string;
    entityName: string;
    amount: number;
    notes?: string;
  }[];

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'uuid', nullable: true })
  approvedBy: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  approvedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  cashForecastId: string;
}
