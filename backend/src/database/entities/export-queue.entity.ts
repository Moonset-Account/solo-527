import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

export type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ExportFormat = 'xlsx' | 'csv' | 'pdf';
export type ExportType = 'bills' | 'collections' | 'cash_forecast' | 'reconciliation' | 'invoices';

@Entity('export_queues')
export class ExportQueue extends BaseEntity {
  @Column({
    type: 'enum',
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  })
  @Index()
  status: ExportStatus;

  @Column({
    type: 'enum',
    enum: ['bills', 'collections', 'cash_forecast', 'reconciliation', 'invoices']
  })
  type: ExportType;

  @Column({
    type: 'enum',
    enum: ['xlsx', 'csv', 'pdf'],
    default: 'xlsx'
  })
  format: ExportFormat;

  @Column({ type: 'jsonb', nullable: true })
  filters: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  columns: string[];

  @Column({ type: 'text', nullable: true })
  fileName: string;

  @Column({ type: 'text', nullable: true })
  storagePath: string;

  @Column({ type: 'text', nullable: true })
  downloadUrl: string;

  @Column({ type: 'bigint', nullable: true })
  fileSize: number;

  @Column({ type: 'int', nullable: true })
  recordCount: number;

  @Column({ type: 'timestamp with time zone', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  completedAt: Date;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'jsonb', nullable: true })
  errorDetails: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  exportSummary: {
    reconciliationVariance?: number;
    cashGap?: number;
    lastChangeDate?: Date;
    lastChangeBy?: string;
    totalAmount?: number;
    paidAmount?: number;
    overdueAmount?: number;
  };

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @Column({ type: 'timestamp with time zone', nullable: true })
  expiresAt: Date;
}
