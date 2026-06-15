import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('cash_forecasts')
export class CashForecast extends BaseEntity {
  @Column({ type: 'varchar', length: 7 })
  @Index()
  forecastPeriod: string;

  @Column({ type: 'date' })
  forecastDate: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  openingBalance: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  expectedReceivables: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  expectedPayables: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  otherIncome: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  otherExpenses: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  projectedClosingBalance: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  projectedCashGap: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  actualClosingBalance: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  actualCashGap: number;

  @Column({ type: 'jsonb', nullable: true })
  reconciliationNotes: {
    variance: number;
    reason: string;
    category: string;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  billBreakdown: {
    billId: string;
    billNumber: string;
    customerName: string;
    expectedAmount: number;
    actualAmount: number;
    variance: number;
    status: string;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  assumptions: string[];

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ default: 'draft' })
  status: 'draft' | 'finalized' | 'reconciled';
}
